// ============================================================
// LIBRARY MANAGEMENT SYSTEM - Database Connection
// Group 4 | backend/db.js
// ============================================================
// Singleton better-sqlite3 connection shared across all routes.
// ============================================================

const Database = require('better-sqlite3');
const path     = require('path');

const DB_PATH = path.join(__dirname, '..', 'database', 'library.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');
  }
  return db;
}

module.exports = { getDb };
