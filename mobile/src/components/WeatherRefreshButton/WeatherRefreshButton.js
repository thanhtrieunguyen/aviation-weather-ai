import React, { useState } from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWeather } from '../../contexts/WeatherContext';
import { formatDateTime } from '../../utils/weatherUtils';

export function WeatherRefreshButton({ style, showLastUpdated = true }) {
  const { refreshWeatherData, loading, lastUpdated } = useWeather();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (loading || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await refreshWeatherData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const clearWeatherCache = async () => {
    try {
      await AsyncStorage.getAllKeys()
        .then(keys => {
          const weatherKeys = keys.filter(key => key.includes('weather_'));
          AsyncStorage.multiRemove(weatherKeys);
        });
      // Force reload app hoặc re-fetch dữ liệu
      refreshWeatherData();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };
    
  const formattedTime = lastUpdated ? 
    formatDateTime(new Date(lastUpdated).toISOString(), 'time') : 
    '--:--';

  return (
    <View style={[styles.container, style]}>
      {showLastUpdated && lastUpdated && (
        <Text style={styles.lastUpdated}>
          Cập nhật lúc: {formattedTime}
        </Text>
      )}
      <TouchableOpacity 
        style={styles.button}
        onPress={handleRefresh}
        disabled={loading || isRefreshing}
      >
        {isRefreshing ? (
          <ActivityIndicator size="small" color="#4A90E2" />
        ) : (
          <Ionicons name="refresh" size={20} color="#4A90E2" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  }
});
