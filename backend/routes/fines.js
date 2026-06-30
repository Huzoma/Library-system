// ============================================================
// LIBRARY MANAGEMENT SYSTEM - Fines Routes
// Group 4 | backend/routes/fines.js
// ============================================================

const express = require('express');
const router  = express.Router();
const { getDb } = require('../db');

// GET /api/fines  – all fines (filter by paid status)
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { paid, user_id } = req.query;

    let sql = `
      SELECT f.*, u.member_id, u.first_name||' '||u.last_name AS user_name,
             u.phone, b.title AS book_title, b.isbn,
             br.issue_date, br.due_date, br.return_date
      FROM fines f
      JOIN users u      ON f.user_id      = u.user_id
      JOIN borrowings br ON f.borrowing_id = br.borrowing_id
      JOIN books b      ON br.book_id     = b.book_id
      WHERE 1=1
    `;
    const params = [];

    if (paid !== undefined) { sql += ' AND f.paid=?'; params.push(parseInt(paid)); }
    if (user_id)            { sql += ' AND f.user_id=?'; params.push(user_id); }

    sql += ' ORDER BY f.created_at DESC';
    const rows = db.prepare(sql).all(...params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/fines/calculate/:borrowing_id  – estimate fine without paying
router.get('/calculate/:borrowing_id', (req, res) => {
  try {
    const db  = getDb();
    const br  = db.prepare('SELECT * FROM borrowings WHERE borrowing_id=?').get(req.params.borrowing_id);
    if (!br) return res.status(404).json({ success: false, message: 'Borrowing not found' });

    const due     = new Date(br.due_date);
    const now     = new Date();
    const overdue = Math.max(0, Math.floor((now - due) / (1000 * 60 * 60 * 24)));
    const amount  = parseFloat((overdue * 0.50).toFixed(2));

    res.json({
      success:      true,
      borrowing_id: br.borrowing_id,
      due_date:     br.due_date,
      overdue_days: overdue,
      rate_per_day: 0.50,
      estimated_fine: amount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/fines/:id/pay  – mark fine as paid
router.post('/:id/pay', (req, res) => {
  try {
    const db   = getDb();
    const fine = db.prepare('SELECT * FROM fines WHERE fine_id=?').get(req.params.id);
    if (!fine) return res.status(404).json({ success: false, message: 'Fine not found' });
    if (fine.paid) return res.status(409).json({ success: false, message: 'Fine already paid' });

    const paidAt = new Date().toISOString().replace('T', ' ').split('.')[0];
    db.prepare('UPDATE fines SET paid=1, paid_at=? WHERE fine_id=?').run(paidAt, req.params.id);

    res.json({ success: true, message: `Fine of $${fine.total_amount.toFixed(2)} marked as paid`, paid_at: paidAt });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/fines/:id  – single fine
router.get('/:id', (req, res) => {
  try {
    const db  = getDb();
    const row = db.prepare(`
      SELECT f.*, u.member_id, u.first_name||' '||u.last_name AS user_name,
             b.title AS book_title
      FROM fines f
      JOIN users u      ON f.user_id=u.user_id
      JOIN borrowings br ON f.borrowing_id=br.borrowing_id
      JOIN books b      ON br.book_id=b.book_id
      WHERE f.fine_id=?
    `).get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: 'Fine not found' });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
