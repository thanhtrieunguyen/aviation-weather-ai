import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import axios from 'axios';

export default function FlightErrorList() {
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    axios.get('http://192.168.2.11:5000/alerts')
      .then(response => setErrors(response.data))
      .catch(error => console.error('Lỗi khi lấy dữ liệu:', error));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Danh sách lỗi chuyến bay</Text>
      <FlatList
        data={errors}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.flight}>Chuyến bay: {item.Number_Flight}</Text>
            <Text style={styles.content}>Lỗi: {item.content}</Text>
            <Text style={[styles.level, { color: item.level === 'high' ? 'red' : 'orange' }]}>
              Mức độ: {item.level}
            </Text>
            <Text style={styles.status}>Trạng thái: {item.status === 'resolved' ? 'Đã xử lý' : 'Chưa xử lý'}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15, backgroundColor: '#F5F6FA', flex: 1 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10 },
  flight: { fontWeight: 'bold' },
  content: { color: '#555' },
  level: { fontWeight: 'bold' },
  status: { marginTop: 5, fontStyle: 'italic' }
});
