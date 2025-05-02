import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../utils/theme';
import { useWeather } from '../../contexts/WeatherContext';

export function WeatherInfo({ location, weather, onLocationPress, loading: externalLoading }) {
  // Sử dụng WeatherContext
  const { 
    loading: contextLoading, 
    error, 
    refreshWeatherData,
    clearWeatherCache
  } = useWeather();

  // Sử dụng loading từ prop hoặc context
  const loading = externalLoading || contextLoading;

  // Xử lý refresh dữ liệu
  const handleRefresh = async () => {
    await refreshWeatherData();
  };

  // Xử lý xóa cache và tải lại
  const handleClearCache = async () => {
    await clearWeatherCache();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Đang tải dữ liệu thời tiết...</Text>
      </View>
    );
  }

  console.log('WeatherInfo:', weather, error);
  
  if (!weather || error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Ionicons name="cloud-offline-outline" size={40} color={theme.colors.text} />
        <Text style={styles.errorText}>Không thể tải dữ liệu thời tiết</Text>
        
        {/* Thêm nút refresh và xóa cache */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Ionicons name="refresh" size={16} color={theme.colors.white} />
            <Text style={styles.buttonText}>Tải lại</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.clearButton} onPress={handleClearCache}>
            <Ionicons name="trash" size={16} color={theme.colors.white} />
            <Text style={styles.buttonText}>Xóa cache</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.label}>Điều kiện thời tiết hiện tại</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshIcon}>
            <Ionicons name="refresh" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.locationPicker} onPress={onLocationPress}>
          <Text>{location}</Text>
          <Ionicons name="chevron-down" size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.weatherGrid}>
        <View style={styles.weatherItem}>
          <Ionicons name="thermometer-outline" size={24} color={theme.colors.text} />
          <Text style={styles.weatherLabel}>Nhiệt độ</Text>
          <Text style={styles.weatherValue}>{weather.temperature}°C</Text>
        </View>

        <View style={styles.weatherItem}>
          <Ionicons name="cloud-outline" size={24} color={theme.colors.text} />
          <Text style={styles.weatherLabel}>Gió</Text>
          <Text style={styles.weatherValue}>{weather.windSpeed} km/h</Text>
        </View>

        <View style={styles.weatherItem}>
          <Ionicons name="water-outline" size={24} color={theme.colors.text} />
          <Text style={styles.weatherLabel}>Độ ẩm</Text>
          <Text style={styles.weatherValue}>{weather.humidity}%</Text>
        </View>

        <View style={styles.weatherItem}>
          <Ionicons name="eye-outline" size={24} color={theme.colors.text} />
          <Text style={styles.weatherLabel}>Tầm nhìn</Text>
          <Text style={styles.weatherValue}>{weather.visibility} km</Text>
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
    marginBottom: theme.spacing.md,
  },
  header: {
    marginBottom: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  label: {
    fontSize: 16,
    color: theme.colors.text,
  },
  refreshIcon: {
    padding: theme.spacing.xs,
  },
  locationPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
  },
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  weatherItem: {
    width: '48%',
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
  },
  weatherLabel: {
    fontSize: 14,
    color: theme.colors.gray,
    marginVertical: theme.spacing.xs,
  },
  weatherValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.text,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
  },
  errorText: {
    marginTop: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: theme.spacing.md,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginHorizontal: theme.spacing.sm,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.error || '#e53935',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginHorizontal: theme.spacing.sm,
  },
  buttonText: {
    color: theme.colors.white,
    marginLeft: theme.spacing.xs,
    fontWeight: 'bold',
  },
});