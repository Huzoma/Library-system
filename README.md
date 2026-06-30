# 📚 Library Management System
## Group 4 — Database Project

A full-stack library management application with a clean dark-themed UI, RESTful backend, and SQLite database.

---

## 📁 Project Structure

```
library-system/
├── database/
│   ├── schema.sql      ← All tables, indexes & views
│   ├── seed.sql        ← Sample data (authors, books, users, borrowings, fines)
│   └── init.js         ← Script to create & populate library.db
│
├── backend/
│   ├── server.js       ← Main Express server (entry point)
│   ├── db.js           ← SQLite database connection (singleton)
│   └── routes/
│       ├── authors_categories.js  ← /api/authors  /api/categories
│       ├── books.js               ← /api/books
│       ├── users.js               ← /api/users
│       ├── borrowings.js          ← /api/borrowings  (issue & return)
│       ├── fines.js               ← /api/fines
│       └── reports.js             ← /api/reports
│
├── frontend/
│   ├── index.html      ← Main SPA shell (all 10 screens)
│   ├── styles.css      ← All CSS (dark theme, layout, components)
│   ├── api.js          ← All fetch() calls to the backend
│   ├── utils.js        ← Helpers: toast, modal, date format, badges
│   └── app.js          ← All page logic and event handlers
│
├── package.json
└── README.md
```

---

## 🚀 Setup & Run

### 1. Install dependencies
```bash
npm install
```

### 2. Initialize the database
```bash
npm run init-db
```
This runs `database/init.js` which creates `database/library.db`,  
applies `schema.sql`, and inserts all sample data from `seed.sql`.

### 3. Start the server
```bash
npm start
# or for auto-reload during development:
npm run dev
```

### 4. Open in browser
```
http://localhost:3000
```

---

## 📋 Features (All 10 Screens)

| # | Screen | Description |
|---|--------|-------------|
| i | **Book Registration** | Add books with ISBN, author, category, copies, shelf |
| ii | **Author & Category Management** | Add/view authors and categories |
| iii | **User Registration** | Register members with auto-generated member IDs |
| iv | **Book Search** | Search by title, author or ISBN |
| v | **Book Issue** | Issue available books to active members |
| vi | **Book Return** | Return books with fine calculation |
| vii | **Overdue Book List** | View all overdue books with days overdue |
| viii | **Fine Calculation** | Calculate fines by borrowing ID |
| ix | **Available Books View** | See all books currently in stock |
| x | **Library Reports** | Summary stats, top books, category distribution |

---

## 🗄️ Database Relationships

```
authors ──────┐
              ├──► books ──────┐
categories ───┘                ├──► borrowings ──► fines
                               │
users ─────────────────────────┘
```

**Tables:** `authors`, `categories`, `books`, `users`, `borrowings`, `fines`  
**Views:** `v_books`, `v_active_borrowings`, `v_overdue_books`, `v_library_summary`

---

## 🎯 Demo Walkthrough (Presentation Guide)

1. **Dashboard** → Show summary stats (books, members, loans, fines)
2. **Book Registration** → Register a new book with author & category
3. **User Registration** → Register a new student (auto-generates member ID)
4. **Issue Book** → Issue the new book to the new member
   - Notice Available copies decrements
5. **Available Books** → Confirm book shows reduced availability
6. **Return Book** → Return the book (on time = no fine)
7. **Overdue Books** → Show existing overdue records with days/fines
8. **Fine Calculator** → Enter borrowing ID to calculate exact fine
9. **Fines** → Mark a fine as paid
10. **Reports** → Show full library statistics

---

## ⚙️ API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/books` | List/search books |
| POST | `/api/books` | Register new book |
| GET | `/api/users` | List/search members |
| POST | `/api/users` | Register new member |
| POST | `/api/borrowings/issue` | Issue a book |
| POST | `/api/borrowings/return` | Return a book |
| GET | `/api/borrowings/overdue` | Overdue list |
| GET | `/api/fines` | List fines |
| POST | `/api/fines/:id/pay` | Mark fine as paid |
| GET | `/api/reports/summary` | Dashboard stats |
| GET | `/api/health` | Server health check |

---

## 💡 Fine Policy
- Fine rate: **$0.50 per day** overdue
- Fines are auto-calculated on return
- Members with unpaid fines cannot borrow new books
- Default loan period: **14 days**
