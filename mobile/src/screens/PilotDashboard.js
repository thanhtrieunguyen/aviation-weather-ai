import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, BackHandler, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Header from './Header';
import { useWeather } from '../contexts/WeatherContext';
import { AirportSelector } from '../components/AirportSelector/AirportSelector';

export default function PilotDashboard({ navigation }) {
  // Use weather context
  const { 
    currentWeather, 
    selectedAirport, 
    loading, 
    airports, 
    changeAirport 
  } = useWeather();
  
  const [showAirportSelector, setShowAirportSelector] = useState(false);
  
  // Format location string
  const getLocationString = () => {
    const airport = airports.find(a => a.iata === selectedAirport);
    return airport ? `${airport.name} (${airport.iata})` : selectedAirport;
  };
  
  // Tắt gesture back và xử lý nút back vật lý
  useEffect(() => {
    // Tắt gesture back
    navigation.setOptions({
      gestureEnabled: false, // Ngăn vuốt để quay lại
    });

    // Xử lý nút back vật lý trên Android
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true; // Chặn sự kiện back, không cho quay lại
    });

    // Dọn dẹp sự kiện khi component unmount
    return () => backHandler.remove();
  }, [navigation]);

  const handleNavigation = (screen) => {
    navigation.navigate(screen);
  };

  const controlButtons = [
    { icon: 'ticket-outline', color: '#5856D6', label: 'Đặt vé', screen: 'FlightRoute' },
    // { icon: 'airplane', color: '#007AFF', label: 'Chuyến Bay', screen: 'FlightRoute' },
    { icon: 'alert-circle-outline', color: '#FF3B30', label: 'Cảnh báo', screen: 'AlertRouteDetails' },
    { icon: 'weather-cloudy', color: '#34C759', label: 'Thời tiết', screen: 'WeatherDetails' },
    { icon: 'clock', color: '#5856D6', label: 'Dự báo', screen: 'Forecast' },
  
  ];

  // Extract weather data from API response
  const weatherData = loading || !currentWeather?.current_weather ? [] : [
    { 
      icon: 'thermometer', 
      color: '#FF6B6B', 
      value: `${currentWeather.current_weather.temperature || 0}°C`, 
      label: 'Nhiệt độ' 
    },
    { 
      icon: 'weather-windy', 
      color: '#4A90E2', 
      value: `${currentWeather.current_weather.wind_speed || 0} km/h`, 
      label: 'Gió' 
    },
    { 
      icon: 'water-percent', 
      color: '#34C759', 
      value: `${currentWeather.current_weather.humidity || 0}%`, 
      label: 'Độ ẩm' 
    },
    { 
      icon: 'eye', 
      color: '#FFD60A', 
      value: `${currentWeather.current_weather.visibility || 0} km`, 
      label: 'Tầm nhìn' 
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.weatherCard}>
        <View style={styles.weatherHeader}>
                    <Text style={styles.weatherTitle}>Điều kiện thời tiết hiện tại</Text>
                    <TouchableOpacity
                      style={styles.weatherDropdown}
                      onPress={() => setShowAirportSelector(true)}
                    >
                      <Text style={styles.dropdownText}>{getLocationString()}</Text>
                      <Ionicons name="chevron-down" size={16} color="#4A90E2" />
                    </TouchableOpacity>
                  </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>Đang tải dữ liệu thời tiết...</Text>
          </View>
        ) : (
          <View style={styles.weatherGrid}>
            {weatherData.map((item, index) => (
              <View key={index} style={styles.weatherItem}>
                <MaterialCommunityIcons name={item.icon} size={26} color={item.color} />
                <View>
                  <Text style={styles.weatherValue}>{item.value}</Text>
                  <Text style={styles.weatherLabel}>{item.label}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.controlGrid}>
        {controlButtons.map((button, index) => (
          <TouchableOpacity key={index} style={styles.controlButton} onPress={() => handleNavigation(button.screen)}>
            <MaterialCommunityIcons name={button.icon} size={28} color={button.color} />
            <Text style={styles.buttonText}>{button.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <AirportSelector 
        visible={showAirportSelector}
        airports={airports}
        onSelect={changeAirport}
        onClose={() => setShowAirportSelector(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  weatherCard: {
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 15,
    padding: 20,
    elevation: 4,
  },
  weatherHeader: {
    flexDirection: 'column',
    marginBottom: 15,
  },
  weatherTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  weatherDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F0F4F8',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  dropdownText: {
    fontSize: 14,
    color: '#4A90E2',
    marginRight: 5,
  },
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  weatherItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F9FAFC',
    borderRadius: 10,
    marginVertical: 5,
  },
  weatherValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  weatherLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  controlGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    margin: 15,
  },
  controlButton: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    marginVertical: 8,
  },
  buttonText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  weatherTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationText: {
    fontSize: 14,
    color: '#4A90E2',
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  }
});