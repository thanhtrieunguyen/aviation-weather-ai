const mongoose = require('mongoose');

const FlightErrorSchema = new mongoose.Schema({
  Number_Flight: { type: String, required: true },
  content: { type: String, required: true },
  level: { type: String, enum: ['low', 'medium', 'high'], required: true },
  status: { type: String, enum: ['open', 'resolved'], required: true },
  time: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('data_warning_flights', FlightErrorSchema);
