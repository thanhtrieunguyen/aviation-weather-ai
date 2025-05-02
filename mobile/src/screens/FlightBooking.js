import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import Header from './Header';
import { LoginService } from '../services/LoginService'; // Import LoginService

const FlightBooking = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { flight, users, Pilot_email } = route.params || {}; // Loại bỏ User_email khỏi route.params
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState(null); // State để lưu email người đăng nhập

  // Lấy email người dùng từ LoginService khi component mount
  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const currentUser = await LoginService.getCurrentUser();
        if (currentUser && currentUser.email) {
          setUserEmail(currentUser.email);
        } else {
          Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
          navigation.navigate('Login'); // Điều hướng về login nếu không có user
        }
      } catch (error) {
        console.error('Error fetching user email:', error);
        Alert.alert('Lỗi', 'Không thể lấy thông tin người dùng.');
      }
    };
    fetchUserEmail();
  }, [navigation]);

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

  // Xử lý dữ liệu chuyến bay với giá trị mặc định
  const departureCity = flight?.From || 'N/A';
  const transit = flight?.Transit || '';
  const arrivalCity = flight?.To || 'N/A';
  const departureTime = flight?.Time_depart
    ? formatUTCDateTime(flight.Time_depart)
    : 'N/A';
  const arrivalTime = flight?.Time_landing
    ? formatUTCDateTime(flight.Time_landing)
    : 'N/A';
  const gate = flight?.Gate_depart || 'N/A';
  const flightNumber = flight?.Number_Flight || 'N/A';
  const plane = flight?.Plane || 'Boeing 737';
  const status = flight?.Status || 'Đúng giờ';

  // Lấy email phi công từ route.params
  const pilotEmail = flight?.Pilot_email || Pilot_email || 'N/A';

  // Xử lý đặt vé
  const handleBooking = async () => {
    if (!flight || !userEmail || pilotEmail === 'N/A') {
      Alert.alert('Lỗi', 'Thiếu thông tin cần thiết để đặt vé.');
      return;
    }

    setIsLoading(true);

    const initialPrice = flight?.Initial_price ? Number(flight.Initial_price) : 1000000;
    const currentPrice = flight?.Current_price ? Number(flight.Current_price) : initialPrice;

    // Log để kiểm tra giá trị giá
    console.log('Giá vé:', { initialPrice, currentPrice });

    const bookingData = {
      Number_Flight: flightNumber !== 'N/A' ? flightNumber : `FL${Date.now()}`,
      Plane: plane,
      From: departureCity,
      Transit: transit,
      To: arrivalCity,
      Time_depart: flight.Time_depart || new Date(),
      Time_landing: flight.Time_landing || new Date(),
      Gate_depart: gate,
      Pilot_email: pilotEmail,
      User_email: userEmail, // Sử dụng email người đăng nhập
      Status: status,
      Current_price: flight?.Current_price || currentPrice,
      Initial_price: flight?.Initial_price,
    };

    try {

      const response = await fetch('http://192.168.2.11:5000/FlightBooking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      setIsLoading(false);

      if (response.ok) {
        const result = await response.json();
        Alert.alert(
          'Thành công',
          'Bạn đã đặt vé thành công!',
          [
            {
              text: 'Xem vé của tôi',
              onPress: () => navigation.navigate('MyBookings', { users: { User_email: userEmail } }),
            },
            { text: 'OK', style: 'default' },
          ]
        );
      } else {
        const errorData = await response.json();
        console.log('Lỗi từ server:', errorData);
        Alert.alert('Lỗi', errorData.message || 'Đặt vé không thành công, vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Lỗi kết nối:', error);
      Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet.');
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.transportModes}>
          <TouchableOpacity style={[styles.modeButton, styles.activeModeButton]}>
            <FontAwesome5 name="plane" size={24} color="white" />
            <Text style={[styles.modeButtonText, styles.activeModeButtonText]}>Máy bay</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.flightInfoCard}>
          <Text style={styles.sectionTitle}>Thông tin chuyến bay</Text>

          <View style={styles.inputContainer}>
            <MaterialIcons name="confirmation-number" size={24} color="#4A90E2" />
            <Text style={styles.inputText}>Số hiệu: {flightNumber}</Text>
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="airplanemode-active" size={24} color="#4A90E2" />
            <Text style={styles.inputText}>Loại máy bay: {plane}</Text>
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="flight-takeoff" size={24} color="#4A90E2" />
            <Text style={styles.inputText}>Khởi hành: {departureCity}</Text>
          </View>

          {transit && (
            <View style={styles.inputContainer}>
              <MaterialIcons name="transfer-within-a-station" size={24} color="#4A90E2" />
              <Text style={styles.inputText}>Transit: {transit}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <MaterialIcons name="flight-land" size={24} color="#4A90E2" />
            <Text style={styles.inputText}>Đến: {arrivalCity}</Text>
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
            <Text style={styles.inputText}>Cổng: {gate}</Text>
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="info" size={24} color="#4A90E2" />
            <Text style={styles.inputText}>Trạng thái: {status}</Text>
          </View>

          <View style={styles.priceRow}>
            <MaterialIcons name="attach-money" size={24} color="#4A90E2" />
            <View style={styles.priceInfo}>
              {flight?.Initial_price !== flight?.Current_price ? (
                <>
                  <Text style={styles.originalPrice}>
                    Giá gốc: {formatCurrency(flight?.Initial_price)}
                  </Text>
                  <Text style={styles.currentPrice}>
                    Giá hiện tại: {formatCurrency(flight?.Current_price)}
                  </Text>
                  <Text style={styles.discountInfo}>
                    (Tiết kiệm {formatCurrency(flight?.Initial_price - flight?.Current_price)})
                  </Text>
                </>
              ) : (
                <Text style={styles.currentPrice}>
                  Giá vé: {formatCurrency(flight?.Current_price)}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.flightInfoCard}>
          <Text style={styles.sectionTitle}>Thông tin đặt vé</Text>

          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={24} color="#4A90E2" />
            <Text style={styles.inputText}>Email người đặt: {userEmail || 'Đang tải...'}</Text>
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="person" size={24} color="#4A90E2" />
            <Text style={styles.inputText}>Email phi công: {pilotEmail}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.bookButton}
          onPress={handleBooking}
          disabled={isLoading || !userEmail} // Vô hiệu hóa nếu chưa có email
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <MaterialIcons name="airplane-ticket" size={24} color="white" />
              <Text style={styles.bookButtonText}>Đặt vé ngay</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const formatCurrency = (amount) => {
  if (!amount) return '0 VNĐ';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
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
  flightInfoCard: {
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
  bookButton: {
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    marginVertical: 20,
    elevation: 3,
  },
  bookButtonText: {
    color: 'white',
    marginLeft: 10,
    fontWeight: 'bold',
    fontSize: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eaeaea',
  },
  priceInfo: {
    marginLeft: 10,
    flex: 1,
  },
  originalPrice: {
    fontSize: 14,
    color: '#666',
    textDecorationLine: 'line-through',
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E53935',
    marginVertical: 4,
  },
  discountInfo: {
    fontSize: 14,
    color: '#4CAF50',
  },
});

export default FlightBooking;