import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../utils/theme';

const getWeatherIcon = (condition) => {
  // Map weather condition codes to icons
  const conditionMap = {
    'clear': 'sunny',
    'partly-cloudy': 'partly-sunny',
    'cloudy': 'cloudy',
    'rain': 'rainy',
    'thunderstorm': 'thunderstorm',
    'snow': 'snow',
    'mist': 'cloud',
  };

  // Default icon
  return conditionMap[condition] || 'cloud';
};

export function WeatherForecast({ forecast, loading, error }) {
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Đang tải dự báo thời tiết...</Text>
      </View>
    );
  }

  if (error || !forecast || forecast.length === 0) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Ionicons name="calendar-outline" size={30} color={theme.colors.text} />
        <Text style={styles.errorText}>Không có dữ liệu dự báo</Text>
      </View>
    );
  }

  // Show only the first 7 forecast items
  const displayForecast = forecast.slice(0, 7);
  
  // Get the warning if exists in data
  const warning = forecast.find(item => item.warning)?.warning || null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dự báo thời tiết ngắn hạn</Text>
      
      {warning && (
        <View style={styles.warningBox}>
          <Ionicons name="warning" size={20} color="#E74C3C" />
          <Text style={styles.warningText}>{warning}</Text>
        </View>
      )}

      <View style={styles.forecastContainer}>
        <View style={styles.hourlyForecast}>
          {displayForecast.map((item, index) => (
            <View key={index} style={styles.hourlyItem}>
              <Text style={styles.time}>{item.time}</Text>
              <Ionicons 
                name={getWeatherIcon(item.condition)} 
                size={24} 
                color={theme.colors.text}
              />
              <Text style={styles.temperature}>{item.temperature}°C</Text>
            </View>
          ))}
        </View>

        <View style={styles.conditions}>
          <View style={styles.conditionItem}>
            <Text style={styles.conditionLabel}>Tốc độ gió</Text>
            <Text style={styles.conditionValue}>{forecast[0].windSpeed}km/h</Text>
          </View>
          <View style={styles.conditionItem}>
            <Text style={styles.conditionLabel}>Độ ẩm</Text>
            <Text style={styles.conditionValue}>{forecast[0].humidity}%</Text>
          </View>
          <View style={styles.conditionItem}>
            <Text style={styles.conditionLabel}>Tầm nhìn</Text>
            <Text style={styles.conditionValue}>{forecast[0].visibility}km</Text>
          </View>
          <View style={styles.conditionItem}>
            <Text style={styles.conditionLabel}>Mưa</Text>
            <Text style={styles.conditionValue}>{forecast[0].precipitation || 0}%</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE4E1',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
  },
  warningText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: theme.spacing.md,
  },
  hourlyForecast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  hourlyItem: {
    alignItems: 'center',
  },
  time: {
    marginBottom: theme.spacing.xs,
  },
  temperature: {
    marginTop: theme.spacing.xs,
    fontWeight: 'bold',
  },
  conditions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: theme.colors.background,
    paddingTop: theme.spacing.md,
  },
  conditionItem: {
    alignItems: 'center',
  },
  conditionLabel: {
    color: theme.colors.gray,
    marginBottom: theme.spacing.xs,
  },
  conditionValue: {
    fontWeight: 'bold',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.text,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    marginTop: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.text,
  }
});