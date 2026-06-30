#!/usr/bin/env node
// ============================================================
// LIBRARY MANAGEMENT SYSTEM - Database Initializer
// Group 4 | database/init.js
// ============================================================
// Usage:  node database/init.js
// Creates library.db, runs schema.sql then seed.sql
// ============================================================

const Database = require('better-sqlite3');
const fs       = require('fs');
const path     = require('path');

const DB_PATH     = path.join(__dirname, 'library.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const SEED_PATH   = path.join(__dirname, 'seed.sql');

function init() {
  console.log('📚 Initializing Library Database...\n');

  // Remove old DB if exists
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log('  ✓ Removed old database');
  }

  const db = new Database(DB_PATH);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');

  // Run schema
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schema);
  console.log('  ✓ Schema created (tables, indexes, views)');

  // Run seed data
  const seed = fs.readFileSync(SEED_PATH, 'utf8');
  db.exec(seed);
  console.log('  ✓ Seed data inserted');

  // Quick verification
  const counts = {
    authors:    db.prepare('SELECT COUNT(*) as n FROM authors').get().n,
    categories: db.prepare('SELECT COUNT(*) as n FROM categories').get().n,
    books:      db.prepare('SELECT COUNT(*) as n FROM books').get().n,
    users:      db.prepare('SELECT COUNT(*) as n FROM users').get().n,
    borrowings: db.prepare('SELECT COUNT(*) as n FROM borrowings').get().n,
    fines:      db.prepare('SELECT COUNT(*) as n FROM fines').get().n,
  };

  console.log('\n  📊 Database Summary:');
  Object.entries(counts).forEach(([k, v]) =>
    console.log(`     ${k.padEnd(12)}: ${v}`)
  );

  db.close();
  console.log('\n  ✅ Database ready at:', DB_PATH);
}

init();
