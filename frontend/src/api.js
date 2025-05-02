import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000',
});


export const getFlights = () => API.get('/flights');
export const createFlight = (flightData) => API.post('/flights', flightData);
export const updateFlight = (id, flightData) => API.put(`/flights/${id}`, flightData);
export const deleteFlight = (id) => API.delete(`/flights/${id}`);

export const getAirports = () => API.get('/weather/airports');
export const getAirportWeather = (iata) => API.get(`/weather/airport/${iata}`);
export const getAirportForecast = (iata) => API.get(`/weather/forecast/${iata}`);