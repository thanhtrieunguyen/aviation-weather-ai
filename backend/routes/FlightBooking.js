const express = require('express');
const router = express.Router();
const Flight = require('../models/FlightBooking');

// GET all flights
router.get('/', async (req, res) => {
  try {
    const flights = await Flight.find();
    res.json(flights);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET flights by user email (for My Bookings)
router.get('/user/:email', async (req, res) => {
  try {
    const userFlights = await Flight.find({ User_email: req.params.email });
    res.json(userFlights);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET flights by pilot email
router.get('/pilot/:email', async (req, res) => {
  try {
    const pilotFlights = await Flight.find({ Pilot_email: req.params.email });
    res.json(pilotFlights);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET a specific flight
router.get('/:id', async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ message: 'Không tìm thấy chuyến bay' });
    }
    res.json(flight);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.post('/', async (req, res) => {
    try {
  
      const flightData = {
        Number_Flight: req.body.Number_Flight || `FL${Date.now()}`,
        Plane: req.body.Plane || 'Boeing 737',
        From: req.body.From || 'Unknown',
        Transit: req.body.Transit || '',
        To: req.body.To || 'Unknown',
        Time_depart: req.body.Time_depart || new Date(),
        Time_landing: req.body.Time_landing || new Date(),
        Gate_depart: req.body.Gate_depart || 'Unknown',
        Pilot_email: req.body.Pilot_email || 'Unknown',
        User_email: req.body.User_email || '',
        Status: req.body.Status || 'Scheduled',
        Initial_price: req.body.Initial_price,
        Current_price: req.body.Current_price
      };
  
      const requiredFields = ['Number_Flight', 'Plane', 'From', 'To', 'Time_depart', 'Time_landing', 'Gate_depart', 'Pilot_email'];
      for (const field of requiredFields) {
        if (!flightData[field] || flightData[field] === 'Unknown') {
          return res.status(400).json({
            success: false,
            message: `Trường '${field}' là bắt buộc và không được để trống`
          });
        }
      }
  
      const newFlight = new Flight(flightData);
      const savedFlight = await newFlight.save();
      res.status(201).json({
        success: true,
        message: 'Đặt vé thành công',
        flight: savedFlight
      });
    } catch (err) {
      console.error('Lỗi chi tiết:', err);
      res.status(400).json({
        success: false,
        message: 'Lỗi server',
        error: err.message
      });
    }
  });
// PUT (update) a flight
router.put('/:id', async (req, res) => {
  try {
    const updatedFlight = await Flight.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedFlight) {
      return res.status(404).json({ message: 'Không tìm thấy chuyến bay' });
    }

    res.json({
      success: true,
      message: 'Cập nhật chuyến bay thành công',
      flight: updatedFlight
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a flight
router.delete('/:id', async (req, res) => {
  try {
    const flight = await Flight.findByIdAndDelete(req.params.id);

    if (!flight) {
      return res.status(404).json({ message: 'Không tìm thấy chuyến bay' });
    }

    res.json({ message: 'Đã xóa chuyến bay thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;