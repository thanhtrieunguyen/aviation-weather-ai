//canảnh bao chuyen bay
const mongoose = require('mongoose');

const warningFlightSchema = new mongoose.Schema({
  area: {
    type: String,
    required: true,
    trim: true
  },
  Content: {
    type: String,
    required: true
  },
  Propose: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  Created_at: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'data_warning_weathers' 
});

module.exports = mongoose.model('WarningFlight', warningFlightSchema);