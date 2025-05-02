import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

const BASE_URL = 'http://192.168.2.11:5000';

export const LoginService = {
  
  async login(email, password) {
    try {
      const response = await axios.post(`${BASE_URL}/login`, { email, password });
      
      if (!response.data || !response.data.token) {
        throw new Error('Invalid response from server');
      }
      
      const { token } = response.data;
      const decodedToken = jwtDecode(token);

      const currentTime = Math.floor(Date.now() / 1000);
      if (!decodedToken.exp || decodedToken.exp < currentTime) {
        throw new Error('Token has expired');
      }
      
      // Lấy role từ token, nếu không có thì mặc định là 'User'
      const userRole = decodedToken.role || 'User';
      
      // Lưu thông tin vào AsyncStorage
      await Promise.all([
        AsyncStorage.setItem('userToken', token),
        AsyncStorage.setItem('userEmail', email),
        AsyncStorage.setItem('userRole', userRole),
      ]);
      
      return {
        user: {
          id: decodedToken.userId || null, // Sửa id thành userId để khớp với backend
          email: decodedToken.email || email,
          role: userRole,
        },
        token,
      };
    } catch (error) {
      console.error('Đăng nhập thất bại:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Đăng nhập thất bại');
    }
  },

  async getCurrentUser() {
    try {
      const [token, email, role] = await Promise.all([
        AsyncStorage.getItem('userToken'),
        AsyncStorage.getItem('userEmail'),
        AsyncStorage.getItem('userRole'),
      ]);

      if (token) {
        const decodedToken = jwtDecode(token);
        return {
          id: decodedToken.userId || null,
          email: decodedToken.email || email,
          role: role || decodedToken.role || 'User',
        };
      }
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  async logout() {
    try {
      await AsyncStorage.multiRemove(['userToken', 'userEmail', 'userRole']);
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  async isTokenExpired() {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return true;

      const decodedToken = jwtDecode(token);
      const currentTime = Math.floor(Date.now() / 1000);
      return !decodedToken.exp || decodedToken.exp < currentTime;
    } catch (error) {
      console.error('Token expiration check error:', error);
      return true;
    }
  },
};