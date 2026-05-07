/**
 * Chuẩn hóa filter theo ngày (date-only từ input type="date").
 * from: đầu ngày, to: cuối ngày — tránh bỏ sót bản ghi trong ngày cuối khi dùng $lte.
 */
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
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
