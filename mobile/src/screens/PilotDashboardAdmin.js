import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Header from './Header';
import { useWeather } from '../contexts/WeatherContext';
import { AirportSelector } from '../components/AirportSelector/AirportSelector';

export default function PilotDashboard({ navigation }) {
  // Use weather context
  const { 
    currentWeather, 
    forecastData,
    selectedAirport, 
    loading, 
    airports, 
    changeAirport 
  } = useWeather();
  
  const [showAirportSelector, setShowAirportSelector] = useState(false);
  
  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: false,
    });
  }, [navigation]);

  // Format location string
  const getLocationString = () => {
    const airport = airports.find(a => a.iata === selectedAirport);
    return airport ? `${airport.name} (${airport.iata})` : selectedAirport;
  };

  const handleNavigation = (screen) => {
    navigation.navigate(screen);
  };

  const controlButtons = [
    { icon: 'airplane', color: '#4A90E2', label: 'Chuyến bay', screen: 'FlightRouteAdmin' },
    { icon: 'alert-circle-outline', color: '#FFB100', label: 'Cảnh báo', screen: 'AlertRouteDetails' },
    { icon: 'help-circle', color: '#4A90E2', label: 'Thời tiết', screen: 'WeatherDetails' },
    { icon: 'clock', color: '#4CAF50', label: 'Dự báo', screen: 'Forecast' },
    // { icon: 'tools', color: '#673AB7', label: 'Lịch bay', screen: 'ChangeFlight' },
    { icon: 'file-document', color: '#F44336', label: 'Báo cáo', screen: 'IncidentReportScreen' },
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

  // Check for weather warnings
  const hasWarning = forecastData && forecastData.some(item => 
    item.condition?.text?.toLowerCase().includes('rain') || 
    item.wind_speed > 20
  );
  
  const warningMessage = hasWarning ? 
    `Cảnh báo: ${forecastData.find(item => 
      item.condition?.text?.toLowerCase().includes('rain') ? 
      'Mưa giông tại ' : 'Gió mạnh tại ')}${selectedAirport}` : null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Warning Banner */}
        {hasWarning && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning" size={22} color="#721c24" />
            <Text style={styles.warningText}>{warningMessage || `Cảnh báo thời tiết tại ${selectedAirport}`}</Text>
          </View>
        )}

        {/* Weather Card */}
        <View style={styles.weatherCard}>
          <View style={styles.weatherHeader}>
            <Text style={styles.weatherTitle}>Thời tiết hiện tại</Text>
            <TouchableOpacity 
              style={styles.locationButton} 
              onPress={() => setShowAirportSelector(true)}
            >
              <Text style={styles.locationText}>{getLocationString()}</Text>
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
                  <MaterialCommunityIcons name={item.icon} size={28} color={item.color} />
                  <View style={styles.weatherInfo}>
                    <Text style={styles.weatherValue}>{item.value}</Text>
                    <Text style={styles.weatherLabel}>{item.label}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Control Buttons */}
        <View style={styles.controlSection}>
          <Text style={styles.sectionTitle}>Điều khiển nhanh</Text>
          <View style={styles.controlGrid}>
            {controlButtons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={styles.controlButton}
                onPress={() => button.screen && handleNavigation(button.screen)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name={button.icon} size={30} color={button.color} />
                <Text style={styles.buttonText}>{button.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
      
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
    backgroundColor: '#F5F6FA',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  warningBanner: {
    backgroundColor: '#FFF1F2',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 16,
    elevation: 2,
  },
  warningText: {
    color: '#721c24',
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '500',
  },
  weatherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    marginBottom: 20,
  },
  weatherHeader: {
    flexDirection: 'column',
    marginBottom: 16,
  },
  weatherTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  locationText: {
    fontSize: 14,
    color: '#4A90E2',
    marginRight: 4,
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
    backgroundColor: '#F9FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  weatherInfo: {
    marginLeft: 10,
  },
  weatherValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  weatherLabel: {
    fontSize: 13,
    color: '#666',
  },
  controlSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  controlGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  controlButton: {
    width: '32%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    marginBottom: 12,
    padding: 10,
  },
  buttonText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
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