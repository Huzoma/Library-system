// ============================================================
// LIBRARY MANAGEMENT SYSTEM - Reports Routes
// Group 4 | backend/routes/reports.js
// ============================================================

const express = require('express');
const router  = express.Router();
const { getDb } = require('../db');

// GET /api/reports/summary  – dashboard summary stats
router.get('/summary', (req, res) => {
  try {
    const db  = getDb();
    const row = db.prepare('SELECT * FROM v_library_summary').get();
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reports/available-books  – books with available copies
router.get('/available-books', (req, res) => {
  try {
    const db   = getDb();
    const rows = db.prepare('SELECT * FROM v_books WHERE available_copies > 0 ORDER BY title').all();
    res.json({ success: true, data: rows, count: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reports/overdue  – overdue books
router.get('/overdue', (req, res) => {
  try {
    const db   = getDb();
    const rows = db.prepare('SELECT * FROM v_overdue_books ORDER BY days_overdue DESC').all();
    res.json({ success: true, data: rows, count: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reports/most-borrowed  – top 10 most issued books
router.get('/most-borrowed', (req, res) => {
  try {
    const db   = getDb();
    const rows = db.prepare(`
      SELECT b.title, b.isbn,
             a.first_name||' '||a.last_name AS author_name,
             COUNT(br.borrowing_id) AS times_borrowed
      FROM borrowings br
      JOIN books b ON br.book_id=b.book_id
      JOIN authors a ON b.author_id=a.author_id
      GROUP BY br.book_id
      ORDER BY times_borrowed DESC
      LIMIT 10
    `).all();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reports/active-members  – members with active loans
router.get('/active-members', (req, res) => {
  try {
    const db   = getDb();
    const rows = db.prepare(`
      SELECT u.member_id, u.first_name||' '||u.last_name AS user_name,
             u.email, u.phone,
             COUNT(br.borrowing_id) AS books_on_loan,
             MAX(CASE WHEN DATE(br.due_date)<DATE('now') THEN 1 ELSE 0 END) AS has_overdue
      FROM users u
      JOIN borrowings br ON u.user_id=br.user_id
      WHERE br.status IN ('issued','overdue')
      GROUP BY u.user_id
      ORDER BY has_overdue DESC, books_on_loan DESC
    `).all();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reports/fines-summary  – fine collection overview
router.get('/fines-summary', (req, res) => {
  try {
    const db  = getDb();
    const row = db.prepare(`
      SELECT
        COUNT(*)                                              AS total_fines,
        SUM(CASE WHEN paid=0 THEN 1 ELSE 0 END)              AS unpaid_count,
        SUM(CASE WHEN paid=1 THEN 1 ELSE 0 END)              AS paid_count,
        ROUND(COALESCE(SUM(CASE WHEN paid=0 THEN total_amount END),0),2) AS unpaid_total,
        ROUND(COALESCE(SUM(CASE WHEN paid=1 THEN total_amount END),0),2) AS collected_total,
        ROUND(COALESCE(SUM(total_amount),0),2)               AS grand_total
      FROM fines
    `).get();
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reports/category-distribution  – books per category
router.get('/category-distribution', (req, res) => {
  try {
    const db   = getDb();
    const rows = db.prepare(`
      SELECT c.name AS category, COUNT(b.book_id) AS book_count,
             SUM(b.total_copies) AS total_copies,
             SUM(b.available_copies) AS available_copies
      FROM categories c
      LEFT JOIN books b ON c.category_id=b.category_id
      GROUP BY c.category_id
      ORDER BY book_count DESC
    `).all();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
