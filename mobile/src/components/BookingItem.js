import React from 'react';
import { View, Text } from 'react-native';

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

const BookingItem = ({ booking }) => {
  return (
    <View>
      <Text>{formatUTCDateTime(booking.Time_depart)}</Text>
    </View>
  );
};

export default BookingItem;