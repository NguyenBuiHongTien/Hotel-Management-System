/**
 * YYYY-MM-DD string for <input type="date"> from API values (ISO / Date).
 * Uses the local calendar date to match the user's picker.
 */export function toDateInputValue(value) {
  if (value == null || value === '') return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Add days to a YYYY-MM-DD string (local calendar, avoids UTC drift).
 * @param {string} dateStr
 * @param {number} days
 * @returns {string} YYYY-MM-DD or '' if invalid
 */
export function addDaysToDateInputValue(dateStr, days) {
  if (dateStr == null || dateStr === '' || typeof dateStr !== 'string') return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(n => Number.isNaN(n))) return '';
  const [y, m, d] = parts;
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return '';
  dt.setDate(dt.getDate() + days);
  return toDateInputValue(dt);
}

/** Display date for UI (en-US locale). */
export function formatViDate(value) {
  if (value == null || value === '') return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US');
}
