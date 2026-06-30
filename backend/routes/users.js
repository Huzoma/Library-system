// ============================================================
// LIBRARY MANAGEMENT SYSTEM - Users (Members) Routes
// Group 4 | backend/routes/users.js
// ============================================================

const express = require('express');
const router  = express.Router();
const { getDb } = require('../db');

// Generate member ID:  LIB-YYYY-NNN
function generateMemberId(db) {
  const year = new Date().getFullYear();
  const last = db.prepare(
    "SELECT member_id FROM users WHERE member_id LIKE ? ORDER BY member_id DESC LIMIT 1"
  ).get(`LIB-${year}-%`);

  if (!last) return `LIB-${year}-001`;
  const num = parseInt(last.member_id.split('-')[2]) + 1;
  return `LIB-${year}-${String(num).padStart(3, '0')}`;
}

// GET /api/users  – list all (optional search)
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { q, status, user_type } = req.query;

    let sql    = 'SELECT * FROM users WHERE 1=1';
    const params = [];

    if (q) {
      sql += ' AND (LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ? OR member_id LIKE ? OR email LIKE ?)';
      const term = `%${q.toLowerCase()}%`;
      params.push(term, term, `%${q}%`, term);
    }
    if (status)    { sql += ' AND status=?';    params.push(status); }
    if (user_type) { sql += ' AND user_type=?'; params.push(user_type); }

    sql += ' ORDER BY registered_at DESC';
    const rows = db.prepare(sql).all(...params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', (req, res) => {
  try {
    const db  = getDb();
    const row = db.prepare('SELECT * FROM users WHERE user_id=? OR member_id=?')
                  .get(req.params.id, req.params.id);
    if (!row) return res.status(404).json({ success: false, message: 'User not found' });

    // Include borrowing history
    const history = db.prepare(`
      SELECT br.*, b.title, b.isbn,
             CASE WHEN br.return_date IS NULL AND DATE(br.due_date) < DATE('now')
                  THEN 'overdue' ELSE br.status END AS current_status
      FROM borrowings br
      JOIN books b ON br.book_id = b.book_id
      WHERE br.user_id = ?
      ORDER BY br.issue_date DESC
    `).all(row.user_id);

    res.json({ success: true, data: { ...row, borrowing_history: history } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/users  – register new user
router.post('/', (req, res) => {
  try {
    const { first_name, last_name, email, phone, address, user_type } = req.body;
    if (!first_name || !last_name)
      return res.status(400).json({ success: false, message: 'first_name and last_name required' });

    const db       = getDb();
    const memberId = generateMemberId(db);

    const info = db.prepare(`
      INSERT INTO users (member_id, first_name, last_name, email, phone, address, user_type)
      VALUES (?,?,?,?,?,?,?)
    `).run(
      memberId, first_name, last_name,
      email || null, phone || null, address || null,
      user_type || 'student'
    );

    res.status(201).json({
      success: true,
      message: 'User registered',
      user_id:   info.lastInsertRowid,
      member_id: memberId
    });
  } catch (err) {
    if (err.message.includes('UNIQUE'))
      return res.status(409).json({ success: false, message: 'Email already registered' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/users/:id  – update user
router.put('/:id', (req, res) => {
  try {
    const { first_name, last_name, email, phone, address, user_type, status } = req.body;
    const db   = getDb();
    const info = db.prepare(`
      UPDATE users SET first_name=?, last_name=?, email=?, phone=?,
                       address=?, user_type=?, status=?
      WHERE user_id=?
    `).run(first_name, last_name, email || null, phone || null,
           address || null, user_type || 'student', status || 'active',
           req.params.id);

    if (info.changes === 0)
      return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
