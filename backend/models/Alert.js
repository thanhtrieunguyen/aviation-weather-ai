//canảnh baáo thoiơời tieêết
const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  Number_Flight: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  level: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
 status: {
    type: String,
    enum: ['pending', 'processing', 'resolved', 'active', 'expired', 'cancelled'],
    default: 'pending'
  },
  time: {
    type: Date,
    default: Date.now
  },
  affectedFlightPrices: [{
    flightIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Flight' }],
    discountFactor: Number,
    appliedAt: Date,
    reason: String
}]
}, {
  timestamps: true,
  collection: 'data_warning_flights'  
});

module.exports = mongoose.model('Alert', alertSchema);