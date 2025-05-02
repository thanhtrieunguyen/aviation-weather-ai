import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { WeatherInfo } from '../components/WeatherInfo/WeatherInfo';
import { WeatherForecast } from '../components/WeatherForecast/WeatherForecast';
import { AirportSelector } from '../components/AirportSelector/AirportSelector';
import { WeatherRefreshButton } from '../components/WeatherRefreshButton/WeatherRefreshButton';
import { theme } from '../utils/theme';
import Header from './Header';
import { useWeather } from '../contexts/WeatherContext';
import { processWeatherData, getLocationString } from '../utils/weatherUtils';

export default function CustomerDashboard({ navigation }) {
  // Use weather context
  const { 
    currentWeather, 
    forecastData, 
    selectedAirport, 
    loading, 
    error, 
    airports, 
    changeAirport 
  } = useWeather();
  
  const [flights, setFlights] = useState([]);
  const [editedFlights, setEditedFlights] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAirportSelector, setShowAirportSelector] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Format location string using utility
  const locationString = getLocationString(selectedAirport, airports);
  
  // Process weather data for components using utility
  const processedWeather = processWeatherData(currentWeather);

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshWeatherData();
      await fetchFlights();
      await fetchEditedFlights();
    } finally {
      setRefreshing(false);
    }
  };

  // Tải danh sách chuyến bay và kiểm tra các chuyến bay đã chỉnh sửa
  useEffect(() => {
    fetchFlights();
    fetchEditedFlights();
  }, []);

  // Lấy danh sách chuyến bay từ API
  const fetchFlights = async () => {
    try {
      const response = await axios.get('http://192.168.2.11:5000/flights');
      setFlights(response.data);
    } catch (error) {
      console.error('Lỗi khi tải chuyến bay:', error);
      // Nếu không tải được, sử dụng dữ liệu mock
      setFlights(mockFlights);
    }
  };

  // Lấy danh sách chuyến bay đã chỉnh sửa từ AsyncStorage
  const fetchEditedFlights = async () => {
    try {
      const storedData = await AsyncStorage.getItem('editedFlights');
      if (storedData) {
        const editedFlightsData = JSON.parse(storedData);
        
        // Lọc chỉ những chuyến bay có thời gian chỉnh sửa chưa hết hạn (3 giờ)
        const currentTime = new Date().getTime();
        const validEditedFlightIds = Object.entries(editedFlightsData)
          .filter(([_, timestamp]) => {
            return currentTime - timestamp < 10800000; // 3 giờ = 10800000ms
          })
          .map(([id, _]) => id);
        
        // Nếu có chuyến bay đã chỉnh sửa, tìm thông tin chi tiết và lưu vào state
        if (validEditedFlightIds.length > 0) {
          try {
            const response = await axios.get('http://192.168.2.11:5000/flights');
            const allFlights = response.data;
            
            // Lọc ra những chuyến bay đã chỉnh sửa từ danh sách chuyến bay
            const editedFlightDetails = allFlights.filter(flight => 
              validEditedFlightIds.includes(flight._id)
            );
            
            setEditedFlights(editedFlightDetails);
            
            // Hiển thị thông báo nếu có chuyến bay đã chỉnh sửa
            if (editedFlightDetails.length > 0) {
              setShowNotifications(true);
            }
          } catch (error) {
            console.error('Lỗi khi tải thông tin chuyến bay đã chỉnh sửa:', error);
          }
        }
      }
    } catch (error) {
      console.error('Lỗi khi đọc dữ liệu từ AsyncStorage:', error);
    }
  };

  // Định dạng thời gian
  const formatDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month} ${hours}:${minutes}`;
  };

  // Chuyển đổi dữ liệu chuyến bay để hiển thị
  const formatFlightsForDisplay = () => {
    return flights.map(flight => ({
      id: flight._id,
      number: flight.Number_Flight,
      route: `${flight.From} → ${flight.To}`,
      time: formatDateTime(flight.Time_depart),
      status: flight.Status,
      gate: flight.Gate_depart || 'N/A',
    }));
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradients.primary} style={styles.contentContainer}>
        {/* Thông báo chuyến bay đã thay đổi */}
        {showNotifications && editedFlights.length > 0 && (
          <View style={styles.notificationContainer}>
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationTitle}>Thông báo thay đổi lịch bay</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.notificationScroll}>
              {editedFlights.map(flight => (
                <View key={flight._id} style={styles.notificationItem}>
                  <Text style={styles.notificationFlightCode}>
                    Mã chuyến bay: {flight.Number_Flight}
                  </Text>
                  <Text style={styles.notificationText}>
                    {flight.From} → {flight.To}
                  </Text>
                  <Text style={styles.notificationText}>
                    Thời gian khởi hành: {formatDateTime(flight.Time_depart)}
                  </Text>
                  <Text style={styles.notificationStatus}>
                    Trạng thái: {flight.Status}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <ScrollView 
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#4A90E2"]}
            />
          }
        >
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <Text style={styles.welcomeText}>Chào buổi sáng!</Text>
              <WeatherRefreshButton />
            </View>
            
            <WeatherInfo 
              location={locationString}
              weather={processedWeather}
              onLocationPress={() => setShowAirportSelector(true)}
              loading={loading}
            />
        
            <WeatherForecast 
              forecast={processForecastData()}
              loading={loading}
              error={error}
            />
          </View>
        </ScrollView>
      </LinearGradient>
      
      <AirportSelector 
        visible={showAirportSelector}
        airports={airports}
        onSelect={changeAirport}
        onClose={() => setShowAirportSelector(false)}
      />
    </View>
  );
}

// Mock data cho trường hợp API không hoạt động
const mockFlights = [
  {
    _id: '1',
    Number_Flight: 'VN123',
    From: 'HAN',
    To: 'SGN',
    Time_depart: new Date().toISOString(),
    Status: 'Đã lên lịch',
    Gate: 'A1',
  },
  {
    _id: '2',
    Number_Flight: 'VN234',
    From: 'SGN',
    To: 'DND',
    Time_depart: new Date().toISOString(),
    Status: 'Lên máy bay',
    Gate: 'B2',
  },
  {
    _id: '3',
    Number_Flight: 'VN345',
    From: 'DND',
    To: 'HAN',
    Time_depart: new Date().toISOString(),
    Status: 'Bị trì hoãn',
    Gate: 'C3',
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
  },
  notificationContainer: {
    backgroundColor: 'rgba(255, 250, 205, 0.95)',
    margin: 10,
    borderRadius: 10,
    padding: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E74C3C',
  },
  closeButton: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
  },
  notificationScroll: {
    maxHeight: 200,
  },
  notificationItem: {
    backgroundColor: 'white',
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#F39C12',
  },
  notificationFlightCode: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  notificationText: {
    fontSize: 12,
    marginTop: 3,
  },
  notificationStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginTop: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});