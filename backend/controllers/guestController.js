const asyncHandler = require('express-async-handler');
const Guest = require('../models/guestModel');
const Booking = require('../models/bookingModel');

/**
 * @desc    List guests
 * @route   GET /api/guests
 * @access  Private (Receptionist, Manager)
 */
const getAllGuests = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.name) {
    filter.fullName = { $regex: req.query.name, $options: 'i' };
  }
  if (req.query.phoneNumber) {
    filter.phoneNumber = req.query.phoneNumber;
  }

  const guests = await Guest.find(filter);
  res.status(200).json(guests);
});

/**
 * @desc    Get guest by ID
 * @route   GET /api/guests/:guestId
 * @access  Private (Receptionist, Manager)
 */
const getGuestById = asyncHandler(async (req, res) => {
  const guest = await Guest.findById(req.params.guestId);
  if (!guest) {
    res.status(404);
    throw new Error('Guest not found');
  }
  res.status(200).json(guest);
});

/**
 * @desc    Create guest
 * @route   POST /api/guests
 * @access  Private (Receptionist)
 */
const createGuest = asyncHandler(async (req, res) => {
  const { fullName, phoneNumber, email, address } = req.body;

  if (!fullName || !phoneNumber) {
    res.status(400);
    throw new Error('Full name and phone number are required');
  }

  const guestExists = await Guest.findOne({ phoneNumber });
  if (guestExists) {
      res.status(400);
      throw new Error('A guest with this phone number already exists');
  }

  const newGuest = await Guest.create({
    fullName,
    phoneNumber,
    email,
    address
  });

  res.status(201).json(newGuest);
});

/**
 * @desc    Update guest
 * @route   PUT /api/guests/:guestId
 * @access  Private (Receptionist)
 */
const updateGuest = asyncHandler(async (req, res) => {
  const guest = await Guest.findById(req.params.guestId);
  if (!guest) {
    res.status(404);
    throw new Error('Guest not found');
  }

  const { fullName, phoneNumber, email, address } = req.body;

  if (!fullName || !phoneNumber) {
    res.status(400);
    throw new Error('Full name and phone number are required (PUT)');
  }

  guest.fullName = fullName;
  guest.phoneNumber = phoneNumber;
  guest.email = email;
  guest.address = address;

  const updatedGuest = await guest.save();
  res.status(200).json(updatedGuest);
});

/**
 * @desc    Delete guest
 * @route   DELETE /api/guests/:guestId
 * @access  Private (Manager)
 */
const deleteGuest = asyncHandler(async (req, res) => {
  const guest = await Guest.findById(req.params.guestId);
  if (!guest) {
    res.status(404);
    throw new Error('Guest not found');
  }

  const relatedBookings = await Booking.countDocuments({ guest: guest._id });
  if (relatedBookings > 0) {
    res.status(400);
    throw new Error('Cannot delete a guest who has bookings in the system');
  }

  await guest.deleteOne();
  res.status(200).json({ message: 'Guest deleted successfully' });
});

module.exports = {
  getAllGuests,
  getGuestById,
  createGuest,
  updateGuest,
  deleteGuest,
};
