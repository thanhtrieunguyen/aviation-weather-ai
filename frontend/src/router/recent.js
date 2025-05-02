// /api/flights/recent.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Định nghĩa schema cho chuyến bay
const flightSchema = new mongoose.Schema({
  Number_Flight: String,
  Plane: String,
  From: String,
  To: String,
  Time_depart: Date,
  Time_landing: Date,
  Gate_depart: String,
  Status: String
});

// Tạo model (nếu chưa có)
const Flight = mongoose.model('Flight', flightSchema);

// Route lấy các chuyến bay gần nhất
router.get('/api/flights/recent', async (req, res) => {
  try {
    // Lấy 10 chuyến bay gần đây nhất dựa trên thời gian khởi hành
    const recentFlights = await Flight.find()
      .sort({ Time_depart: -1 })
      .limit(10);
    
    res.json(recentFlights);
  } catch (error) {
    console.error('Error fetching recent flights:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy dữ liệu chuyến bay' });
  }
});

module.exports = router;