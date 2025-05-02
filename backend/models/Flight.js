const mongoose = require('mongoose');

const FlightSchema = new mongoose.Schema({
    Number_Flight: { type: String, required: true },
    Plane: { type: String, required: true },
    From: { type: String, required: true },
    Transit: { type: String }, 
    To: { type: String, required: true },
    Time_depart: { type: Date, required: true },
    Time_landing: { type: Date, required: true },
    Gate_depart: { type: String, required: true },
    Status: { type: String, default: "On Time" },
    Pilot_email: { type: String, required: true },
    Initial_price: {
        type: Number,
        required: true,
        default: 1000000 // Default price in VND
    },
    Current_price: {
        type: Number,
        required: true,
        default: 1000000 // Default price in VND
    },
    Is_Affected_By_Weather: {
        type: Boolean,
        default: false
    },
    Weather_Discount: {
        type: Number,
        default: 0  // Phần trăm giảm giá, ví dụ: 10 = giảm 10%
    }
}, { collection: 'data_flights' }); 

module.exports = mongoose.model('Flight', FlightSchema);
