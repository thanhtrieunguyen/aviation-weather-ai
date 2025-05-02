const express = require('express');
const router = express.Router();
const FlightError = require('../models/FlightError');

router.get('/', async (req, res) => {
  try {
    const errors = await FlightError.find().sort({ time: -1 });
    res.json(errors);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách lỗi chuyến bay', error });
  }
});

module.exports = router;
