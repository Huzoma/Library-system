// ============================================================
// LIBRARY MANAGEMENT SYSTEM - Books Routes
// Group 4 | backend/routes/books.js
// ============================================================

const express = require('express');
const router  = express.Router();
const { getDb } = require('../db');

// GET /api/books  – list all books (optionally search)
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { q, category_id, author_id, available } = req.query;

    let sql    = 'SELECT * FROM v_books WHERE 1=1';
    const params = [];

    if (q) {
      sql += ' AND (LOWER(title) LIKE ? OR LOWER(author_name) LIKE ? OR isbn LIKE ?)';
      const term = `%${q.toLowerCase()}%`;
      params.push(term, term, `%${q}%`);
    }
    if (category_id) { sql += ' AND category_name = (SELECT name FROM categories WHERE category_id=?)'; params.push(category_id); }
    if (author_id)   { sql += ' AND book_id IN (SELECT book_id FROM books WHERE author_id=?)'; params.push(author_id); }
    if (available === 'true') { sql += ' AND available_copies > 0'; }

    sql += ' ORDER BY title';
    const rows = db.prepare(sql).all(...params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/books/:id
router.get('/:id', (req, res) => {
  try {
    const db  = getDb();
    const row = db.prepare('SELECT * FROM v_books WHERE book_id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: 'Book not found' });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/books  – register a new book
router.post('/', (req, res) => {
  try {
    const {
      isbn, title, author_id, category_id,
      publisher, publish_year, total_copies, shelf_location, description
    } = req.body;

    if (!isbn || !title || !author_id || !category_id)
      return res.status(400).json({ success: false, message: 'isbn, title, author_id and category_id are required' });

    const copies = parseInt(total_copies) || 1;
    const db     = getDb();

    const info = db.prepare(`
      INSERT INTO books
        (isbn, title, author_id, category_id, publisher, publish_year,
         total_copies, available_copies, shelf_location, description)
      VALUES (?,?,?,?,?,?,?,?,?,?)
    `).run(
      isbn, title, author_id, category_id,
      publisher || null, publish_year || null,
      copies, copies,
      shelf_location || null, description || null
    );

    res.status(201).json({ success: true, message: 'Book registered', book_id: info.lastInsertRowid });
  } catch (err) {
    if (err.message.includes('UNIQUE'))
      return res.status(409).json({ success: false, message: 'ISBN already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/books/:id  – update book details
router.put('/:id', (req, res) => {
  try {
    const {
      isbn, title, author_id, category_id,
      publisher, publish_year, total_copies, shelf_location, description
    } = req.body;

    const db = getDb();

    // Recalculate available_copies if total_copies changed
    const existing = db.prepare('SELECT * FROM books WHERE book_id=?').get(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Book not found' });

    const newTotal    = parseInt(total_copies) || existing.total_copies;
    const issued      = existing.total_copies - existing.available_copies;
    const newAvailable = Math.max(0, newTotal - issued);

    db.prepare(`
      UPDATE books SET
        isbn=?, title=?, author_id=?, category_id=?,
        publisher=?, publish_year=?,
        total_copies=?, available_copies=?,
        shelf_location=?, description=?
      WHERE book_id=?
    `).run(
      isbn || existing.isbn,
      title || existing.title,
      author_id || existing.author_id,
      category_id || existing.category_id,
      publisher || existing.publisher,
      publish_year || existing.publish_year,
      newTotal, newAvailable,
      shelf_location || existing.shelf_location,
      description || existing.description,
      req.params.id
    );

    res.json({ success: true, message: 'Book updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/books/search/available  – books with copies > 0
router.get('/search/available', (req, res) => {
  try {
    const db   = getDb();
    const rows = db.prepare('SELECT * FROM v_books WHERE available_copies > 0 ORDER BY title').all();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
