const mongoose = require('mongoose');

// Định nghĩa schema cho airport
const AirportSchema = new mongoose.Schema({
  icao: String,
  iata: String,
  name: String,
  lat: String,
  lon: String
});

// Định nghĩa schema cho location_data
const LocationDataSchema = new mongoose.Schema({
  city: String,
  state: String,
  country: String,
  country_code: String,
  timezone: String,
  airport: AirportSchema,
  timestamp: String
});

// Định nghĩa schema cho condition trong prediction
const ConditionSchema = new mongoose.Schema({
  code: Number,
  text: String,
  icon: Number
});

// Định nghĩa schema cho current_weather
const CurrentWeatherSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  wind_speed: Number,
  wind_direction: Number,
  wind_direction_symbol: String,
  pressure: Number,
  precipitation: Number,
  cloud: Number,
  gust_speed: Number,
  condition: String,
  rain_probability: Number,
  snow_probability: Number,
  visibility: Number,
  uv_index: Number,
  condition_code: Number,
  dewpoint: Number
});

// Định nghĩa schema cho mỗi prediction item
const PredictionItemSchema = new mongoose.Schema({
  timestamp: String,
  temperature: Number,
  humidity: Number,
  wind_speed: Number,
  wind_direction: Number,
  wind_direction_symbol: String,
  pressure: Number,
  precipitation: Number,
  cloud: Number,
  gust_speed: Number,
  condition: ConditionSchema,
  rain_probability: Number,
  snow_probability: Number,
  visibility: Number,
  uv_index: Number,
  dewpoint: Number
});

// Schema chính cho Weather
const WeatherSchema = new mongoose.Schema({
  location_data: LocationDataSchema,
  current_weather: CurrentWeatherSchema,
  prediction: [PredictionItemSchema],
  created_at: { type: Date, default: Date.now }
}, { collection: 'data_weathers' });

module.exports = mongoose.model('Weather', WeatherSchema);