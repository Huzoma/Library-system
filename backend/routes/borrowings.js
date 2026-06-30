// ============================================================
// LIBRARY MANAGEMENT SYSTEM - Borrowings Routes (Issue & Return)
// Group 4 | backend/routes/borrowings.js
// ============================================================

const express = require('express');
const router  = express.Router();
const { getDb } = require('../db');

const LOAN_DAYS    = 14;   // default loan period
const FINE_PER_DAY = 0.50; // fine amount per overdue day

// ── HELPER: add days to a date string ────────────────────────
function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().replace('T', ' ').split('.')[0];
}

// ── HELPER: calculate overdue days ───────────────────────────
function calcOverdueDays(dueDateStr) {
  const due  = new Date(dueDateStr);
  const now  = new Date();
  const diff = Math.floor((now - due) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

// ── GET /api/borrowings  – all borrowings ────────────────────
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { status, user_id, book_id } = req.query;

    let sql    = 'SELECT * FROM v_active_borrowings WHERE 1=1';
    const params = [];

    if (status === 'active')  { /* already filtered by view */ }
    if (user_id) { sql += ' AND user_id IN (SELECT user_id FROM users WHERE user_id=?)'; params.push(user_id); }

    sql += ' ORDER BY due_date ASC';

    // For returned borrowings, query base table instead
    if (status === 'returned') {
      const rows = db.prepare(`
        SELECT br.*, u.member_id, u.first_name||' '||u.last_name AS user_name,
               b.title AS book_title, b.isbn
        FROM borrowings br
        JOIN users u ON br.user_id=u.user_id
        JOIN books b ON br.book_id=b.book_id
        WHERE br.status='returned'
        ORDER BY br.return_date DESC LIMIT 100
      `).all();
      return res.json({ success: true, data: rows });
    }

    const rows = db.prepare(sql).all(...params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/borrowings/issue  – issue a book ───────────────
router.post('/issue', (req, res) => {
  try {
    const { book_id, user_id, issued_by, loan_days } = req.body;
    if (!book_id || !user_id)
      return res.status(400).json({ success: false, message: 'book_id and user_id are required' });

    const db   = getDb();
    const book = db.prepare('SELECT * FROM books WHERE book_id=?').get(book_id);
    const user = db.prepare('SELECT * FROM users WHERE user_id=?').get(user_id);

    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (book.available_copies <= 0)
      return res.status(409).json({ success: false, message: 'No copies available for this book' });
    if (user.status !== 'active')
      return res.status(403).json({ success: false, message: `User account is ${user.status}` });

    // Check user has no unpaid fines
    const unpaidFines = db.prepare(
      'SELECT COALESCE(SUM(total_amount),0) AS total FROM fines WHERE user_id=? AND paid=0'
    ).get(user_id).total;
    if (unpaidFines > 0)
      return res.status(403).json({ success: false, message: `User has unpaid fines of $${unpaidFines.toFixed(2)}. Please settle before issuing.` });

    // Check user doesn't already have this book
    const alreadyIssued = db.prepare(
      "SELECT 1 FROM borrowings WHERE user_id=? AND book_id=? AND status IN ('issued','overdue')"
    ).get(user_id, book_id);
    if (alreadyIssued)
      return res.status(409).json({ success: false, message: 'User already has this book issued' });

    const issueDate = new Date().toISOString().replace('T', ' ').split('.')[0];
    const dueDate   = addDays(issueDate, parseInt(loan_days) || LOAN_DAYS);

    // Transaction: insert borrowing + decrement available_copies
    const tx = db.transaction(() => {
      const info = db.prepare(`
        INSERT INTO borrowings (book_id, user_id, issued_by, issue_date, due_date, status)
        VALUES (?,?,?,?,?,'issued')
      `).run(book_id, user_id, issued_by || 'Librarian', issueDate, dueDate);

      db.prepare('UPDATE books SET available_copies = available_copies - 1 WHERE book_id=?').run(book_id);
      return info.lastInsertRowid;
    });

    const borrowingId = tx();
    res.status(201).json({
      success:      true,
      message:      'Book issued successfully',
      borrowing_id: borrowingId,
      issue_date:   issueDate,
      due_date:     dueDate,
      book_title:   book.title,
      user_name:    `${user.first_name} ${user.last_name}`,
      member_id:    user.member_id
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/borrowings/return  – return a book ─────────────
router.post('/return', (req, res) => {
  try {
    const { borrowing_id } = req.body;
    if (!borrowing_id)
      return res.status(400).json({ success: false, message: 'borrowing_id is required' });

    const db        = getDb();
    const borrowing = db.prepare('SELECT * FROM borrowings WHERE borrowing_id=?').get(borrowing_id);

    if (!borrowing)
      return res.status(404).json({ success: false, message: 'Borrowing record not found' });
    if (borrowing.status === 'returned')
      return res.status(409).json({ success: false, message: 'Book already returned' });

    const returnDate  = new Date().toISOString().replace('T', ' ').split('.')[0];
    const overdueDays = calcOverdueDays(borrowing.due_date);
    const fineAmount  = parseFloat((overdueDays * FINE_PER_DAY).toFixed(2));

    const tx = db.transaction(() => {
      // Mark as returned
      db.prepare(`
        UPDATE borrowings SET status='returned', return_date=? WHERE borrowing_id=?
      `).run(returnDate, borrowing_id);

      // Restore available copy
      db.prepare('UPDATE books SET available_copies = available_copies + 1 WHERE book_id=?')
        .run(borrowing.book_id);

      // Create or update fine if overdue
      let fineId = null;
      if (overdueDays > 0) {
        const existingFine = db.prepare('SELECT * FROM fines WHERE borrowing_id=?').get(borrowing_id);
        if (existingFine) {
          db.prepare('UPDATE fines SET overdue_days=?, total_amount=? WHERE fine_id=?')
            .run(overdueDays, fineAmount, existingFine.fine_id);
          fineId = existingFine.fine_id;
        } else {
          const fi = db.prepare(`
            INSERT INTO fines (borrowing_id, user_id, overdue_days, rate_per_day, total_amount)
            VALUES (?,?,?,?,?)
          `).run(borrowing_id, borrowing.user_id, overdueDays, FINE_PER_DAY, fineAmount);
          fineId = fi.lastInsertRowid;
        }
      }
      return fineId;
    });

    const fineId = tx();

    res.json({
      success:       true,
      message:       overdueDays > 0 ? `Book returned. Fine applied: $${fineAmount}` : 'Book returned successfully',
      return_date:   returnDate,
      overdue_days:  overdueDays,
      fine_amount:   fineAmount,
      fine_id:       fineId
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/borrowings/overdue  – overdue list ───────────────
router.get('/overdue', (req, res) => {
  try {
    const db   = getDb();
    const rows = db.prepare('SELECT * FROM v_overdue_books ORDER BY days_overdue DESC').all();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/borrowings/:id  – single borrowing ───────────────
router.get('/:id', (req, res) => {
  try {
    const db  = getDb();
    const row = db.prepare(`
      SELECT br.*, u.member_id, u.first_name||' '||u.last_name AS user_name,
             u.email, u.phone, b.title AS book_title, b.isbn,
             f.total_amount AS fine_amount, f.paid AS fine_paid
      FROM borrowings br
      JOIN users u ON br.user_id=u.user_id
      JOIN books b ON br.book_id=b.book_id
      LEFT JOIN fines f ON f.borrowing_id=br.borrowing_id
      WHERE br.borrowing_id=?
    `).get(req.params.id);

    if (!row) return res.status(404).json({ success: false, message: 'Borrowing not found' });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
