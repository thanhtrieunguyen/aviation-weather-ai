import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLatestAirportWeather, getWeatherForecast, getAirports } from '../services/api';

const WeatherContext = createContext();

export const useWeather = () => useContext(WeatherContext);

export const WeatherProvider = ({ children }) => {
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [selectedAirport, setSelectedAirport] = useState('HAN'); // Default to Hanoi
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [airports, setAirports] = useState([]);
  const [airportsLoading, setAirportsLoading] = useState(true);

  const [lastUpdated, setLastUpdated] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  const CACHE_EXPIRY = 15 * 60 * 1000;
  const CACHE_PREFIX = 'weather_';

  // Function to fetch airports data from backend
  const fetchAirports = async () => {
    setAirportsLoading(true);
    try {
      const response = await getAirports();
      if (response && response.data) {
        setAirports(response.data);
      }
    } catch (error) {
      console.error('Error fetching airports:', error);
      // If API fails, set a few default airports as fallback
      setAirports([
        { iata: 'HAN', name: 'Hà Nội' },
        { iata: 'SGN', name: 'TP. Hồ Chí Minh' },
        { iata: 'DAD', name: 'Đà Nẵng' },
      ]);
    } finally {
      setAirportsLoading(false);
    }
  };

  const cacheWeatherData = async (iataCode, weatherData, forecastData) => {
    try {
      const timestamp = new Date().getTime();
      const weatherCacheKey = `${CACHE_PREFIX}${iataCode}`;
      const forecastCacheKey = `${CACHE_PREFIX}${iataCode}_forecast`;

      const cacheData = {
        data: weatherData,
        timestamp
      };

      const forecastCacheData = {
        data: forecastData,
        timestamp
      };

      await AsyncStorage.setItem(weatherCacheKey, JSON.stringify(cacheData));
      await AsyncStorage.setItem(forecastCacheKey, JSON.stringify(forecastCacheData));

      setLastUpdated(timestamp);
    } catch (error) {
      console.error('Error caching weather data:', error);
    }
  };

  const loadCachedWeatherData = async (iataCode) => {
    try {
      const weatherCacheKey = `${CACHE_PREFIX}${iataCode}`;
      const forecastCacheKey = `${CACHE_PREFIX}${iataCode}_forecast`;

      const weatherData = await AsyncStorage.getItem(weatherCacheKey);
      const forecastData = await AsyncStorage.getItem(forecastCacheKey);

      let weatherValid = false;
      let forecastValid = false;

      if (weatherData) {
        const parsedData = JSON.parse(weatherData);
        const now = new Date().getTime();

        if (now - parsedData.timestamp < CACHE_EXPIRY) {
          setCurrentWeather(parsedData.data);
          setLastUpdated(parsedData.timestamp);
          weatherValid = true;
        }
      }

      if (forecastData) {
        const parsedData = JSON.parse(forecastData);
        const now = new Date().getTime();

        if (now - parsedData.timestamp < CACHE_EXPIRY) {
          setForecastData(parsedData.data);
          forecastValid = true;
        }
      }

      return weatherValid && forecastValid;
    } catch (error) {
      console.error('Error loading cached weather data:', error);
      return false;
    }
  };

  const fetchWeatherData = async (iataCode) => {
    setLoading(true);
    setError(null);
    setIsFetching(true);

    try {
      const cachedDataLoaded = await loadCachedWeatherData(iataCode);

      const cacheIsValid = cachedDataLoaded && currentWeather && forecastData;

      if (cacheIsValid) {
        console.log('Đã tải dữ liệu thời tiết từ cache');
        setLoading(false);
        setIsFetching(false);
        return { current: currentWeather, forecast: forecastData };
      }

      const weatherData = await getLatestAirportWeather(iataCode);
      setCurrentWeather(weatherData);

      const forecast = await getWeatherForecast(iataCode);
      setForecastData(forecast);

      // Tạo cache mới
      await cacheWeatherData(iataCode, weatherData, forecast);

      return { current: weatherData, forecast };
    } catch (error) {
      setError('Không thể tải dữ liệu thời tiết');
      console.error('Error fetching weather data:', error);
      return null;
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  const changeAirport = async (iataCode) => {
    setSelectedAirport(iataCode);
    return await fetchWeatherData(iataCode);
  };

  const refreshWeatherData = () => {
    return fetchWeatherData(selectedAirport);
  };

  const clearWeatherCache = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const weatherKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      if (weatherKeys.length > 0) {
        await AsyncStorage.multiRemove(weatherKeys);
        console.log('Đã xóa cache thời tiết');
      }
      // Tải lại dữ liệu sau khi xóa cache
      await fetchWeatherData(selectedAirport);
    } catch (error) {
      console.error('Lỗi khi xóa cache thời tiết:', error);
    }
  };

  // Load airports and initial weather data
  useEffect(() => {
    fetchAirports();
    fetchWeatherData(selectedAirport);
  }, []);

  return (
    <WeatherContext.Provider
      value={{
        currentWeather,
        forecastData,
        selectedAirport,
        loading,
        error,
        airports,
        airportsLoading,
        lastUpdated,
        changeAirport,
        fetchWeatherData,
        refreshWeatherData,
        clearWeatherCache
      }}
    >
      {children}
    </WeatherContext.Provider>
  );
};
