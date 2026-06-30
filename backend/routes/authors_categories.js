// ============================================================
// LIBRARY MANAGEMENT SYSTEM - Authors & Categories Routes
// Group 4 | backend/routes/authors_categories.js
// ============================================================

const express = require('express');
const router  = express.Router();
const { getDb } = require('../db');

// ── AUTHORS ──────────────────────────────────────────────────

// GET /api/authors  – list all authors
router.get('/authors', (req, res) => {
  try {
    const db   = getDb();
    const rows = db.prepare(`
      SELECT a.*, COUNT(b.book_id) AS book_count
      FROM authors a
      LEFT JOIN books b ON a.author_id = b.author_id
      GROUP BY a.author_id
      ORDER BY a.last_name, a.first_name
    `).all();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/authors/:id
router.get('/authors/:id', (req, res) => {
  try {
    const db  = getDb();
    const row = db.prepare('SELECT * FROM authors WHERE author_id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: 'Author not found' });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/authors  – add new author
router.post('/authors', (req, res) => {
  try {
    const { first_name, last_name, bio, nationality } = req.body;
    if (!first_name || !last_name)
      return res.status(400).json({ success: false, message: 'first_name and last_name are required' });

    const db   = getDb();
    const info = db.prepare(
      'INSERT INTO authors (first_name, last_name, bio, nationality) VALUES (?,?,?,?)'
    ).run(first_name, last_name, bio || null, nationality || null);

    res.status(201).json({ success: true, message: 'Author added', author_id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/authors/:id  – update author
router.put('/authors/:id', (req, res) => {
  try {
    const { first_name, last_name, bio, nationality } = req.body;
    const db   = getDb();
    const info = db.prepare(
      'UPDATE authors SET first_name=?, last_name=?, bio=?, nationality=? WHERE author_id=?'
    ).run(first_name, last_name, bio || null, nationality || null, req.params.id);

    if (info.changes === 0)
      return res.status(404).json({ success: false, message: 'Author not found' });
    res.json({ success: true, message: 'Author updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── CATEGORIES ────────────────────────────────────────────────

// GET /api/categories
router.get('/categories', (req, res) => {
  try {
    const db   = getDb();
    const rows = db.prepare(`
      SELECT c.*, COUNT(b.book_id) AS book_count
      FROM categories c
      LEFT JOIN books b ON c.category_id = b.category_id
      GROUP BY c.category_id
      ORDER BY c.name
    `).all();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/categories/:id
router.get('/categories/:id', (req, res) => {
  try {
    const db  = getDb();
    const row = db.prepare('SELECT * FROM categories WHERE category_id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/categories
router.post('/categories', (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name)
      return res.status(400).json({ success: false, message: 'name is required' });

    const db   = getDb();
    const info = db.prepare(
      'INSERT INTO categories (name, description) VALUES (?,?)'
    ).run(name, description || null);

    res.status(201).json({ success: true, message: 'Category added', category_id: info.lastInsertRowid });
  } catch (err) {
    if (err.message.includes('UNIQUE'))
      return res.status(409).json({ success: false, message: 'Category name already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/categories/:id
router.put('/categories/:id', (req, res) => {
  try {
    const { name, description } = req.body;
    const db   = getDb();
    const info = db.prepare(
      'UPDATE categories SET name=?, description=? WHERE category_id=?'
    ).run(name, description || null, req.params.id);

    if (info.changes === 0)
      return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, message: 'Category updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
