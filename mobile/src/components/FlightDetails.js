import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from './Header';

export default function FlightDetails() {
  const navigation = useNavigation();
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlights();
  }, []);

  const fetchFlights = async () => {
    try {
      console.log("Gửi request...");
      const response = await fetch('http://192.168.2.11:5000/flights');

      console.log("Response:", response);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Dữ liệu chuyến bay:", data);

      setFlights(data);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu chuyến bay:", error.message);
    } finally {
      setLoading(false);
    }
  };


  const getStatusColor = (statusCode) => {
    switch (statusCode[0]) {
      case 'A': return styles.greenStatus;
      case 'B': return styles.blueStatus;
      case 'C': return styles.redStatus;
      default: return styles.grayStatus;
    }
  };

  const handleFlightPress = (flight) => {
    navigation.navigate('FlightRouteDetails', { flight });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498DB" />
      </View>
    );
  }

  const PriceDisplay = ({ flight }) => {
    const hasDiscount = flight.Current_price < flight.Initial_price;

    return (
      <View style={styles.priceContainer}>
        {hasDiscount ? (
          <>
            <Text style={styles.originalPrice}>{formatCurrency(flight.Initial_price)} VND</Text>
            <Text style={styles.discountedPrice}>{formatCurrency(flight.Current_price)} VND</Text>
            <Badge>Giảm giá do thời tiết</Badge>
          </>
        ) : (
          <Text style={styles.price}>{formatCurrency(flight.Current_price)} VND</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Chi tiết chuyến bay</Text>
        </View>

        {flights.map((flight, index) => (
          <TouchableOpacity
            key={flight._id}
            onPress={() => handleFlightPress(flight)}
            style={[
              styles.flightItem,
              index < flights.length - 1 ? styles.borderBottom : null
            ]}
          >
            <View style={styles.flightDetails}>
              <Text style={styles.flightNumber}>{flight.flightNumber}</Text>
              <Text style={styles.flightRoute}>{flight.route}</Text>
              <Text style={styles.flightTime}>{flight.time}</Text>
            </View>
            <Text style={[styles.flightStatus, getStatusColor(flight.statusCode)]}>
              {flight.status}
            </Text>
            <PriceDisplay flight={flight} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
