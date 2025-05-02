import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useWeather } from '../contexts/WeatherContext';
import { AirportSelector } from '../components/AirportSelector/AirportSelector';

const WeatherDetails = () => {
  const {
    currentWeather,
    forecastData,
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

  // Get weather conditions
  const getWeatherCondition = () => {
    // Kiểm tra nếu có condition object đầy đủ
    if (currentWeather?.current_weather?.condition?.text) {
      return currentWeather.current_weather.condition.text;
    }

    // Nếu chỉ có condition_code, dùng mapping để lấy text
    if (currentWeather?.current_weather?.condition_code) {
      const is_day = currentWeather?.current_weather?.is_day === 1;
      
      const conditionMap = {
        1000: is_day ? "Nhiều nắng" : "Trời quang",
        1003: "Có Mây",
        1006: "Nhiều mây",
        1009: "U ám",
        1030: "Sương mù",
        1063: "Mưa lả tả gần đó",
        1066: "Tuyết rơi lả tả gần đó",
        1069: "Mưa tuyết lả tả gần đó",
        1072: "Mưa phùn băng giá lả tả gần đó",
        1087: "Các cơn giông tố nổi lên gần đó",
        1114: "Tuyết thổi mạnh",
        1117: "Trận bão tuyết",
        1135: "Sương mù",
        1147: "Sương mù băng giá",
        1150: "Mưa phùn nhẹ lả tả",
        1153: "Mưa phùn nhẹ",
        1168: "Mưa phùn băng giá",
        1171: "Mưa phùn nặng băng giá",
        1180: "Mưa nhẹ lả tả",
        1183: "Mưa nhẹ",
        1186: "Thỉnh thoảng mưa vừa",
        1189: "Mưa vừa",
        1192: "Thỉnh thoảng mưa nặng hạt",
        1195: "Mưa rơi nặng hạt",
        1198: "Mưa giá rét nhẹ",
        1201: "Mưa giá rét Vừa hoặc Nặng Hạt",
        1204: "Mưa tuyết nhẹ",
        1207: "Mưa tuyết vừa hoặc nặng hạt",
        1210: "Tuyết nhẹ lả tả",
        1213: "Tuyết nhẹ",
        1216: "Tuyết vừa lả tả",
        1219: "Tuyết vừa",
        1222: "Tuyết rơi nặng hạt lả tả",
        1225: "Tuyết rơi nặng hạt",
        1237: "Mưa đá",
        1240: "Mưa rào nhẹ",
        1243: "Mưa rào vừa hoặc nặng hạt",
        1246: "Mưa rào xối xả",
        1249: "Mưa tuyết rào nhẹ",
        1252: "Mưa tuyết rào vừa hoặc nặng hạt",
        1255: "Mưa rào lẫn tuyết nhẹ",
        1258: "Mưa rào lẫn tuyết vừa hoặc nặng hạt",
        1261: "Mưa đá rào nhẹ",
        1264: "Mưa đá rào vừa hoặc nặng hạt",
        1273: "Mưa nhẹ lả tả trong khu vực có sấm sét",
        1276: "Mưa vừa hoặc nặng hạt trong khu vực có sấm sét",
        1279: "Tuyết nhẹ lả tả trong khu vực có sấm sét",
        1282: "Tuyết vừa hoặc nặng hạt trong khu vực có sấm sét"
      };
      
      return conditionMap[currentWeather.current_weather.condition_code] || "Không xác định";
    }

    // Nếu không có cả 2 cách trên, trả về "Không xác định"
    return "Không xác định";
  };

  // Get appropriate weather icon based on condition code and is_day
  const getWeatherIcon = () => {
    if (!currentWeather?.current_weather?.condition_code) {
      return 'help-outline'; // Default icon if no condition code
    }
    
    const conditionCode = currentWeather.current_weather.condition_code;
    const isDay = currentWeather.current_weather.is_day === 1;
    
    // Map condition codes to Ionicons
    const iconMap = {
      1000: isDay ? 'sunny-outline' : 'moon-outline',
      1003: isDay ? 'partly-sunny-outline' : 'cloud-outline',
      1006: 'cloud-outline',
      1009: 'cloudy-outline',
      1030: 'water-outline',
      1063: 'rainy-outline',
      1066: 'snow-outline',
      1069: 'snow-outline',
      1072: 'snow-outline',
      1087: 'thunderstorm-outline',
      1114: 'snow-outline',
      1117: 'snow-outline',
      1135: 'water-outline',
      1147: 'water-outline',
      1150: 'rainy-outline',
      1153: 'rainy-outline',
      1168: 'rainy-outline',
      1171: 'rainy-outline',
      1180: 'rainy-outline',
      1183: 'rainy-outline',
      1186: 'rainy-outline',
      1189: 'rainy-outline',
      1192: 'rainy-outline',
      1195: 'rainy-outline',
      1198: 'rainy-outline',
      1201: 'rainy-outline',
      1204: 'snow-outline',
      1207: 'snow-outline',
      1210: 'snow-outline',
      1213: 'snow-outline',
      1216: 'snow-outline',
      1219: 'snow-outline',
      1222: 'snow-outline',
      1225: 'snow-outline',
      1237: 'snow-outline',
      1240: 'rainy-outline',
      1243: 'rainy-outline',
      1246: 'rainy-outline',
      1249: 'snow-outline',
      1252: 'snow-outline',
      1255: 'snow-outline',
      1258: 'snow-outline',
      1261: 'snow-outline',
      1264: 'snow-outline',
      1273: 'thunderstorm-outline',
      1276: 'thunderstorm-outline',
      1279: 'thunderstorm-outline',
      1282: 'thunderstorm-outline'
    };
    
    return iconMap[conditionCode] || 'help-outline';
  };

  // Check for weather warnings or alerts
  const getAlerts = () => {
    if (!forecastData || !Array.isArray(forecastData)) return [];

    const alerts = [];
    const nextHoursData = forecastData.slice(0, 12); // Look at next 12 hours

    // Check for rain or thunderstorm
    const hasRain = nextHoursData.some(item => {
      const conditionCode = item.condition_code;
      return conditionCode >= 1063 && conditionCode <= 1276 && 
        ![1066, 1069, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1255, 1258, 1261, 1264].includes(conditionCode);
    });
    
    if (hasRain) {
      alerts.push({
        icon: 'rainy-outline',
        heading: 'Cảnh báo mưa giông',
        description: 'Mưa giông dự kiến trong vài giờ tới.'
      });
    }

    // Check for thunderstorm
    const hasThunderstorm = nextHoursData.some(item => {
      const conditionCode = item.condition_code;
      return [1087, 1273, 1276, 1279, 1282].includes(conditionCode);
    });
    
    if (hasThunderstorm) {
      alerts.push({
        icon: 'thunderstorm-outline',
        heading: 'Cảnh báo giông sét',
        description: 'Giông sét dự kiến trong khu vực, hãy cẩn trọng.'
      });
    }

    // Check for snow
    const hasSnow = nextHoursData.some(item => {
      const conditionCode = item.condition_code;
      return [1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258, 1279, 1282].includes(conditionCode);
    });
    
    if (hasSnow) {
      alerts.push({
        icon: 'snow-outline',
        heading: 'Cảnh báo tuyết rơi',
        description: 'Tuyết dự kiến rơi trong vài giờ tới, có thể gây chậm chuyến bay.'
      });
    }

    // Check for strong winds
    const hasStrongWinds = nextHoursData.some(item => item.wind_speed > 20);
    if (hasStrongWinds) {
      alerts.push({
        icon: 'golf-outline',
        heading: 'Gió mạnh',
        description: 'Gió mạnh dự kiến trong khu vực, có thể ảnh hưởng đến chuyến bay.'
      });
    }

    // Default alert if no specific conditions are detected but we want to show something
    if (alerts.length === 0 && forecastData[0]?.visibility < 8) {
      alerts.push({
        icon: 'eye-outline',
        heading: 'Tầm nhìn hạn chế',
        description: 'Tầm nhìn giảm xuống dưới 8km.'
      });
    }

    return alerts;
  };

  // Get current weather data
  const weatherItems = !loading && currentWeather?.current_weather ? [
    {
      icon: 'thermometer-outline',
      color: '#E94B3C',
      value: `${currentWeather.current_weather.temperature || 0}°C`,
      label: 'Nhiệt độ'
    },
    {
      icon: 'water-outline',
      color: '#4A90E2',
      value: `${currentWeather.current_weather.humidity || 0}%`,
      label: 'Độ ẩm'
    },
    {
      icon: 'speedometer-outline',
      color: '#4A90E2',
      value: `${currentWeather.current_weather.pressure || 1013}`,
      label: 'hPa'
    },
    {
      icon: 'cloud-outline',
      color: '#4A90E2',
      value: `${currentWeather.current_weather.wind_speed || 0} km/h`,
      label: 'Gió'
    },
    {
      icon: 'eye-outline',
      color: '#4A90E2',
      value: `${currentWeather.current_weather.visibility || 0} km`,
      label: 'Tầm nhìn'
    },
    {
      icon: getWeatherIcon(),
      color: '#E94B3C',
      value: getWeatherCondition(),
      label: 'Hiện tại'
    }
  ] : [];

  const weatherAlerts = getAlerts();

  return (
    <View style={styles.container}>
      {/* Main Content */}
      <ScrollView style={styles.mainContent}>
        {/* Weather Info */}
        <View style={styles.weatherInfo}>
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
            <View style={styles.weatherDetails}>
              {weatherItems.map((item, index) => (
                <View key={index} style={styles.weatherItem}>
                  <Ionicons name={item.icon} size={24} color={item.color} />
                  <Text style={styles.weatherValue}>{item.value}</Text>
                  <Text style={styles.weatherLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Weather Alerts */}
        <View style={styles.alertSection}>
          <Text style={styles.alertTitle}>Cảnh báo thời tiết</Text>

          {weatherAlerts.length === 0 ? (
            <View style={styles.noAlertCard}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#34C759" />
              <Text style={styles.noAlertText}>Không có cảnh báo thời tiết</Text>
            </View>
          ) : (
            weatherAlerts.map((alert, index) => (
              <View key={index} style={styles.alertCard}>
                <Ionicons name={alert.icon} size={24} color="#E94B3C" />
                <View style={styles.alertContent}>
                  <Text style={styles.alertHeading}>{alert.heading}</Text>
                  <Text style={styles.alertDescription}>{alert.description}</Text>
                </View>
              </View>
            ))
          )}
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },

  title: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    marginTop: 5,
  },
  mainContent: {
    flex: 1,
    padding: 15,
  },
  weatherInfo: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  weatherItem: {
    alignItems: 'center',
    marginBottom: 15,
    width: '30%',
  },
  weatherValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  weatherLabel: {
    fontSize: 12,
    color: '#666',
  },
  alertSection: {
    marginTop: 20,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  alertContent: {
    marginLeft: 10,
    flex: 1,
  },
  alertHeading: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  alertDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  noAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF0',
    padding: 15,
    borderRadius: 10,
  },
  noAlertText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#34C759',
  }
});

export default WeatherDetails;