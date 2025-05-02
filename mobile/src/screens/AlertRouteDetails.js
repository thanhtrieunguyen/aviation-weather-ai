import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import BottomNav from './BottomNav';
import Header from './Header';
import axios from 'axios';

export default function ErrorAlert() {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await axios.get('http://192.168.2.11:5000/alerts');
        setErrors(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách lỗi chuyến bay:', error);
        setNetworkError(error.message || 'Không thể kết nối đến máy chủ');
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const getStatusStyle = (status) => ({
    color: status === 'resolved' ? 'green' : 'red',
    fontWeight: 'bold',
  });

  const getLevelColor = (level) => {
    switch (level) {
      case 'low': return '#4CAF50';    // Xanh lá
      case 'medium': return '#FF9800';  // Cam
      case 'high': return '#E94B3C';    // Đỏ
      default: return '#000';
    }
  };

  const renderErrorContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E94B3C" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      );
    }

    if (networkError) {
      return (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#E94B3C" />
          <Text style={styles.errorText}>Lỗi kết nối</Text>
          <Text style={styles.errorSubtext}>{networkError}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              setNetworkError(null);
              useEffect(); // Trigger re-fetch
            }}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (errors.length === 0) {
      return (
        <View style={styles.noErrorContainer}>
          <MaterialCommunityIcons name="check-circle" size={48} color="#4CAF50" />
          <Text style={styles.noErrorText}>Không có lỗi nào</Text>
        </View>
      );
    }

    return errors.map((item, index) => (
      <View key={index} style={styles.alertDetails}>
        <MaterialCommunityIcons 
          name="alert-circle" 
          size={24} 
          color={getLevelColor(item.level)} 
        />
        <View style={styles.alertTextContainer}>
          <Text style={styles.alertText}>{item.content}</Text>
          <Text style={styles.alertTime}>
            {new Date(item.time).toLocaleString()}
          </Text>
          <Text style={styles.alertText}>
            Chuyến bay: {item.Number_Flight}
          </Text>
          <Text 
            style={{ 
              color: getLevelColor(item.level), 
              fontWeight: 'bold' 
            }}
          >
            Mức độ: {item.level}
          </Text>
        </View>
        <Text 
          style={[
            styles.alertStatus, 
            getStatusStyle(item.status)
          ]}
        >
          {item.status}
        </Text>
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Cảnh báo</Text>

        {/* Weather Alert */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thời tiết</Text>
          <View style={styles.alertDetails}>
            <MaterialCommunityIcons 
              name="weather-lightning-rainy" 
              size={24} 
              color="#4A90E2" 
            />
            <View style={styles.alertTextContainer}>
              <Text style={styles.alertText}>Mưa giông tại SGN</Text>
              <Text style={styles.alertTime}>15 phút trước</Text>
              <Text style={styles.alertDescription}>
                Cơn mưa giông mạnh đang diễn ra tại sân bay Tân Sơn Nhất. 
                Đề xuất hạ cánh tại sân bay dự phòng.
              </Text>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionText}>Xem bản đồ thời tiết</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.secondaryActionButton]}
                >
                  <Text style={styles.actionText}>Liên hệ kiểm soát không lưu</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.tertiaryActionButton]}
                >
                  <Text style={styles.actionText}>Thay đổi lịch bay</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Error Alert */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Lỗi</Text>
          {renderErrorContent()}
        </View>

        {/* Risk Alert */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nguy cơ</Text>
          <View style={styles.alertDetails}>
            <MaterialCommunityIcons 
              name="alert" 
              size={24} 
              color="#FFB100" 
            />
            <View style={styles.alertTextContainer}>
              <Text style={styles.alertText}>Nguy cơ khủng bố</Text>
              <Text style={styles.alertTime}>30 phút trước</Text>
            </View>
          </View>
          <View style={styles.alertDetails}>
            <MaterialCommunityIcons 
              name="alert" 
              size={24} 
              color="#FFB100" 
            />
            <View style={styles.alertTextContainer}>
              <Text style={styles.alertText}>Nguy cơ báo</Text>
              <Text style={styles.alertTime}>30 phút trước</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  content: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    elevation: 3,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  alertDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  alertTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  alertText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  alertTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  alertDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  actions: {
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  secondaryActionButton: {
    backgroundColor: '#FFB100',
  },
  tertiaryActionButton: {
    backgroundColor: '#E94B3C',
  },
  actionText: {
    color: 'white',
    fontSize: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E94B3C',
    marginTop: 10,
  },
  errorSubtext: {
    color: '#666',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  noErrorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noErrorText: {
    marginTop: 10,
    color: '#4CAF50',
    fontSize: 16,
  },
  alertStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});