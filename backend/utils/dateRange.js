/**
 * Chuẩn hóa filter theo ngày (date-only từ input type="date").
 * from: đầu ngày, to: cuối ngày — tránh bỏ sót bản ghi trong ngày cuối khi dùng $lte.
 */
function parseDateInput(d) {
  if (d instanceof Date) return new Date(d.getTime());
  const s = String(d || '').trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) {
    // Parse date-only theo local timezone để không bị lệch UTC.
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

module.exports = { startOfDay, endOfDay, parseInclusiveRange };
