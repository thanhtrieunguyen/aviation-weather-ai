import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';

export default function FlightDetails() {
  const navigation = useNavigation();
  const { user, loading: authLoading } = useAuth();
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      fetchFlights();
    }
  }, [authLoading, user]);

  const fetchFlights = async () => {
    try {
      const url = 'http://192.168.2.11:5000/flights'; // Lấy tất cả chuyến bay
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch flights');
      }
      let data = await response.json();

      // Lọc chuyến bay: chỉ giữ lại chuyến bay có Pilot_email khớp với user.email
      if (user?.email) {
        data = data.filter(flight => flight.Pilot_email === user.email);
      } else {
        data = []; // Nếu không có user.email, không hiển thị gì
      }
      setFlights(data);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu chuyến bay:', error);
      setFlights([]); // Nếu có lỗi, không hiển thị chuyến bay
    } finally {
      setLoading(false);
    }
    console.log('User:', user);
    console.log('Fetching URL:', url);
  };

  const getStatusColor = (statusCode) => {
    switch (statusCode?.[0]) {
      case 'S': return styles.greenStatus; // Scheduled
      case 'D': return styles.redStatus;   // Delayed
      case 'C': return styles.redStatus;   // Cancelled
      case 'I': return styles.blueStatus;  // In Progress
      case 'O': return styles.grayStatus;  // Open
      case 'C': return styles.greenStatus; // Completed
      default: return styles.grayStatus;
    }
  };

  const handleFlightPress = (flight) => {
    navigation.navigate('FlightRouteDetails', { flight });
  };

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498DB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#3498DB" style={{ marginTop: 20 }} />
      ) : (
        <ScrollView>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Chi tiết chuyến bay</Text>
          </View>

          {flights.length === 0 ? (
            <Text style={styles.noDataText}>Không có chuyến bay nào.</Text>
          ) : (
            flights.map((flight, index) => (
              <TouchableOpacity
                key={flight._id || flight.Number_Flight}
                onPress={() => handleFlightPress(flight)}
                style={[styles.flightItem, index < flights.length - 1 ? styles.borderBottom : null]}
              >
                <View style={styles.flightDetails}>
                  <Text style={styles.flightNumber}>{flight.Number_Flight}</Text>
                  <Text style={styles.flightRoute}>{flight.From} → {flight.To}</Text>
                  <Text style={styles.flightTime}>
                    {formatUTCDateTime(flight.Time_depart)}
                  </Text>
                  
                  {/* Add price information */}
                  <View style={styles.priceContainer}>
                    {flight.Initial_price !== flight.Current_price ? (
                      <>
                        <Text style={styles.originalPrice}>{formatCurrency(flight.Initial_price)}</Text>
                        <Text style={styles.currentPrice}>{formatCurrency(flight.Current_price)}</Text>
                      </>
                    ) : (
                      <Text style={styles.currentPrice}>{formatCurrency(flight.Current_price || 1000000)}</Text>
                    )}
                  </View>
                </View>
                
                <Text style={[styles.flightStatus, getStatusColor(flight.Status)]}>
                  {flight.Status}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

// Add this helper function to format currency
const formatCurrency = (amount) => {
  if (!amount) return '0 VNĐ';
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Add this helper function to format dates in UTC
const formatUTCDateTime = (dateTime) => {
  if (!dateTime) return 'N/A';
  
  const date = new Date(dateTime);
  
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes} ${day}/${month}/${year}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  flightItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  flightDetails: {
    flex: 1,
  },
  flightNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  flightRoute: {
    fontSize: 14,
    color: '#666',
  },
  flightTime: {
    fontSize: 12,
    color: '#999',
  },
  flightStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  greenStatus: {
    color: '#2ECC71',
  },
  blueStatus: {
    color: '#3498DB',
  },
  redStatus: {
    color: '#E74C3C',
  },
  grayStatus: {
    color: '#7F8C8D',
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  priceContainer: {
    marginTop: 5,
  },
  originalPrice: {
    fontSize: 12,
    color: '#666',
    textDecorationLine: 'line-through',
  },
  currentPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E53935',
  },
});