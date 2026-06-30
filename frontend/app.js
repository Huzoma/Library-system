// ============================================================
// LIBRARY MANAGEMENT SYSTEM - Main App Logic
// Group 4 | frontend/app.js
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  // ── Navigation ──────────────────────────────────────────────
  const navItems = document.querySelectorAll('.nav-item');
  const pages    = document.querySelectorAll('.page');
  const pageTitle = document.getElementById('page-title');

  function showPage(id) {
    pages.forEach(p => p.classList.remove('active'));
    navItems.forEach(n => n.classList.remove('active'));
    const page = document.getElementById('page-' + id);
    const nav  = document.querySelector(`.nav-item[data-page="${id}"]`);
    if (page) { page.classList.add('active'); }
    if (nav)  { nav.classList.add('active'); pageTitle.textContent = nav.querySelector('.label').textContent; }
    // Lazy-load page data
    const loaders = { dashboard, books, authors_categories, users, borrow, returns, overdue, fines, available, reports };
    if (loaders[id]) loaders[id]();
  }

  navItems.forEach(n => n.addEventListener('click', () => showPage(n.dataset.page)));

  // ── Date badge ──────────────────────────────────────────────
  document.querySelector('.date-badge').textContent =
    new Date().toLocaleDateString('en-GB', { weekday:'short', day:'2-digit', month:'short', year:'numeric' });

  // ── Dashboard ───────────────────────────────────────────────
  async function dashboard() {
    try {
      const { data: s } = await api.getSummary();
      document.getElementById('stat-books').textContent    = s.total_books;
      document.getElementById('stat-copies').textContent   = s.available_copies + ' / ' + s.total_copies;
      document.getElementById('stat-members').textContent  = s.active_members;
      document.getElementById('stat-onloan').textContent   = s.books_on_loan;
      document.getElementById('stat-overdue').textContent  = s.overdue_count;
      document.getElementById('stat-fines').textContent    = '$' + (s.unpaid_fines || 0).toFixed(2);

      // Recent overdue
      const { data: od } = await api.getOverdue();
      const tbody = document.getElementById('dash-overdue-body');
      tbody.innerHTML = od.length === 0
        ? emptyState('No overdue books 🎉')
        : od.slice(0,5).map(r => `
          <tr>
            <td>${r.user_name}</td>
            <td>${r.title}</td>
            <td>${fmtDate(r.due_date)}</td>
            <td><span class="badge badge-danger">${r.days_overdue} days</span></td>
            <td>$${r.estimated_fine.toFixed(2)}</td>
          </tr>`).join('');
    } catch(e) { toast(e.message, 'error'); }
  }

  // ── BOOKS ────────────────────────────────────────────────────
  let allBooks = [], allAuthors = [], allCategories = [];

  async function books() {
    try {
      const [{ data: bks }, { data: auth }, { data: cats }] = await Promise.all([
        api.getBooks(), api.getAuthors(), api.getCategories()
      ]);
      allBooks = bks; allAuthors = auth; allCategories = cats;

      // Populate author/category dropdowns
      populateSelect(document.getElementById('book-author'),   auth, 'author_id',   r => `${r.first_name} ${r.last_name}`);
      populateSelect(document.getElementById('book-category'), cats, 'category_id', 'name');

      // Fix populateSelect for custom label fns
      function populateSelect2(sel, items, vk, labelFn) {
        sel.innerHTML = '<option value="">— Select —</option>' +
          items.map(i => `<option value="${i[vk]}">${labelFn(i)}</option>`).join('');
      }
      populateSelect2(document.getElementById('book-author'),   auth, 'author_id',   r => `${r.first_name} ${r.last_name}`);
      populateSelect2(document.getElementById('book-category'), cats, 'category_id', r => r.name);

      renderBooks(bks);
    } catch(e) { toast(e.message, 'error'); }
  }

  function renderBooks(bks) {
    const tbody = document.getElementById('books-body');
    tbody.innerHTML = bks.length === 0
      ? emptyState('No books found')
      : bks.map(b => `
        <tr>
          <td>${b.isbn}</td>
          <td><strong>${b.title}</strong></td>
          <td>${b.author_name}</td>
          <td>${b.category_name}</td>
          <td>${b.publish_year || '—'}</td>
          <td>${availBadge(b.available_copies, b.total_copies)}</td>
          <td>${b.shelf_location || '—'}</td>
        </tr>`).join('');
  }

  document.getElementById('book-search-btn').addEventListener('click', async () => {
    const q = document.getElementById('book-search').value.trim();
    try {
      const { data } = q ? await api.searchBooks(q) : await api.getBooks();
      renderBooks(data);
    } catch(e) { toast(e.message, 'error'); }
  });
  document.getElementById('book-search').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('book-search-btn').click();
  });

  document.getElementById('book-form').addEventListener('submit', async e => {
    e.preventDefault();
    const body = formData(e.target);
    try {
      await api.addBook(body);
      toast('Book registered successfully!');
      e.target.reset();
      books();
    } catch(err) { toast(err.message, 'error'); }
  });

  // ── AUTHORS & CATEGORIES ─────────────────────────────────────
  async function authors_categories() {
    try {
      const [{ data: auth }, { data: cats }] = await Promise.all([api.getAuthors(), api.getCategories()]);
      renderAuthors(auth);
      renderCategories(cats);
    } catch(e) { toast(e.message, 'error'); }
  }

  function renderAuthors(auth) {
    document.getElementById('authors-body').innerHTML = auth.length === 0
      ? emptyState()
      : auth.map(a => `
        <tr>
          <td>${a.author_id}</td>
          <td>${a.first_name} ${a.last_name}</td>
          <td>${a.nationality || '—'}</td>
          <td>${a.book_count}</td>
          <td>${a.bio ? a.bio.substring(0,50)+'…' : '—'}</td>
        </tr>`).join('');
  }

  function renderCategories(cats) {
    document.getElementById('categories-body').innerHTML = cats.length === 0
      ? emptyState()
      : cats.map(c => `
        <tr>
          <td>${c.category_id}</td>
          <td>${c.name}</td>
          <td>${c.description || '—'}</td>
          <td>${c.book_count}</td>
        </tr>`).join('');
  }

  document.getElementById('author-form').addEventListener('submit', async e => {
    e.preventDefault();
    try {
      await api.addAuthor(formData(e.target));
      toast('Author added!');
      e.target.reset();
      authors_categories();
    } catch(err) { toast(err.message, 'error'); }
  });

  document.getElementById('category-form').addEventListener('submit', async e => {
    e.preventDefault();
    try {
      await api.addCategory(formData(e.target));
      toast('Category added!');
      e.target.reset();
      authors_categories();
    } catch(err) { toast(err.message, 'error'); }
  });

  // ── USERS ────────────────────────────────────────────────────
  async function users() {
    try {
      const { data } = await api.getUsers();
      renderUsers(data);
    } catch(e) { toast(e.message, 'error'); }
  }

  function renderUsers(data) {
    document.getElementById('users-body').innerHTML = data.length === 0
      ? emptyState()
      : data.map(u => `
        <tr>
          <td>${u.member_id}</td>
          <td>${u.first_name} ${u.last_name}</td>
          <td>${u.email || '—'}</td>
          <td>${u.phone || '—'}</td>
          <td><span class="badge badge-info">${u.user_type}</span></td>
          <td>${statusBadge(u.status)}</td>
          <td>${fmtDate(u.registered_at)}</td>
        </tr>`).join('');
  }

  document.getElementById('user-search-btn').addEventListener('click', async () => {
    const q = document.getElementById('user-search').value.trim();
    try {
      const { data } = q ? await api.searchUsers(q) : await api.getUsers();
      renderUsers(data);
    } catch(e) { toast(e.message, 'error'); }
  });
  document.getElementById('user-search').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('user-search-btn').click();
  });

  document.getElementById('user-form').addEventListener('submit', async e => {
    e.preventDefault();
    try {
      const res = await api.addUser(formData(e.target));
      toast(`User registered! Member ID: ${res.member_id}`);
      e.target.reset();
      users();
    } catch(err) { toast(err.message, 'error'); }
  });

  // ── ISSUE BOOK ───────────────────────────────────────────────
  async function borrow() {
    try {
      const [{ data: bks }, { data: usrs }] = await Promise.all([api.availableBooks(), api.getUsers('?status=active')]);

      function populateSel2(sel, items, vk, labelFn) {
        sel.innerHTML = '<option value="">— Select —</option>' +
          items.map(i => `<option value="${i[vk]}">${labelFn(i)}</option>`).join('');
      }
      populateSel2(document.getElementById('issue-book'),  bks,  'book_id',  b => `${b.title} (${b.available_copies} avail.)`);
      populateSel2(document.getElementById('issue-user'),  usrs, 'user_id',  u => `${u.member_id} — ${u.first_name} ${u.last_name}`);
    } catch(e) { toast(e.message, 'error'); }
  }

  document.getElementById('issue-form').addEventListener('submit', async e => {
    e.preventDefault();
    const body = formData(e.target);
    body.loan_days = body.loan_days || 14;
    try {
      const res = await api.issueBook(body);
      toast(`Book issued! Due: ${fmtDate(res.due_date)}`);
      // Show confirmation
      document.getElementById('issue-confirm').innerHTML = `
        <div class="fine-box" style="background:rgba(76,175,136,.1);border-color:rgba(76,175,136,.3)">
          <strong>✅ Book Issued Successfully</strong><br>
          📚 <em>${res.book_title}</em><br>
          👤 ${res.user_name} (${res.member_id})<br>
          📅 Due Date: <strong>${fmtDate(res.due_date)}</strong>
        </div>`;
      e.target.reset();
      borrow();
    } catch(err) {
      document.getElementById('issue-confirm').innerHTML = `<div class="fine-box"><strong>❌ ${err.message}</strong></div>`;
      toast(err.message, 'error');
    }
  });

  // ── RETURN BOOK ──────────────────────────────────────────────
  async function returns() {
    try {
      const { data } = await api.getBorrowings();
      renderActiveBorrowings(data);
    } catch(e) { toast(e.message, 'error'); }
  }

  function renderActiveBorrowings(data) {
    document.getElementById('active-borrow-body').innerHTML = data.length === 0
      ? emptyState('No active borrowings')
      : data.map(r => `
        <tr>
          <td>${r.borrowing_id}</td>
          <td>${r.member_id}</td>
          <td>${r.user_name}</td>
          <td>${r.book_title}</td>
          <td>${fmtDate(r.issue_date)}</td>
          <td>${fmtDate(r.due_date)}</td>
          <td>${statusBadge(r.due_status)}</td>
          <td>${r.days_overdue > 0 ? `<span class="badge badge-danger">${r.days_overdue}d</span>` : '—'}</td>
          <td>
            <button class="btn btn-sm btn-success" onclick="returnBookModal(${r.borrowing_id},'${r.book_title}','${r.user_name}',${r.days_overdue})">
              Return
            </button>
          </td>
        </tr>`).join('');
  }

  window.returnBookModal = function(borrowingId, bookTitle, userName, overdueDays) {
    const fine = (overdueDays * 0.5).toFixed(2);
    const html = `
      <div class="modal-title">📥 Return Book</div>
      <p style="margin-bottom:14px;color:var(--muted)">Confirm return of:</p>
      <div style="margin-bottom:14px">
        <strong>${bookTitle}</strong><br>
        <span style="color:var(--muted)">Borrower: ${userName}</span>
      </div>
      ${overdueDays > 0
        ? `<div class="fine-box">⚠️ Overdue by <strong>${overdueDays} days</strong> — Fine: <strong>$${fine}</strong></div>`
        : `<div style="color:var(--success);margin-bottom:8px">✅ Returned on time — No fine</div>`
      }
      <div class="btn-row" style="margin-top:16px">
        <button class="btn btn-success" id="confirm-return-btn">Confirm Return</button>
        <button class="btn btn-ghost" data-close>Cancel</button>
      </div>`;

    const modal = showModal(html);
    modal.querySelector('#confirm-return-btn').addEventListener('click', async () => {
      try {
        const res = await api.returnBook({ borrowing_id: borrowingId });
        toast(res.message);
        modal.remove();
        returns();
      } catch(err) { toast(err.message, 'error'); }
    });
  };

  // ── OVERDUE ──────────────────────────────────────────────────
  async function overdue() {
    try {
      const { data } = await api.getOverdue();
      document.getElementById('overdue-body').innerHTML = data.length === 0
        ? emptyState('No overdue books 🎉')
        : data.map(r => `
          <tr>
            <td>${r.member_id}</td>
            <td>${r.user_name}</td>
            <td>${r.phone || '—'}</td>
            <td>${r.title}</td>
            <td>${fmtDate(r.due_date)}</td>
            <td><span class="badge badge-danger">${r.days_overdue} days</span></td>
            <td style="color:var(--danger);font-weight:600">$${r.estimated_fine.toFixed(2)}</td>
          </tr>`).join('');
    } catch(e) { toast(e.message, 'error'); }
  }

  // ── FINES ────────────────────────────────────────────────────
  async function fines() {
    try {
      const [{ data: unpaid }, { data: all }] = await Promise.all([
        api.getFines('?paid=0'), api.getFines()
      ]);
      renderFines('fines-unpaid-body', unpaid);
      renderFines('fines-all-body', all);
    } catch(e) { toast(e.message, 'error'); }
  }

  function renderFines(tbodyId, data) {
    document.getElementById(tbodyId).innerHTML = data.length === 0
      ? emptyState('No fines')
      : data.map(f => `
        <tr>
          <td>${f.fine_id}</td>
          <td>${f.member_id}</td>
          <td>${f.user_name}</td>
          <td>${f.book_title}</td>
          <td>${f.overdue_days}</td>
          <td>$${f.rate_per_day.toFixed(2)}</td>
          <td style="color:var(--danger);font-weight:600">$${f.total_amount.toFixed(2)}</td>
          <td>${f.paid ? `<span class="badge badge-success">Paid</span><br><small>${fmtDate(f.paid_at)}</small>` : `<span class="badge badge-danger">Unpaid</span>`}</td>
          <td>
            ${!f.paid ? `<button class="btn btn-sm btn-warning" onclick="payFineNow(${f.fine_id})">Pay Fine</button>` : '—'}
          </td>
        </tr>`).join('');
  }

  window.payFineNow = async function(fineId) {
    try {
      const res = await api.payFine(fineId);
      toast(res.message);
      fines();
    } catch(err) { toast(err.message, 'error'); }
  };

  // ── FINE CALCULATOR ─────────────────────────────────────────
  document.getElementById('calc-fine-btn').addEventListener('click', async () => {
    const brId = document.getElementById('calc-borrowing-id').value.trim();
    if (!brId) { toast('Enter a borrowing ID', 'warning'); return; }
    try {
      const res = document.getElementById('calc-result');
      const data = await api.calcFine(brId);
      res.innerHTML = `
        <div class="fine-box ${data.overdue_days > 0 ? '' : 'success-box'}">
          <strong>Fine Calculation Result</strong><br>
          📅 Due Date: ${fmtDate(data.due_date)}<br>
          ⏱ Overdue Days: <strong>${data.overdue_days}</strong><br>
          💰 Rate: $${data.rate_per_day}/day<br>
          💵 Total Fine: <strong style="color:var(--danger);font-size:1.2rem">$${data.estimated_fine.toFixed(2)}</strong>
        </div>`;
    } catch(err) { toast(err.message, 'error'); }
  });

  // ── AVAILABLE BOOKS ──────────────────────────────────────────
  async function available() {
    try {
      const { data } = await api.availableBooks();
      document.getElementById('available-body').innerHTML = data.length === 0
        ? emptyState('No books currently available')
        : data.map(b => `
          <tr>
            <td>${b.isbn}</td>
            <td><strong>${b.title}</strong></td>
            <td>${b.author_name}</td>
            <td>${b.category_name}</td>
            <td>${b.publisher || '—'}</td>
            <td>${b.publish_year || '—'}</td>
            <td>${availBadge(b.available_copies, b.total_copies)}</td>
            <td>${b.shelf_location || '—'}</td>
          </tr>`).join('');
    } catch(e) { toast(e.message, 'error'); }
  }

  // ── REPORTS ──────────────────────────────────────────────────
  async function reports() {
    try {
      const [
        { data: summary },
        { data: topBooks },
        { data: cats },
        { data: fineSum }
      ] = await Promise.all([
        api.getSummary(), api.getMostBorrowed(),
        api.getCategoryDist(), api.getFinesSummary()
      ]);

      // Summary row
      document.getElementById('rpt-total-books').textContent    = summary.total_books;
      document.getElementById('rpt-total-copies').textContent   = summary.total_copies;
      document.getElementById('rpt-available').textContent      = summary.available_copies;
      document.getElementById('rpt-members').textContent        = summary.active_members;
      document.getElementById('rpt-on-loan').textContent        = summary.books_on_loan;
      document.getElementById('rpt-overdue').textContent        = summary.overdue_count;
      document.getElementById('rpt-unpaid-fines').textContent   = '$' + (fineSum.unpaid_total || 0).toFixed(2);
      document.getElementById('rpt-collected').textContent      = '$' + (fineSum.collected_total || 0).toFixed(2);

      // Most borrowed
      document.getElementById('rpt-top-body').innerHTML = topBooks.length === 0
        ? emptyState()
        : topBooks.map((b, i) => `
          <tr>
            <td>${i+1}</td>
            <td><strong>${b.title}</strong></td>
            <td>${b.author_name}</td>
            <td><span class="badge badge-info">${b.times_borrowed}</span></td>
          </tr>`).join('');

      // Category distribution
      document.getElementById('rpt-cats-body').innerHTML = cats.length === 0
        ? emptyState()
        : cats.map(c => `
          <tr>
            <td>${c.category}</td>
            <td>${c.book_count}</td>
            <td>${c.total_copies || 0}</td>
            <td>${c.available_copies || 0}</td>
          </tr>`).join('');

    } catch(e) { toast(e.message, 'error'); }
  }

  // ── Quick-action buttons ─────────────────────────────────────
  document.querySelectorAll('.qa-btn').forEach(btn => {
    btn.addEventListener('click', () => showPage(btn.dataset.goto));
  });

  // ── Start on dashboard ───────────────────────────────────────
  showPage('dashboard');
});
