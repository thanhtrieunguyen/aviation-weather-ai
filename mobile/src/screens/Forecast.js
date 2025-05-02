import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWeather } from '../contexts/WeatherContext';
import { AirportSelector } from '../components/AirportSelector/AirportSelector';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const Forecast = () => {
  const { forecastData, selectedAirport, loading, airports, changeAirport } = useWeather();
  const [showAirportSelector, setShowAirportSelector] = useState(false);
  
  // Format location string
  const getLocationString = () => {
    const airport = airports.find(a => a.iata === selectedAirport);
    return airport ? `${airport.name} (${airport.iata})` : selectedAirport;
  };

  // Get weather icon based on condition
  const getWeatherIcon = (condition) => {
    if (!condition) return 'cloud-outline';
    
    const conditionText = condition.text?.toLowerCase() || '';
    
    if (conditionText.includes('rain') || conditionText.includes('shower')) {
      return 'rainy-outline';
    } else if (conditionText.includes('thunder') || conditionText.includes('storm')) {
      return 'thunderstorm-outline';
    } else if (conditionText.includes('snow')) {
      return 'snow-outline';
    } else if (conditionText.includes('clear')) {
      return 'sunny-outline';
    } else if (conditionText.includes('cloud')) {
      return 'cloudy-outline';
    } else if (conditionText.includes('fog') || conditionText.includes('mist')) {
      return 'cloud-outline';
    }
    
    return 'cloud-outline';
  };

  // Format forecast data
  const formatForecastData = () => {
    if (!forecastData || !Array.isArray(forecastData)) return [];
    
    return forecastData.slice(0, 18).map(item => {
      const date = new Date(item.timestamp);
      return {
        time: `${String(date.getHours()).padStart(2, '0')}:00`,
        icon: getWeatherIcon(item.condition),
        description: item.condition?.text || 'Không xác định',
        temperature: item.temperature || 0,
        humidity: item.humidity || 0,
        windSpeed: item.wind_speed || 0,
        windDirection: item.wind_direction_symbol || 'Đông',
      };
    });
  };

  // Get weather warnings
  const getWarningMessage = () => {
    if (!forecastData || !Array.isArray(forecastData) || forecastData.length === 0) return null;
    
    const nextHoursData = forecastData.slice(0, 12); // Look at next 12 hours
    
    // Check for rain or thunderstorm
    const rainHour = nextHoursData.findIndex(item => 
      item.condition?.text?.toLowerCase().includes('rain') || 
      item.condition?.text?.toLowerCase().includes('thunderstorm')
    );
    
    if (rainHour >= 0) {
      const hour = new Date(nextHoursData[rainHour].timestamp).getHours();
      return `${hour}:00 - Cảnh báo Mưa giông: Có mưa giông dự kiến vào lúc ${hour}:00 với khả năng sấm sét.`;
    }
    
    // Check for strong winds
    const windyHour = nextHoursData.findIndex(item => item.wind_speed > 20);
    if (windyHour >= 0) {
      const hour = new Date(nextHoursData[windyHour].timestamp).getHours();
      return `${hour}:00 - Cảnh báo gió mạnh: Gió mạnh dự kiến vào lúc ${hour}:00 với tốc độ trên 20 km/h.`;
    }
    
    return null;
  };
  
  // Prepare chart data
  const prepareChartData = () => {
    if (!forecastData || !Array.isArray(forecastData) || forecastData.length === 0) {
      return {
        temperature: {
          labels: [],
          datasets: [{ data: [] }]
        },
        humidity: {
          labels: [],
          datasets: [{ data: [] }]
        }
      };
    }

    // Use the next 24 hours of data (or less if not available)
    const chartData = forecastData.slice(0, 24);
    
    // Format the labels (time)
    const labels = chartData.map(item => {
      const date = new Date(item.timestamp);
      return `${date.getHours()}h`;
    });
    
    // Extract temperature and humidity data
    const temperatures = chartData.map(item => item.temperature || 0);
    const humidities = chartData.map(item => item.humidity || 0);
    
    // Find min and max values to create better y-axis scales
    const minTemp = Math.floor(Math.min(...temperatures)) - 1;
    const maxTemp = Math.ceil(Math.max(...temperatures)) + 1;
    const minHumidity = Math.max(0, Math.floor(Math.min(...humidities)) - 5);
    const maxHumidity = Math.min(100, Math.ceil(Math.max(...humidities)) + 5);

    return {
      temperature: {
        labels: labels.filter((_, i) => i % 3 === 0), // Show every 3rd label to avoid crowding
        datasets: [{ data: temperatures }],
        // Add these for custom y-axis
        yAxisLabel: '',
        yAxisSuffix: '°C',
        yMin: minTemp,
        yMax: maxTemp
      },
      humidity: {
        labels: labels.filter((_, i) => i % 3 === 0), // Show every 3rd label to avoid crowding
        datasets: [{ data: humidities }],
        // Add these for custom y-axis
        yAxisLabel: '',
        yAxisSuffix: '%',
        yMin: minHumidity,
        yMax: maxHumidity
      }
    };
  };

  const formattedForecast = formatForecastData();
  const warningMessage = getWarningMessage();
  const chartData = prepareChartData();

  // Chart configuration
  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#4A90E2'
    },
    // Add y-axis configurations
    propsForVerticalLabels: {
      fontSize: 10,
      rotation: 0
    },
    formatYLabel: (value) => `${parseFloat(value).toFixed(1)}`,
    // Show horizontal grid lines
    withHorizontalLines: true,
    // Add more gridlines for better readability
    segments: 5
  };
  
  // Humidity chart configuration - uses a different color
  const humidityChartConfig = {
    ...chartConfig,
    color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#2ECC71'
    }
  };

  return (
    <View style={styles.container}>
      {/* Main Content */}
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
      >
        {/* Location selector */}
        <TouchableOpacity 
          style={styles.locationSelector} 
          onPress={() => setShowAirportSelector(true)}
        >
          <Text style={styles.locationText}>{getLocationString()}</Text>
          <Ionicons name="chevron-down" size={16} color="#4A90E2" />
        </TouchableOpacity>
        
        {/* Short-term forecast */}
        <View style={styles.forecastSection}>
          <Text style={styles.sectionTitle}>Dự báo ngắn hạn</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4A90E2" />
              <Text style={styles.loadingText}>Đang tải dự báo thời tiết...</Text>
            </View>
          ) : !formattedForecast.length ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Không có dữ liệu dự báo</Text>
            </View>
          ) : (
            <View style={styles.forecastCard}>
              {formattedForecast.slice(0, 6).map((item, index) => (
                <View key={index} style={styles.forecastRow}>
                  <Ionicons name={item.icon} size={24} color="#555" />
                  <View style={styles.forecastDetails}>
                    <Text style={styles.forecastTime}>{item.time}</Text>
                    <Text style={styles.forecastDesc}>{item.description}</Text>
                  </View>
                  <View style={styles.forecastStats}>
                    <Text style={styles.forecastTemp}>{item.temperature}°C</Text>
                    <Text style={styles.forecastHumidity}>Độ ẩm: {item.humidity}%</Text>
                    <Text style={styles.forecastWind}>Gió: {item.windSpeed} km/h {item.windDirection}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Temperature and humidity charts */}
        {!loading && formattedForecast.length > 0 && (
          <View style={styles.graphSection}>
            <Text style={styles.graphTitle}>Biểu đồ nhiệt độ (°C)</Text>
            <View style={styles.chartContainer}>
              <LineChart
                data={chartData.temperature}
                width={screenWidth - 40} // Adjust width to fit screen with padding
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                // Add these properties
                fromZero={false}
                withVerticalLines={false}
                withInnerLines={true}
                verticalLabelRotation={0}
                yAxisInterval={1}
                formatYLabel={(value) => `${parseFloat(value).toFixed(1)}°C`}
              />
            </View>

            <Text style={styles.graphTitle}>Biểu đồ độ ẩm (%)</Text>
            <View style={styles.chartContainer}>
              <LineChart
                data={chartData.humidity}
                width={screenWidth - 40} // Adjust width to fit screen with padding
                height={220}
                chartConfig={humidityChartConfig}
                bezier
                style={styles.chart}
                fromZero={false}
                withVerticalLines={false}
                withInnerLines={true}
                verticalLabelRotation={0}
                yAxisInterval={1}
                formatYLabel={(value) => `${parseFloat(value).toFixed(0)}%`}
              />
            </View>
          </View>
        )}

        {/* Warning section */}
        {warningMessage && (
          <View style={styles.warningSection}>
            <Text style={styles.warningText}>{warningMessage}</Text>
          </View>
        )}
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
  header: {
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 15,
  },
  contentContainer: {
    paddingBottom: 120,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  forecastSection: {
    marginBottom: 20,
  },
  forecastCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  forecastDetails: {
    flex: 1,
    marginLeft: 10,
  },
  forecastTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  forecastDesc: {
    fontSize: 16,
    color: '#555',
  },
  forecastStats: {
    alignItems: 'flex-end',
  },
  forecastTemp: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#E74C3C',
  },
  forecastHumidity: {
    fontSize: 15,
    color: '#3498DB',
  },
  forecastWind: {
    fontSize: 15,
    color: '#27AE60',
  },
  graphSection: {
    marginBottom: 20,
  },
  graphTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  chartContainer: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  chart: {
    borderRadius: 10,
    paddingRight: 10,
  },
  warningSection: {
    backgroundColor: '#FDEDEC',
    padding: 15,
    borderRadius: 10,
  },
  warningText: {
    fontSize: 14,
    color: '#E74C3C',
    fontWeight: 'bold',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#4A90E2',
    padding: 15,
  },
  navItem: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  locationText: {
    fontSize: 16,
    color: '#333',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#666',
  }
});

export default Forecast;
