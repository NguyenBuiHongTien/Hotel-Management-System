/**
 * Escape text for safe insertion into HTML (print / download templates).
 * Mirrors backend `utils/escapeHtml.js` behaviour.
 */
export function escapeHtml(value) {
  if (value == null || value === '') return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
