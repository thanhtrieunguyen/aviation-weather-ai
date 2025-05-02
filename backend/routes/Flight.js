const express = require('express');
const router = express.Router();
const Flight = require('../models/Flight');

// Helper function to create a UTC date from a date string without timezone conversion
function createDateAsUTC(dateString) {
  if (!dateString) return null;
  
  // Create a Date object
  const date = new Date(dateString);
  
  // Convert to UTC date by using the local components directly
  return new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds()
  ));
}

router.get('/', async (req, res) => {
  try {
    const flights = await Flight.find();
    res.json(flights);
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu chuyến bay:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra', error });
  }
});

router.post('/', async (req, res) => {
  try {
    const newFlight = new Flight({
      Number_Flight: req.body.Number_Flight,
      Plane: req.body.Plane,
      From: req.body.From,
      Transit: req.body.Transit || '',
      To: req.body.To,
      Time_depart: createDateAsUTC(req.body.Time_depart),
      Time_landing: createDateAsUTC(req.body.Time_landing),
      Gate_depart: req.body.Gate_depart,
      Status: req.body.Status || 'Scheduled',
      Pilot_email: req.body.Pilot_email, // Nhận email từ request
      Initial_price: req.body.Initial_price,
      Current_price: req.body.Current_price
    });

    await newFlight.save();
    res.status(201).json(newFlight);
  } catch (error) {
    console.error('Lỗi khi thêm chuyến bay:', error);
    res.status(500).json({ message: 'Lỗi server', error });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const flightId = req.params.id;

    if (!flightId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'ID không hợp lệ' });
    }

    // Create update data with preserved timestamps
    const updateData = {
      ...req.body,
      Time_depart: createDateAsUTC(req.body.Time_depart),
      Time_landing: createDateAsUTC(req.body.Time_landing),
      Pilot_email: req.body.Pilot_email
    };

    const updatedFlight = await Flight.findByIdAndUpdate(
      flightId,
      updateData,
      { new: true }
    );

    if (!updatedFlight) {
      return res.status(404).json({ error: 'Chuyến bay không tồn tại!' });
    }

    res.json(updatedFlight);
  } catch (error) {
    console.error('Lỗi khi cập nhật chuyến bay:', error);
    res.status(500).json({ message: 'Lỗi server', error });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const flightId = req.params.id;

    if (!flightId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'ID không hợp lệ' });
    }

    const deletedFlight = await Flight.findByIdAndDelete(flightId);
    if (!deletedFlight) {
      return res.status(404).json({ error: 'Chuyến bay không tồn tại!' });
    }
    res.json({ message: 'Chuyến bay đã được xóa thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa chuyến bay:', error);
    res.status(500).json({ message: 'Lỗi server', error });
  }
});

module.exports = router;