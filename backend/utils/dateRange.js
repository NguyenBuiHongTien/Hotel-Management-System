/**
 * Normalize date-only filters (from HTML date inputs).
 * from: start of day, to: end of day — avoids missing records on the last day when using $lte.
 */
function parseDateInput(d) {
  if (d instanceof Date) return new Date(d.getTime());
  const s = String(d || '').trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) {
    // Parse date-only in local timezone to avoid UTC shift.
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  return new Date(s);
}

function startOfDay(d) {
  const x = parseDateInput(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = parseDateInput(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function parseInclusiveRange(fromDate, toDate) {
  return {
    from: startOfDay(fromDate),
    to: endOfDay(toDate),
  };
}

module.exports = {
  parseDateInput,
  startOfDay,
  endOfDay,
  parseInclusiveRange,
};
