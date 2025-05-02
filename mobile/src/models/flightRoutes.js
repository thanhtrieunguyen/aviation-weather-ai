const mongoose = require('mongoose');

const FlightSchema = new mongoose.Schema({
  flightNumber: String,
  route: String,
  time: String,
  status: String,
  statusCode: String,
  departureAirport: String,
  arrivalAirport: String,
  aircraft: String,
  departureTime: String,
  arrivalTime: String
});

module.exports = mongoose.model('data_flights', FlightSchema);
