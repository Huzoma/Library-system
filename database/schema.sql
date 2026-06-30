-- ============================================================
-- LIBRARY MANAGEMENT SYSTEM - DATABASE SCHEMA
-- Group 4 | schema.sql
-- ============================================================

-- Drop tables if they exist (for clean re-runs)
DROP TABLE IF EXISTS fines;
DROP TABLE IF EXISTS borrowings;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS book_categories;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS authors;
DROP TABLE IF EXISTS users;

-- ============================================================
-- TABLE: authors
-- ============================================================
CREATE TABLE authors (
    author_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name    TEXT NOT NULL,
    last_name     TEXT NOT NULL,
    bio           TEXT,
    nationality   TEXT,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: categories
-- ============================================================
CREATE TABLE categories (
    category_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL UNIQUE,
    description   TEXT,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: books
-- ============================================================
CREATE TABLE books (
    book_id         INTEGER PRIMARY KEY AUTOINCREMENT,
    isbn            TEXT UNIQUE NOT NULL,
    title           TEXT NOT NULL,
    author_id       INTEGER NOT NULL,
    category_id     INTEGER NOT NULL,
    publisher       TEXT,
    publish_year    INTEGER,
    total_copies    INTEGER NOT NULL DEFAULT 1,
    available_copies INTEGER NOT NULL DEFAULT 1,
    shelf_location  TEXT,
    description     TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id)   REFERENCES authors(author_id),
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

-- ============================================================
-- TABLE: users (library members / students)
-- ============================================================
CREATE TABLE users (
    user_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id     TEXT UNIQUE NOT NULL,       -- e.g. LIB-2024-001
    first_name    TEXT NOT NULL,
    last_name     TEXT NOT NULL,
    email         TEXT UNIQUE,
    phone         TEXT,
    address       TEXT,
    user_type     TEXT DEFAULT 'student'      -- student | staff | guest
                    CHECK(user_type IN ('student','staff','guest')),
    status        TEXT DEFAULT 'active'
                    CHECK(status IN ('active','suspended','expired')),
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: borrowings
-- ============================================================
CREATE TABLE borrowings (
    borrowing_id  INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id       INTEGER NOT NULL,
    user_id       INTEGER NOT NULL,
    issued_by     TEXT NOT NULL DEFAULT 'Librarian',  -- librarian name
    issue_date    DATETIME DEFAULT CURRENT_TIMESTAMP,
    due_date      DATETIME NOT NULL,
    return_date   DATETIME,                           -- NULL = not yet returned
    status        TEXT DEFAULT 'issued'
                    CHECK(status IN ('issued','returned','overdue')),
    FOREIGN KEY (book_id) REFERENCES books(book_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ============================================================
-- TABLE: fines
-- ============================================================
CREATE TABLE fines (
    fine_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    borrowing_id  INTEGER NOT NULL UNIQUE,
    user_id       INTEGER NOT NULL,
    overdue_days  INTEGER NOT NULL DEFAULT 0,
    rate_per_day  REAL NOT NULL DEFAULT 0.50,  -- currency per day
    total_amount  REAL NOT NULL DEFAULT 0.00,
    paid          INTEGER DEFAULT 0            -- 0 = unpaid, 1 = paid
                    CHECK(paid IN (0,1)),
    paid_at       DATETIME,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (borrowing_id) REFERENCES borrowings(borrowing_id),
    FOREIGN KEY (user_id)      REFERENCES users(user_id)
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_books_author   ON books(author_id);
CREATE INDEX idx_books_category ON books(category_id);
CREATE INDEX idx_borrowings_user  ON borrowings(user_id);
CREATE INDEX idx_borrowings_book  ON borrowings(book_id);
CREATE INDEX idx_borrowings_status ON borrowings(status);
CREATE INDEX idx_fines_user     ON fines(user_id);

-- ============================================================
-- VIEWS
-- ============================================================

-- View: books with author and category names
CREATE VIEW v_books AS
SELECT
    b.book_id,
    b.isbn,
    b.title,
    a.first_name || ' ' || a.last_name AS author_name,
    c.name AS category_name,
    b.publisher,
    b.publish_year,
    b.total_copies,
    b.available_copies,
    b.shelf_location,
    b.description
FROM books b
JOIN authors    a ON b.author_id   = a.author_id
JOIN categories c ON b.category_id = c.category_id;

-- View: active borrowings (not returned)
CREATE VIEW v_active_borrowings AS
SELECT
    br.borrowing_id,
    br.issue_date,
    br.due_date,
    u.member_id,
    u.first_name || ' ' || u.last_name AS user_name,
    u.email,
    b.title AS book_title,
    b.isbn,
    CASE
        WHEN DATE(br.due_date) < DATE('now') THEN 'overdue'
        ELSE 'on-time'
    END AS due_status,
    CAST(MAX(0, julianday('now') - julianday(br.due_date)) AS INTEGER) AS days_overdue
FROM borrowings br
JOIN users u ON br.user_id = u.user_id
JOIN books b ON br.book_id = b.book_id
WHERE br.status IN ('issued','overdue');

-- View: overdue books with fine amounts
CREATE VIEW v_overdue_books AS
SELECT
    br.borrowing_id,
    u.member_id,
    u.first_name || ' ' || u.last_name AS user_name,
    u.phone,
    b.title,
    b.isbn,
    br.issue_date,
    br.due_date,
    CAST(julianday('now') - julianday(br.due_date) AS INTEGER) AS days_overdue,
    ROUND((julianday('now') - julianday(br.due_date)) * 0.50, 2) AS estimated_fine
FROM borrowings br
JOIN users u ON br.user_id = u.user_id
JOIN books b ON br.book_id = b.book_id
WHERE br.status IN ('issued','overdue')
  AND DATE(br.due_date) < DATE('now');

-- View: library summary report
CREATE VIEW v_library_summary AS
SELECT
    (SELECT COUNT(*) FROM books)                                         AS total_books,
    (SELECT SUM(total_copies) FROM books)                                AS total_copies,
    (SELECT SUM(available_copies) FROM books)                            AS available_copies,
    (SELECT COUNT(*) FROM users WHERE status='active')                   AS active_members,
    (SELECT COUNT(*) FROM borrowings WHERE status IN ('issued','overdue')) AS books_on_loan,
    (SELECT COUNT(*) FROM borrowings WHERE status='returned')            AS books_returned,
    (SELECT COUNT(*) FROM borrowings WHERE status='overdue'
         OR (status='issued' AND DATE(due_date) < DATE('now')))          AS overdue_count,
    (SELECT ROUND(COALESCE(SUM(total_amount),0),2) FROM fines WHERE paid=0) AS unpaid_fines,
    (SELECT ROUND(COALESCE(SUM(total_amount),0),2) FROM fines WHERE paid=1) AS collected_fines;
