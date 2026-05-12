/**
 * Keep digits only; +84 / leading 84 → 0xxxxxxxxx (VN).
 * @param {unknown} value
 * @returns {string}
 */
function normalizePhoneVN(value) {
  if (value == null || typeof value !== 'string') return '';
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('84') && digits.length >= 10) {
    digits = `0${digits.slice(2)}`;
  }
  return digits;
}

module.exports = { normalizePhoneVN };
