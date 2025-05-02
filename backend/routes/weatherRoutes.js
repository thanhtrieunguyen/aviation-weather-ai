const express = require('express');
const router = express.Router();
const weatherController = require('../Controller/weatherController');
const path = require('path');
const airportsData = require('../data/airports.json');

// Update the airports endpoint to include error handling
router.get('/airports', (req, res) => {
    try {
        if (!airportsData || !Array.isArray(airportsData)) {
            throw new Error('Invalid airports data format');
        }
        
        // Format the airports data before sending
        const formattedAirports = airportsData
            .filter(airport => airport.iata && airport.name) // Only include airports with IATA codes
            .map(airport => ({
                iata: airport.iata,
                name: airport.name,
                city: airport.city,
                latitude: airport.latitude,
                longitude: airport.longitude
            }));

        res.json(formattedAirports);
    } catch (error) {
        console.error('Error loading airports data:', error);
        res.status(500).json({ 
            message: 'Could not load airports data',
            error: error.message 
        });
    }
});

// Lấy thời tiết hiện tại của một sân bay theo mã IATA
router.get('/airport/:iata', weatherController.getLatestWeather);

// Lấy thời tiết hiện tại của tất cả sân bay
router.get('/current', weatherController.getAllCurrentWeather);

// Lấy dự báo thời tiết của một sân bay
router.get('/forecast/:iata', weatherController.getWeatherForecast);

// Lấy thời tiết theo tên thành phố
router.get('/city/:city', weatherController.getWeatherByCity);

module.exports = router;