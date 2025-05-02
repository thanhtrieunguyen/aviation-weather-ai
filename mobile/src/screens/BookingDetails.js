import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Add a UTC date formatter function
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

// Format time to just show hours and minutes in UTC
const formatUTCTimeOnly = (dateTime) => {
  if (!dateTime) return 'N/A';
  
  const date = new Date(dateTime);
  
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
};

const BookingDetails = ({ booking }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Booking ID: {booking.id}</Text>
      <Text style={styles.label}>Customer Name: {booking.customerName}</Text>
      <Text style={styles.label}>Booking Date: {formatUTCDateTime(booking.date)}</Text>
      <Text style={styles.label}>Booking Time: {formatUTCTimeOnly(booking.time)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
});

export default BookingDetails;