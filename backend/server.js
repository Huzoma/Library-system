// LIBRARY MANAGEMENT SYSTEM - Main Server
// backend/server.js
// Start: node backend/server.js  (or npm start)

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const authorsCategories = require('./routes/authors_categories');
const booksRouter       = require('./routes/books');
const usersRouter       = require('./routes/users');
const borrowingsRouter  = require('./routes/borrowings');
const finesRouter       = require('./routes/fines');
const reportsRouter     = require('./routes/reports');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the frontend from /frontend directory
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ── API Routes ────────────────────────────────────────────────
app.use('/api',           authorsCategories);   // /api/authors  /api/categories
app.use('/api/books',     booksRouter);
app.use('/api/users',     usersRouter);
app.use('/api/borrowings', borrowingsRouter);
app.use('/api/fines',     finesRouter);
app.use('/api/reports',   reportsRouter);

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Library Management System', group: 4 });
});

// ── Catch-all: serve the SPA ─────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n📚 Library Management System – Group 4`);
  console.log(`   Server running at: http://localhost:${PORT}`);
  console.log(`   API base:          http://localhost:${PORT}/api\n`);
});

module.exports = app;
