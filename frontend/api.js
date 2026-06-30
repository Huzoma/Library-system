// ============================================================
// LIBRARY MANAGEMENT SYSTEM - API Service
// Group 4 | frontend/api.js
// All HTTP calls to the backend go through this module.
// ============================================================

const BASE = '/api';

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch(BASE + path, opts);
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Request failed');
  return data;
}

const api = {
  // ── AUTHORS ──────────────────────────────────────────────
  getAuthors:      ()        => request('GET',  '/authors'),
  addAuthor:       (body)    => request('POST', '/authors', body),
  updateAuthor:    (id, body)=> request('PUT',  `/authors/${id}`, body),

  // ── CATEGORIES ───────────────────────────────────────────
  getCategories:   ()        => request('GET',  '/categories'),
  addCategory:     (body)    => request('POST', '/categories', body),
  updateCategory:  (id, body)=> request('PUT',  `/categories/${id}`, body),

  // ── BOOKS ─────────────────────────────────────────────────
  getBooks:        (query='')=> request('GET',  `/books${query}`),
  getBook:         (id)      => request('GET',  `/books/${id}`),
  addBook:         (body)    => request('POST', '/books', body),
  updateBook:      (id, body)=> request('PUT',  `/books/${id}`, body),
  searchBooks:     (q)       => request('GET',  `/books?q=${encodeURIComponent(q)}`),
  availableBooks:  ()        => request('GET',  '/books?available=true'),

  // ── USERS ─────────────────────────────────────────────────
  getUsers:        (query='')=> request('GET',  `/users${query}`),
  getUser:         (id)      => request('GET',  `/users/${id}`),
  addUser:         (body)    => request('POST', '/users', body),
  updateUser:      (id, body)=> request('PUT',  `/users/${id}`, body),
  searchUsers:     (q)       => request('GET',  `/users?q=${encodeURIComponent(q)}`),

  // ── BORROWINGS ────────────────────────────────────────────
  getBorrowings:   (query='')=> request('GET',  `/borrowings${query}`),
  getOverdue:      ()        => request('GET',  '/borrowings/overdue'),
  issueBook:       (body)    => request('POST', '/borrowings/issue', body),
  returnBook:      (body)    => request('POST', '/borrowings/return', body),
  getBorrowing:    (id)      => request('GET',  `/borrowings/${id}`),

  // ── FINES ─────────────────────────────────────────────────
  getFines:        (query='')=> request('GET',  `/fines${query}`),
  payFine:         (id)      => request('POST', `/fines/${id}/pay`),
  calcFine:        (brId)    => request('GET',  `/fines/calculate/${brId}`),

  // ── REPORTS ───────────────────────────────────────────────
  getSummary:      ()        => request('GET',  '/reports/summary'),
  getAvailableBooks:()       => request('GET',  '/reports/available-books'),
  getMostBorrowed: ()        => request('GET',  '/reports/most-borrowed'),
  getActiveMembers:()        => request('GET',  '/reports/active-members'),
  getFinesSummary: ()        => request('GET',  '/reports/fines-summary'),
  getCategoryDist: ()        => request('GET',  '/reports/category-distribution'),
};

window.api = api;
