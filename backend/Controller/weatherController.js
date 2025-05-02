const Weather = require('../models/Weather');

const weatherController = {
  // Lấy dữ liệu thời tiết mới nhất của một sân bay
  getLatestWeather: async (req, res) => {
    try {
      const weather = await Weather.findOne({
        'location_data.airport.iata': req.params.iata
      }).sort({ created_at: -1 });

      if (!weather) {
        return res.status(404).json({ message: 'Weather data not found' });
      }
      res.json(weather);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Lấy dữ liệu thời tiết của tất cả sân bay
  getAllCurrentWeather: async (req, res) => {
    try {
      const weathers = await Weather.find()
        .sort({ created_at: -1 })
        .limit(10);
      res.json(weathers);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Lấy dữ liệu dự báo thời tiết của một sân bay
  getWeatherForecast: async (req, res) => {
    try {
      const weather = await Weather.findOne({
        'location_data.airport.iata': req.params.iata
      }).sort({ created_at: -1 });

      if (!weather) {
        return res.status(404).json({ message: 'Forecast data not found' });
      }
      res.json(weather.prediction);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Lấy thông tin thời tiết theo thành phố
  getWeatherByCity: async (req, res) => {
    try {
      const weather = await Weather.findOne({
        'location_data.city': req.params.city
      }).sort({ created_at: -1 });

      if (!weather) {
        return res.status(404).json({ message: 'Weather data not found' });
      }
      res.json(weather);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = weatherController;