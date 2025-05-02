import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { IncidentList } from '../components/IncidentReport/IncidentList';
import { IncidentForm } from '../components/IncidentReport/IncidentForm';
import Header from './Header';
import { fetchIncidents, deleteIncident } from '../services/api';

// Mock data khi không thể kết nối API
const mockIncidents = [
  {
    id: '1',
    flightNumber: 'VN123',
    timestamp: new Date().toISOString(),
    title: 'Thời tiết xấu',
    status: 'Đang xử lý',
    severity: 'high',
    description: 'Gió mạnh và mưa lớn khiến máy bay rung lắc mạnh',
    assignee: 'Nguyễn Văn A',
  },
  {
    id: '2',
    flightNumber: 'VN456',
    timestamp: new Date().toISOString(),
    title: 'Sự cố kỹ thuật',
    status: 'Đã xử lý',
    severity: 'medium',
    description: 'Cảnh báo hệ thống nhiên liệu bất thường',
    assignee: 'Trần Văn B',
  },
];

export default function IncidentReportScreen() {
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Tải dữ liệu từ API hoặc fallback về mock data
  const loadIncidents = async () => {
    try {
      setLoading(true);
      const response = await fetchIncidents();
      if (response && response.data) {
        // Chuyển đổi _id từ MongoDB thành id để tương thích với UI hiện tại
        const formattedIncidents = response.data.map(item => ({
          ...item,
          id: item._id || item.id
        }));
        setIncidents(formattedIncidents);
        
        // Đã kết nối lại được, tắt offline mode
        if (isOfflineMode) {
          setIsOfflineMode(false);
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách báo cáo:', error);
      
      // Nếu lỗi kết nối, sử dụng mock data
      if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
        console.log('Fallback to mock data due to connection error');
        setIncidents(mockIncidents);
        setIsOfflineMode(true);
        
        // Thông báo người dùng một cách không gây phiền nhiễu
        Alert.alert(
          'Chế độ ngoại tuyến',
          'Không thể kết nối đến máy chủ. Ứng dụng đang chạy ở chế độ ngoại tuyến với dữ liệu mẫu.',
          [{ text: 'OK', onPress: () => console.log('OK Pressed') }]
        );
      } else {
        Alert.alert('Lỗi', 'Không thể tải danh sách báo cáo. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Gọi API khi component được tải
  useEffect(() => {
    loadIncidents();
  }, []);

  // Xử lý submit form
  const handleSubmit = (formData) => {
    if (isOfflineMode) {
      // Xử lý trong offline mode
      if (selectedIncident) {
        // Update existing incident locally
        setIncidents(incidents.map(inc => 
          inc.id === selectedIncident.id ? { ...formData, id: inc.id } : inc
        ));
        Alert.alert('Thông báo', 'Đã cập nhật báo cáo ở chế độ ngoại tuyến. Dữ liệu sẽ không được lưu trên máy chủ.');
      } else {
        // Add new incident locally
        setIncidents([...incidents, { ...formData, id: Date.now().toString() }]);
        Alert.alert('Thông báo', 'Đã thêm báo cáo mới ở chế độ ngoại tuyến. Dữ liệu sẽ không được lưu trên máy chủ.');
      }
      setShowForm(false);
    } else {
      // Xử lý trong online mode - API calls được xử lý bên trong IncidentForm
      loadIncidents();
      setShowForm(false);
    }
  };

  // Xử lý xóa báo cáo
  const handleDeleteIncident = async (id) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn xóa báo cáo này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            if (isOfflineMode) {
              // Xóa locally trong offline mode
              setIncidents(incidents.filter(inc => inc.id !== id));
              Alert.alert('Thông báo', 'Đã xóa báo cáo ở chế độ ngoại tuyến.');
            } else {
              try {
                await deleteIncident(id);
                Alert.alert('Thành công', 'Đã xóa báo cáo');
                loadIncidents();
              } catch (error) {
                console.error('Lỗi khi xóa báo cáo:', error);
                Alert.alert('Lỗi', 'Không thể xóa báo cáo. Vui lòng thử lại sau.');
              }
            }
          }
        }
      ]
    );
  };

  // Xử lý chọn báo cáo để chỉnh sửa
  const handleSelectIncident = (incident) => {
    setSelectedIncident(incident);
    setShowForm(true);
  };

  // Xử lý tạo báo cáo mới
  const handleNewIncident = () => {
    setSelectedIncident(null);
    setShowForm(true);
  };

  // Xử lý refresh khi kéo xuống
  const handleRefresh = () => {
    setRefreshing(true);
    loadIncidents();
  };

  return (
    <View style={styles.container1}>
      
      {isOfflineMode && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>Đang chạy ở chế độ ngoại tuyến</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setRefreshing(true);
              loadIncidents();
            }}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.container}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={handleNewIncident}
            >
              <Text style={styles.addButtonText}>Báo cáo mới</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.contentContainer}>
            {!showForm ? (
              <IncidentList
                incidents={incidents}
                onSelectIncident={handleSelectIncident}
                onDeleteIncident={handleDeleteIncident}
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            ) : (
              <View style={styles.formContainer}>
                <View style={styles.formHeader}>
                  <Text style={styles.formTitle}>
                    {selectedIncident ? 'Chỉnh sửa báo cáo' : 'Báo cáo mới'}
                  </Text>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setShowForm(false)}
                  >
                    <Text style={styles.closeButtonText}>Đóng</Text>
                  </TouchableOpacity>
                </View>
                <IncidentForm
                  incident={selectedIncident}
                  onSubmit={handleSubmit}
                  isOfflineMode={isOfflineMode}
                />
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container1: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  container: {
    flexGrow: 1,
    padding: 10,
    backgroundColor: '#f4f4f4',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  buttonContainer: {
    marginBottom: 15,
    alignItems: 'center',
  },
  contentContainer: {
    flexDirection: 'column',
    gap: 20,
  },
  formContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 2,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  closeButtonText: {
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  offlineBanner: {
    backgroundColor: '#FFCC00',
    paddingVertical: 8,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offlineText: {
    color: '#333',
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#333',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
  }
});