/**
 * Utility functions for weather data processing
 */

/**
 * Gets the appropriate icon name based on weather condition
 * @param {string} condition - Weather condition text or code
 * @returns {string} - Ionicons icon name
 */
export const getWeatherIconName = (condition) => {
  if (!condition) return 'cloud-outline';
  
  const conditionText = typeof condition === 'string' ? condition.toLowerCase() : '';
  
  if (conditionText.includes('rain') || conditionText.includes('shower')) {
    return 'rainy-outline';
  } else if (conditionText.includes('thunder') || conditionText.includes('storm')) {
    return 'thunderstorm-outline';
  } else if (conditionText.includes('snow')) {
    return 'snow-outline';
  } else if (conditionText.includes('clear') || conditionText.includes('sunny')) {
    return 'sunny-outline';
  } else if (conditionText.includes('cloud')) {
    return 'cloudy-outline';
  } else if (conditionText.includes('fog') || conditionText.includes('mist')) {
    return 'cloud-outline';
  } else if (conditionText.includes('wind')) {
    return 'wind-outline';
  }
  
  return 'cloud-outline';
};

/**
 * Gets a color based on temperature value
 * @param {number} temperature - Temperature in Celsius
 * @returns {string} - Hex color code
 */
export const getTemperatureColor = (temperature) => {
  if (temperature < 0) return '#9DC3E6';  // Cold blue
  if (temperature < 10) return '#A5D6F7';
  if (temperature < 20) return '#92CAD9';
  if (temperature < 25) return '#FFEB3B'; 
  if (temperature < 30) return '#FFC107';
  if (temperature < 35) return '#FF9800';
  return '#FF5722';  // Hot red/orange
};

/**
 * Formats date and time from ISO string
 * @param {string} isoString - Date time in ISO format
 * @param {string} format - Output format: 'time', 'date', or 'datetime'
 * @returns {string} - Formatted date/time string
 */
export const formatDateTime = (isoString, format = 'datetime') => {
  if (!isoString) return '';
  
  const date = new Date(isoString);
  
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  if (format === 'time') return `${hours}:${minutes}`;
  if (format === 'date') return `${day}/${month}/${year}`;
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Checks if there's a weather warning in the forecast data
 * @param {Array} forecastData - Array of forecast data points
 * @returns {Object|null} - Warning object or null if no warning
 */
export const checkForWeatherWarning = (forecastData) => {
  if (!forecastData || !Array.isArray(forecastData) || forecastData.length === 0) {
    return null;
  }
  
  const nextHoursData = forecastData.slice(0, 12); // Look at next 12 hours
  
  // Check for rain or thunderstorm
  const rainHour = nextHoursData.findIndex(item => 
    item.condition?.text?.toLowerCase().includes('rain') || 
    item.condition?.text?.toLowerCase().includes('thunderstorm')
  );
  
  if (rainHour >= 0) {
    return {
      type: 'rain',
      time: new Date(nextHoursData[rainHour].timestamp),
      condition: nextHoursData[rainHour].condition?.text
    };
  }
  
  // Check for strong winds
  const windyHour = nextHoursData.findIndex(item => item.wind_speed > 20);
  if (windyHour >= 0) {
    return {
      type: 'wind',
      time: new Date(nextHoursData[windyHour].timestamp),
      windSpeed: nextHoursData[windyHour].wind_speed
    };
  }
  
  // Check for low visibility
  const lowVisHour = nextHoursData.findIndex(item => item.visibility < 5);
  if (lowVisHour >= 0) {
    return {
      type: 'visibility',
      time: new Date(nextHoursData[lowVisHour].timestamp),
      visibility: nextHoursData[lowVisHour].visibility
    };
  }
  
  return null;
};

/**
 * Processes raw forecast data into a simplified format
 * @param {Array} rawForecast - Raw forecast data from API
 * @returns {Array} - Array of processed forecast items
 */
export const processForecastData = (rawForecast) => {
  if (!rawForecast || !Array.isArray(rawForecast)) return [];
  
  return rawForecast.map(item => ({
    time: formatDateTime(item.timestamp, 'time'),
    date: formatDateTime(item.timestamp, 'date'),
    temperature: item.temperature || 0,
    humidity: item.humidity || 0,
    windSpeed: item.wind_speed || 0,
    windDirection: item.wind_direction_symbol || 'E',
    visibility: item.visibility || 10,
    condition: item.condition?.text || 'Unknown',
    icon: getWeatherIconName(item.condition?.text),
    precipitation: item.precipitation || 0
  }));
};

/**
 * Process raw weather data for WeatherInfo component
 * @param {Object} currentWeather - Raw weather data from API
 * @returns {Object} - Formatted weather data object
 */
export const processWeatherData = (currentWeather) => {
  if (!currentWeather?.current_weather) return null;
  
  return {
    temperature: currentWeather.current_weather.temperature || 0,
    windSpeed: currentWeather.current_weather.wind_speed || 0,
    humidity: currentWeather.current_weather.humidity || 0,
    visibility: currentWeather.current_weather.visibility || 0,
    pressure: currentWeather.current_weather.pressure || 1013,
    condition: currentWeather.current_weather.condition?.text || 'Unknown',
    icon: getWeatherIconName(currentWeather.current_weather.condition?.text),
  };
};

/**
 * Get display name for a location string
 * @param {string} iataCode - IATA code of the airport
 * @param {Array} airports - List of airports
 * @returns {string} - Formatted location string
 */
export const getLocationString = (iataCode, airports) => {
  if (!iataCode || !airports) return '';
  const airport = airports.find(a => a.iata === iataCode);
  return airport ? `${airport.name} (${airport.iata})` : iataCode;
};

/**
 * Check for weather alerts in forecast data
 * @param {Array} forecastData - Array of forecast items
 * @returns {Array} - Array of alert objects
 */
export const getWeatherAlerts = (forecastData) => {
  if (!forecastData || !Array.isArray(forecastData)) return [];
  
  const alerts = [];
  const nextHoursData = forecastData.slice(0, 12); // Look at next 12 hours
  
  // Rain or thunderstorm alert
  const hasRain = nextHoursData.some(item => 
    item.condition?.text?.toLowerCase().includes('rain') || 
    item.condition?.text?.toLowerCase().includes('thunderstorm')
  );
  if (hasRain) {
    alerts.push({
      icon: 'rainy-outline',
      heading: 'Cảnh báo mưa giông',
      description: 'Mưa giông dự kiến trong vài giờ tới.',
      color: '#e74c3c',
      priority: 1
    });
  }
  
  // Strong winds alert
  const hasStrongWinds = nextHoursData.some(item => item.wind_speed > 20);
  if (hasStrongWinds) {
    alerts.push({
      icon: 'thunderstorm-outline',
      heading: 'Gió mạnh',
      description: `Gió mạnh dự kiến với tốc độ trên 20 km/h.`,
      color: '#f39c12',
      priority: 2
    });
  }
  
  // Low visibility alert
  const hasLowVisibility = nextHoursData.some(item => item.visibility < 5);
  if (hasLowVisibility) {
    alerts.push({
      icon: 'eye-outline',
      heading: 'Tầm nhìn hạn chế',
      description: 'Tầm nhìn dự kiến giảm xuống dưới 5km.',
      color: '#3498db',
      priority: 3
    });
  }
  
  // Sort by priority
  return alerts.sort((a, b) => a.priority - b.priority);
};
