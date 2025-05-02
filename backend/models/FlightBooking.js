const mongoose = require('mongoose');

const FlightSchema = new mongoose.Schema({
  Number_Flight: {
    type: String,
    required: true,
    default: () => `FL${Date.now()}`
  },
  Plane: {
    type: String,
    required: true,
    default: 'N/A'
  },
  From: {
    type: String,
    required: true
  },
  Transit: {
    type: String,
    default: ''
  },
  To: {
    type: String,
    required: true
  },
  Time_depart: {
    type: Date,
    required: true
  },
  Time_landing: {
    type: Date,
    required: true
  },
  Gate_depart: {
    type: String,
    required: true
  },
  Pilot_email: {
    type: String,
    required: true
  },
  User_email: {
    type: String,
    required: false,
    default: ''
  },
  Initial_price: {
    type: Number
  },
  Current_price: {
    type: Number
  },
  Status: {
    type: String,
    enum: ['Đúng giờ',
          'Bị trễ',
          'Đã cất cánh',
          'Đã hạ cánh',
          'Đã hủy',
          'Chuyển hướng'],
    default: 'Đúng giờ'
  },
  CreatedAt: {
    type: Date,
    default: Date.now
  }
}, { collection: 'flights_ticket' }); // Đảm bảo lưu vào collection flights_ticket

module.exports = mongoose.model('flight', FlightSchema);
