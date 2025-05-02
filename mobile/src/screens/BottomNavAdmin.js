import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const BottomNavAdmin = () => {
  const navigation = useNavigation();

  const handleNavigation = (route) => {
    navigation.navigate(route); // Điều hướng đến màn hình tương ứng
  };

  const handleLogout = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }], // Đăng xuất và quay về màn hình Home
    });
  };

  return (
    <View style={styles.bottomNav}>
      {/* Trang chủ */}
      <TouchableOpacity
        style={styles.bottomNavItem}
        onPress={() => handleNavigation('PilotDashboardAdmin')}
      >
        <Ionicons name="planet-outline" size={24} color="#4A90E2" />
        <Text style={styles.bottomNavText}>Trang chủ</Text>
      </TouchableOpacity>

      {/* Thời tiết */}
      <TouchableOpacity
        style={styles.bottomNavItem}
        onPress={() => handleNavigation('WeatherDetails')}
      >
        <Ionicons name="cloud-outline" size={24} color="#4A90E2" />
        <Text style={styles.bottomNavText}>Thời tiết</Text>
      </TouchableOpacity>

      {/* Cảnh báo */}
      <TouchableOpacity
        style={styles.bottomNavItem}
        onPress={() => handleNavigation('AlertRouteDetails')}
      >
        <Ionicons name="warning-outline" size={24} color="#4A90E2" />
        <Text style={styles.bottomNavText}>Cảnh báo</Text>
      </TouchableOpacity>

      {/* Chuyến bay */}
      <TouchableOpacity
        style={styles.bottomNavItem}
        onPress={() => handleNavigation('FlightRouteAdmin')}
      >
        <MaterialCommunityIcons name="airplane" size={24} color="#4A90E2" />
        <Text style={styles.bottomNavText}>Chuyến bay</Text>
      </TouchableOpacity>

      {/* Đăng xuất */}
      <TouchableOpacity
        style={styles.bottomNavItem}
        onPress={handleLogout}
      >
        <MaterialCommunityIcons name="logout" size={24} color="#4A90E2" />
        <Text style={styles.bottomNavText}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    paddingVertical: 10, // Giảm padding để thanh điều hướng mỏng hơn
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    elevation: 5, // Hiệu ứng bóng cho Android
    shadowColor: '#000', // Hiệu ứng bóng cho iOS
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  bottomNavItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5, // Thêm padding để vùng nhấn lớn hơn
  },
  bottomNavText: {
    fontSize: 12,
    marginTop: 4,
    color: '#4A90E2',
    fontWeight: '500', // Chữ đậm nhẹ để trông chuyên nghiệp hơn
  },
});

export default BottomNavAdmin;