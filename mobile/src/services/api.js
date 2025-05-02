import axios from 'axios';

// Thay đổi URL API để phù hợp với môi trường phát triển
// Lưu ý: Không dùng localhost vì React Native chạy trên thiết bị khác với máy chủ

// Nếu sử dụng Expo trong môi trường development
// Sử dụng IP máy tính của bạn thay vì localhost
const API_URL = 'http://192.168.2.11:5000'; // Đảm bảo IP này chính xác

// Hoặc dùng URL máy chủ thật nếu đã triển khai
// const API_URL = 'https://your-server-domain.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  // Thêm timeout để tránh chờ quá lâu
  timeout: 10000
});

// Thêm interceptor để xử lý lỗi
api.interceptors.response.use(
  response => response,
  error => {
    console.log('API Error:', error);
    
    if (error.code === 'ECONNABORTED') {
      console.log('Request timeout');
    }
    
    if (error.message === 'Network Error') {
      console.log('Network Error - Không thể kết nối đến server');
    }
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

export const fetchIncidents = async () => {
  try {
    const response = await api.get('/incidents');
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách báo cáo:', error);
    throw error;
  }
};

export const fetchIncidentById = async (id) => {
  try {
    const response = await api.get(`/incidents/${id}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết báo cáo:', error);
    throw error;
  }
};

export const createIncident = async (incidentData) => {
  try {
    const response = await api.post('/incidents', incidentData);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo báo cáo mới:', error);
    throw error;
  }
};

export const updateIncident = async (id, incidentData) => {
  try {
    const response = await api.put(`/incidents/${id}`, incidentData);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi cập nhật báo cáo:', error);
    throw error;
  }
};

export const deleteIncident = async (id) => {
  try {
    const response = await api.delete(`/incidents/${id}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi xóa báo cáo:', error);
    throw error;
  }
};

// Weather API Functions
export const getLatestAirportWeather = async (iataCode) => {
  try {
    const response = await api.get(`/weather/airport/${iataCode}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching airport weather:', error);
    throw error;
  }
};

export const getAllAirportsWeather = async () => {
  try {
    const response = await api.get('/weather/current');
    return response.data;
  } catch (error) {
    console.error('Error fetching all airports weather:', error);
    throw error;
  }
};

export const getWeatherForecast = async (iataCode) => {
  try {
    const response = await api.get(`/weather/forecast/${iataCode}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    throw error;
  }
};

export const getWeatherByCity = async (city) => {
  try {
    const response = await api.get(`/weather/city/${city}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching weather by city:', error);
    throw error;
  }
};

export const getAirports = async () => {
  try {
    const response = await api.get('/weather/airports');
    return response;
  } catch (error) {
    console.error('Error fetching airports:', error);
    throw error;
  }
};

export default api;