const mongoose = require('mongoose');

const metricSchema = new mongoose.Schema({
  label: String,
  value: mongoose.Schema.Types.Mixed,
  growth: String
});

const flightTrendSchema = new mongoose.Schema({
  date: String,
  flights: Number,
  bookings: Number
});

const bookingDistributionSchema = new mongoose.Schema({
  type: String,
  percentage: Number
});

const revenueSchema = new mongoose.Schema({
  date: String,
  amount: Number
});

const analysisDetailSchema = new mongoose.Schema({
  date: String,
  flights: Number,
  bookings: Number,
  revenue: Number,
  fillRate: Number
});

const reportSchema = new mongoose.Schema({
  timeframe: {
    type: String,
    enum: ['7_days', '30_days', 'this_month', 'last_month', 'custom'],
    required: true
  },
  startDate: Date,
  endDate: Date,
  metrics: [metricSchema],
  flightTrend: [flightTrendSchema],
  bookingDistribution: [bookingDistributionSchema],
  revenue: [revenueSchema],
  analysisDetails: [analysisDetailSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
},{
    collection: 'report' 
});

module.exports = mongoose.model('Report', reportSchema);