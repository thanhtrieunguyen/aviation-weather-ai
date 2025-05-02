import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Button, Platform 
} from 'react-native';
import axios from 'axios';
import Header from './Header';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

const ChangeFlight = () => {
  const [flights, setFlights] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [editedFlights, setEditedFlights] = useState(new Set());
  const [formData, setFormData] = useState({
    Number_Flight: '',
    From: '',
    To: '',
    Time_depart: new Date(),
    Status: ''
  });
  
  // Predefined status options
  const statusOptions = [
    'Đúng giờ',
    'Bị trễ',
    'Đã cất cánh',
    'Đã hạ cánh',
    'Đã hủy',
    'Chuyển hướng'
  ];

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('date'); 
  
  useEffect(() => {
    fetchFlights();
    loadEditedFlights();
  }, []);
  
  useEffect(() => {
    if (editedFlights.size > 0) {
      saveEditedFlights();
    }
  }, [editedFlights]);
  
  const fetchFlights = async () => {
    try {
      const response = await axios.get('http://192.168.2.11:5000/flights');
      setFlights(response.data);
    } catch (error) {
      console.error('Lỗi khi tải chuyến bay:', error);
    }
  };
  
  const loadEditedFlights = async () => {
    try {
      const storedData = await AsyncStorage.getItem('editedFlights');
      if (storedData) {
        const editedFlightsData = JSON.parse(storedData);
        
        // Lọc chỉ những chuyến bay có thời gian chỉnh sửa chưa hết hạn (3 giờ)
        const currentTime = new Date().getTime();
        const validEditedFlights = Object.entries(editedFlightsData)
          .filter(([_, timestamp]) => {
            return currentTime - timestamp < 10800000; 
          })
          .map(([id, _]) => id);
        setEditedFlights(new Set(validEditedFlights));
        if (validEditedFlights.length < Object.keys(editedFlightsData).length) {
          const updatedEditedFlights = {};
          validEditedFlights.forEach(id => {
            updatedEditedFlights[id] = editedFlightsData[id];
          });
          await AsyncStorage.setItem('editedFlights', JSON.stringify(updatedEditedFlights));
        }
      }
    } catch (error) {
      console.error('Lỗi khi đọc dữ liệu từ AsyncStorage:', error);
    }
  };
  
  const saveEditedFlights = async () => {
    try {
      const currentTime = new Date().getTime();
      const editedFlightsObj = {};
      Array.from(editedFlights).forEach(id => {
        editedFlightsObj[id] = currentTime;
      });
      
      await AsyncStorage.setItem('editedFlights', JSON.stringify(editedFlightsObj));
    } catch (error) {
      console.error('Lỗi khi lưu vào AsyncStorage:', error);
    }
  };
  
  const handleFlightPress = (flight) => {
    setSelectedFlight(flight);
    setFormData({
      Number_Flight: flight.Number_Flight,
      From: flight.From,
      To: flight.To,
      Time_depart: new Date(flight.Time_depart),
      Status: flight.Status
    });
    setModalVisible(true);
  };
  
  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const showDateTimePicker = (mode) => {
    setDatePickerMode(mode);
    setShowDatePicker(true);
  };
  
  const formatDateTime = (date) => {
    if (!date) return '';
    
    // Use UTC methods to avoid timezone conversion
    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = date.getUTCFullYear();
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };
  
  const handleDateTimeChange = (event, selectedDate) => {
    const currentDate = selectedDate || formData.Time_depart;
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      setFormData(prev => ({ ...prev, Time_depart: currentDate }));
      if (Platform.OS === 'android' && datePickerMode === 'date') {
        setTimeout(() => {
          showDateTimePicker('time');
        }, 500);
      }
    }
  };
  
  const handleSaveChanges = async () => {
    if (!selectedFlight) return;
  
    try {
      const dataToSend = {
        ...formData,
        Time_depart: formData.Time_depart.toISOString()
      };

      const response = await axios.put(`http://192.168.2.11:5000/flights/${selectedFlight._id}`, 
        dataToSend
      );
      setFlights(flights.map(f => 
        f._id === selectedFlight._id ? response.data : f
      ));
      setModalVisible(false);
      const newEditedFlights = new Set(editedFlights);
      newEditedFlights.add(selectedFlight._id);
      setEditedFlights(newEditedFlights);
      scheduleEditStatusRemoval(selectedFlight._id);
      
      Alert.alert("Thành công", "Chuyến bay đã được cập nhật!");
    } catch (error) {
      console.error('Lỗi khi cập nhật chuyến bay:', error);
      Alert.alert("Lỗi", "Không thể cập nhật chuyến bay. Vui lòng thử lại sau.");
    }
  };
  
  const scheduleEditStatusRemoval = async (flightId) => {
    try {
      const storedData = await AsyncStorage.getItem('editedFlights');
      let editedFlightsData = storedData ? JSON.parse(storedData) : {};
      const currentTime = new Date().getTime();
      editedFlightsData[flightId] = currentTime;
      await AsyncStorage.setItem('editedFlights', JSON.stringify(editedFlightsData));
      setTimeout(async () => {
        setEditedFlights(prev => {
          const newSet = new Set(prev);
          newSet.delete(flightId);
          return newSet;
        });
        try {
          const latestData = await AsyncStorage.getItem('editedFlights');
          if (latestData) {
            const latestEditedFlights = JSON.parse(latestData);
            delete latestEditedFlights[flightId];
            await AsyncStorage.setItem('editedFlights', JSON.stringify(latestEditedFlights));
          }
        } catch (error) {
          console.error('Lỗi khi xóa trạng thái chỉnh sửa:', error);
        }
      }, 10800000); // 3h
    } catch (error) {
      console.error('Lỗi khi lên lịch xóa trạng thái:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thay đổi lịch bay</Text>
      <ScrollView>
        {flights.map(flight => (
          <TouchableOpacity 
            key={flight._id} 
            style={[
              styles.flightCard, 
              editedFlights.has(flight._id) && styles.editedFlightCard
            ]} 
            onPress={() => handleFlightPress(flight)}
          >
            <Text style={styles.flightCode}>Mã chuyến: {flight.Number_Flight}</Text>
            <Text style={styles.flightRoute}>{flight.From} → {flight.To}</Text>
            <Text style={styles.flightTime}>Khởi hành: {new Date(flight.Time_depart).toLocaleString()}</Text>
            <Text style={styles.flightStatus}>Trạng thái: {flight.Status}</Text>
            {editedFlights.has(flight._id) && (
              <Text style={styles.editedTag}>Đã chỉnh sửa</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Modal chỉnh sửa chuyến bay */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chỉnh sửa chuyến bay</Text>
            <Text>Mã chuyến bay:</Text>
            <TextInput 
              style={styles.input} 
              value={formData.Number_Flight} 
              onChangeText={(val) => handleInputChange('Number_Flight', val)} 
            />
            <Text>Điểm đi:</Text>
            <TextInput 
              style={styles.input} 
              value={formData.From} 
              onChangeText={(val) => handleInputChange('From', val)} 
            />
            <Text>Điểm đến:</Text>
            <TextInput 
              style={styles.input} 
              value={formData.To} 
              onChangeText={(val) => handleInputChange('To', val)} 
            />
            <Text>Thời gian khởi hành:</Text>
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity 
                style={styles.dateTimeButton} 
                onPress={() => showDateTimePicker('date')}
              >
                <Text style={styles.dateTimeButtonText}>Chọn ngày</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.dateTimeButton} 
                onPress={() => showDateTimePicker('time')}
              >
                <Text style={styles.dateTimeButtonText}>Chọn giờ</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.dateTimeDisplay}>
              {formatDateTime(formData.Time_depart)}
            </Text>
            
            <Text style={styles.sectionTitle}>Trạng thái:</Text>
            <View style={styles.radioContainer}>
              {statusOptions.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={styles.radioOption}
                  onPress={() => handleInputChange('Status', status)}
                >
                  <View style={styles.radioButtonOuter}>
                    {formData.Status === status && <View style={styles.radioButtonInner} />}
                  </View>
                  <Text style={styles.radioLabel}>{status}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.buttonContainer}>
              <Button title="Hủy" onPress={() => setModalVisible(false)} />
              <Button title="Lưu thay đổi" onPress={handleSaveChanges} />
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={formData.Time_depart}
                mode={datePickerMode}
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateTimeChange}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  title: { fontSize: 20, fontWeight: 'bold', marginVertical: 10, paddingHorizontal: 15 },
  flightCard: { backgroundColor: 'white', padding: 15, margin: 10, borderRadius: 10, elevation: 2 },
  flightCode: { fontSize: 16, fontWeight: 'bold' },
  flightRoute: { fontSize: 14, color: '#555', marginTop: 5 },
  flightTime: { fontSize: 14, fontWeight: 'bold', color: '#4A90E2', marginTop: 5 },
  flightStatus: { fontSize: 14, fontWeight: 'bold', color: '#E74C3C', marginTop: 5 },
  editedTag: { fontSize: 12, color: '#F39C12', fontWeight: 'bold', marginTop: 5 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '80%', backgroundColor: 'white', padding: 20, borderRadius: 10, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 },
  dateTimeContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 10 
  },
  dateTimeButton: { 
    backgroundColor: '#4A90E2', 
    padding: 10, 
    borderRadius: 5, 
    width: '48%', 
    alignItems: 'center' 
  },
  dateTimeButtonText: { 
    color: 'white', 
    fontWeight: 'bold' 
  },
  dateTimeDisplay: { 
    borderWidth: 1, 
    borderColor: '#ccc', 
    padding: 10, 
    marginBottom: 15, 
    borderRadius: 5, 
    backgroundColor: '#f8f8f8',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500'
  },
  radioContainer: {
    marginBottom: 15
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioButtonOuter: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  radioButtonInner: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: '#4A90E2',
  },
  radioLabel: {
    fontSize: 16,
  },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  editedFlightCard: { backgroundColor: '#FFFACD' }, 
});

export default ChangeFlight;