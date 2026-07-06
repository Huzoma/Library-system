// ============================================================
// LIBRARY MANAGEMENT SYSTEM - Utilities
// Group 4 | frontend/utils.js
// ============================================================

// ── Toast Notifications ───────────────────────────────────────
function toast(msg, type = 'success') {
  const icons = { success: 'check-circle-2', error: 'x-circle', warning: 'alert-circle' };
  const iconName = icons[type] || 'info';
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span><i data-lucide="${iconName}"></i></span><span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(el);
  if (window.lucide) {
    lucide.createIcons({
      attrs: { class: 'toast-icon' }
    });
  }
  setTimeout(() => { 
    el.style.opacity = '0'; 
    el.style.transform = 'translateY(10px)'; 
    el.style.transition = 'all .4s ease'; 
  }, 3200);
  setTimeout(() => el.remove(), 3600);
}
window.toast = toast;

// ── Modal helper ─────────────────────────────────────────────
function showModal(html, onClose) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal">
      <button class="modal-close" data-close><i data-lucide="x"></i></button>
      ${html}
    </div>`;
  document.body.appendChild(backdrop);
  if (window.lucide) lucide.createIcons();
  backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(backdrop, onClose); });
  const closeBtn = backdrop.querySelectorAll('[data-close]');
  closeBtn.forEach(btn => btn.addEventListener('click', () => closeModal(backdrop, onClose)));
  return backdrop;
}
function closeModal(backdrop, cb) {
  backdrop.remove();
  if (cb) cb();
}
window.showModal = showModal;

// ── Date helpers ──────────────────────────────────────────────
function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDateTime(str) {
  if (!str) return '—';
  return new Date(str).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
window.fmtDate = fmtDate;
window.fmtDateTime = fmtDateTime;

// ── Status badges ──────────────────────────────────────────────
function statusBadge(status) {
  const map = {
    issued:    ['info',    'Issued'],
    returned:  ['success', 'Returned'],
    overdue:   ['danger',  'Overdue'],
    active:    ['success', 'Active'],
    suspended: ['danger',  'Suspended'],
    expired:   ['muted',   'Expired'],
    'on-time': ['success', 'On Time'],
  };
  const [cls, label] = map[status] || ['muted', status];
  return `<span class="badge badge-${cls}">${label}</span>`;
}
window.statusBadge = statusBadge;

// ── Availability badge ─────────────────────────────────────────
function availBadge(avail, total) {
  const cls = avail === 0 ? 'danger' : avail <= 1 ? 'warning' : 'success';
  return `<span class="badge badge-${cls}">${avail}/${total}</span>`;
}
window.availBadge = availBadge;

// ── Form helpers ───────────────────────────────────────────────
function formData(formEl) {
  const out = {};
  new FormData(formEl).forEach((v, k) => { out[k] = v.trim() || null; });
  return out;
}
window.formData = formData;

// ── Populate select ────────────────────────────────────────────
function populateSelect(selectEl, items, valueKey, labelKey, placeholder = '— Select —') {
  selectEl.innerHTML = `<option value="">${placeholder}</option>` +
    items.map(i => `<option value="${i[valueKey]}">${i[labelKey]}</option>`).join('');
}
window.populateSelect = populateSelect;

// ── Empty state ────────────────────────────────────────────────
function emptyState(msg = 'No records found') {
  return `<tr><td colspan="20"><div class="empty-state"><div class="icon"><i data-lucide="inbox"></i></div><p>${msg}</p></div></td></tr>`;
}
window.emptyState = emptyState;

// ── Loading row ────────────────────────────────────────────────
function loadingRow() {
  return `<tr><td colspan="20" style="text-align:center;padding:24px;color:var(--muted)">Loading…</td></tr>`;
}
window.loadingRow = loadingRow;
