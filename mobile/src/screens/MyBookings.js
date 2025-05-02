import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  TouchableOpacity 
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import Header from './Header';
import { LoginService } from '../services/LoginService'; // Import LoginService

const MyBookings = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState(null); // State để lưu email người đăng nhập

  // Lấy email từ LoginService khi component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = await LoginService.getCurrentUser();
        if (currentUser && currentUser.email) {
          setUserEmail(currentUser.email);
          fetchBookings(currentUser.email); // Gọi fetchBookings với email người dùng
        } else {
          Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
          navigation.navigate('Login');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Lỗi', 'Không thể lấy thông tin người dùng.');
        setIsLoading(false);
      }
    };

    const fetchBookings = async (email) => {
      try {
        const response = await fetch(`http://192.168.2.11:5000/FlightBooking/user/${email}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setBookings(data);
        } else {
          const errorData = await response.json();
          console.log('Lỗi từ server:', errorData);
          Alert.alert('Lỗi', errorData.message || 'Không thể tải danh sách vé.');
        }
      } catch (error) {
        console.error('Lỗi kết nối:', error);
        Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigation]); // Xóa route.params?.email khỏi dependency

  // Add a formatCurrency function
  const formatCurrency = (amount) => {
    if (!amount) return '0 VNĐ';
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

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

  // Hiển thị từng vé
  const renderBookingItem = (booking) => {
    const departureTime = booking.Time_depart 
      ? formatUTCDateTime(booking.Time_depart) 
      : 'N/A';
    const arrivalTime = booking.Time_landing 
      ? formatUTCDateTime(booking.Time_landing) 
      : 'N/A';

    return (
      <View key={booking._id} style={styles.bookingCard}>
        <Text style={styles.sectionTitle}>Chuyến bay: {booking.Number_Flight}</Text>

        <View style={styles.inputContainer}>
          <MaterialIcons name="airplanemode-active" size={24} color="#4A90E2" />
          <Text style={styles.inputText}>Loại máy bay: {booking.Plane || 'Boeing 737'}</Text>
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="flight-takeoff" size={24} color="#4A90E2" />
          <Text style={styles.inputText}>Khởi hành: {booking.From || 'N/A'}</Text>
        </View>

        {booking.Transit && (
          <View style={styles.inputContainer}>
            <MaterialIcons name="transfer-within-a-station" size={24} color="#4A90E2" />
            <Text style={styles.inputText}>Transit: {booking.Transit}</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <MaterialIcons name="flight-land" size={24} color="#4A90E2" />
          <Text style={styles.inputText}>Đến: {booking.To || 'N/A'}</Text>
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="schedule" size={24} color="#4A90E2" />
          <Text style={styles.inputText}>Khởi hành: {departureTime}</Text>
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="access-time" size={24} color="#4A90E2" />
          <Text style={styles.inputText}>Dự kiến hạ cánh: {arrivalTime}</Text>
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="meeting-room" size={24} color="#4A90E2" />
          <Text style={styles.inputText}>Cổng: {booking.Gate_depart || 'N/A'}</Text>
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="info" size={24} color="#4A90E2" />
          <Text style={styles.inputText}>Trạng thái: {booking.Status || 'Đúng giờ'}</Text>
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="person" size={24} color="#4A90E2" />
          <Text style={styles.inputText}>Phi công: {booking.Pilot_email || 'N/A'}</Text>
        </View>

        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>Giá vé:</Text>
          {booking.Initial_price && booking.Initial_price !== booking.Current_price ? (
            <>
              <Text style={styles.originalPrice}>{formatCurrency(booking.Initial_price)}</Text>
              <Text style={styles.currentPrice}>{formatCurrency(booking.Current_price)}</Text>
            </>
          ) : (
            <Text style={styles.currentPrice}>{formatCurrency(booking.Current_price || 1000000)}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.transportModes}>
          <TouchableOpacity style={[styles.modeButton, styles.activeModeButton]}>
            <FontAwesome5 name="plane" size={24} color="white" />
            <Text style={[styles.modeButtonText, styles.activeModeButtonText]}>Lịch sử vé</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>Đang tải danh sách vé...</Text>
          </View>
        ) : bookings.length > 0 ? (
          bookings.map((booking) => renderBookingItem(booking))
        ) : (
          <Text style={styles.noBookingsText}>Bạn chưa có vé nào được đặt.</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 16,
  },
  transportModes: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  modeButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  activeModeButton: {
    backgroundColor: '#4A90E2',
  },
  modeButtonText: {
    marginTop: 5,
    fontSize: 14,
    color: '#555',
  },
  activeModeButtonText: {
    color: 'white',
  },
  bookingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  inputText: {
    marginLeft: 10,
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  noBookingsText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginTop: 20,
  },
  priceSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eaeaea',
    paddingTop: 16,
  },
  priceLabel: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#666',
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E53935',
  },
});

export default MyBookings;