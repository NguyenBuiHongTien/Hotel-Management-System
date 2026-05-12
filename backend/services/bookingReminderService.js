const Booking = require('../models/bookingModel');
const {
  sendCheckInReminderEmail,
  sendCheckOutReminderEmail,
} = require('../controllers/notificationController');

let reminderTimer = null;
let isRunning = false;

const toPositiveInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const getSettings = () => ({
  enabled: process.env.BOOKING_REMINDER_ENABLED !== 'false',
  intervalMinutes: toPositiveInt(process.env.BOOKING_REMINDER_INTERVAL_MINUTES, 15),
  checkInHoursBefore: toPositiveInt(process.env.CHECKIN_REMINDER_HOURS_BEFORE, 24),
  checkOutHoursBefore: toPositiveInt(process.env.CHECKOUT_REMINDER_HOURS_BEFORE, 3),
});

const getWindow = (hoursBefore, intervalMinutes, now) => {
  const start = new Date(now.getTime() + hoursBefore * 60 * 60 * 1000);
  const end = new Date(start.getTime() + intervalMinutes * 60 * 1000);
  return { start, end };
};

const markReminderSent = async (bookingId, field) => {
  await Booking.findByIdAndUpdate(bookingId, {
    $set: {
      [`reminders.${field}`]: new Date(),
    },
  });
};

const processCheckInReminders = async (settings, now) => {
  const { start, end } = getWindow(
    settings.checkInHoursBefore,
    settings.intervalMinutes,
    now
  );

  const bookings = await Booking.find({
    status: 'confirmed',
    checkInDate: { $gte: start, $lt: end },
    'reminders.checkInReminderSentAt': null,
  }).populate([
    { path: 'guest' },
    { path: 'room', populate: { path: 'roomType' } },
  ]);

  let sent = 0;
  for (const booking of bookings) {
    const result = await sendCheckInReminderEmail(booking);
    if (result.sent) {
      await markReminderSent(booking._id, 'checkInReminderSentAt');
      sent += 1;
    }
  }
  return { found: bookings.length, sent };
};

const processCheckOutReminders = async (settings, now) => {
  const { start, end } = getWindow(
    settings.checkOutHoursBefore,
    settings.intervalMinutes,
    now
  );

  const bookings = await Booking.find({
    status: 'checked_in',
    checkOutDate: { $gte: start, $lt: end },
    'reminders.checkOutReminderSentAt': null,
  }).populate([
    { path: 'guest' },
    { path: 'room', populate: { path: 'roomType' } },
  ]);

  let sent = 0;
  for (const booking of bookings) {
    const result = await sendCheckOutReminderEmail(booking);
    if (result.sent) {
      await markReminderSent(booking._id, 'checkOutReminderSentAt');
      sent += 1;
    }
  }
  return { found: bookings.length, sent };
};

const runBookingReminderOnce = async () => {
  const settings = getSettings();
  if (!settings.enabled) return;
  if (isRunning) return;

  isRunning = true;
  try {
    const now = new Date();
    const [checkInSummary, checkOutSummary] = await Promise.all([
      processCheckInReminders(settings, now),
      processCheckOutReminders(settings, now),
    ]);

    if (
      checkInSummary.found > 0 ||
      checkOutSummary.found > 0 ||
      checkInSummary.sent > 0 ||
      checkOutSummary.sent > 0
    ) {
      console.log(
        `[email-reminder] checkin: found=${checkInSummary.found}, sent=${checkInSummary.sent}; checkout: found=${checkOutSummary.found}, sent=${checkOutSummary.sent}`
      );
    }
  } catch (err) {
    console.error('[email-reminder] Reminder run error:', err.message);
  } finally {
    isRunning = false;
  }
};

const startBookingReminderScheduler = () => {
  const settings = getSettings();
  if (!settings.enabled || reminderTimer) return;

  // Run once on startup so reminders near deploy/restart are not missed
  runBookingReminderOnce();

  reminderTimer = setInterval(
    runBookingReminderOnce,
    settings.intervalMinutes * 60 * 1000
  );

  console.log(
    `[email-reminder] Scheduler started (${settings.intervalMinutes}m, checkin=${settings.checkInHoursBefore}h, checkout=${settings.checkOutHoursBefore}h)`
  );
};

module.exports = {
  startBookingReminderScheduler,
  runBookingReminderOnce,
};
