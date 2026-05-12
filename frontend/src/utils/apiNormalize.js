/**
 * Normalize API responses to an array so the UI can safely .map/.filter.
 * Supports: plain arrays, { bookings }, { rooms }, { data }, { invoices }, …
 *
 * @param {*} payload
 * @param {string} [preferredKey] — read this key first (e.g. 'bookings', 'rooms')
 * @returns {unknown[]}
 */
export function asArray(payload, preferredKey) {
  if (Array.isArray(payload)) return payload;
  if (payload == null || typeof payload !== 'object') return [];

  const orderedKeys = [
    preferredKey,
    'bookings',
    'rooms',
    'roomTypes',
    'invoices',
    'transactions',
    'reports',
    'requests',
    'employees',
    'guests',
    'data',
    'items',
    'results',
    'records',
  ].filter((k, i, a) => k && a.indexOf(k) === i);

  for (const key of orderedKeys) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  return [];
}
