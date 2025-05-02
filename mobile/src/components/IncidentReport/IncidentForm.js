import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Input } from '../Input/Input';
import { Button } from '../Button/Button';
import { theme } from '../../utils/theme';
import { createIncident, updateIncident } from '../../services/api';

const severityLevels = ['low', 'medium', 'high', 'critical'];
const statusOptions = ['Đang xử lý', 'Đã xử lý', 'Đã đóng', 'Cần theo dõi'];

export function IncidentForm({ incident, onSubmit, navigation, isOfflineMode = false }) {
  const [formData, setFormData] = useState(incident || {
    flightNumber: '',
    timestamp: new Date().toISOString(),
    title: '',
    description: '',
    severity: 'medium',
    status: 'Đang xử lý',
    assignee: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const timer = setInterval(() => {
      setFormData(prev => ({
        ...prev,
        timestamp: new Date().toISOString()
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const validateForm = () => {
    let isValid = true;
    let newErrors = {};

    if (!formData.flightNumber.trim()) {
      newErrors.flightNumber = 'Mã chuyến bay là bắt buộc';
      isValid = false;
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Tiêu đề là bắt buộc';
      isValid = false;
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Mô tả chi tiết là bắt buộc';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (isOfflineMode) {
      onSubmit(formData);
      return;
    }

    setLoading(true);
    try {
      let response;
      const incidentId = incident?._id || incident?.id;

      if (incidentId) {
        response = await updateIncident(incidentId, formData);
        Alert.alert('Thành công', 'Đã cập nhật báo cáo');
      } else {
        response = await createIncident(formData);
        Alert.alert('Thành công', 'Đã tạo báo cáo mới');
      }

      if (onSubmit) {
        onSubmit(response?.data || formData);
      }

      if (navigation) {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Lỗi khi gửi báo cáo:', error);
      Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {isOfflineMode && (
        <View style={styles.offlineWarning}>
          <Text style={styles.offlineWarningText}>
            Bạn đang ở chế độ ngoại tuyến. Thay đổi sẽ không được lưu vào cơ sở dữ liệu.
          </Text>
        </View>
      )}

      <Input
        label="Mã chuyến bay"
        value={formData.flightNumber}
        onChangeText={(text) => setFormData({...formData, flightNumber: text})}
        placeholder="Nhập mã chuyến bay"
        error={errors.flightNumber}
      />

      <Input
        label="Thời gian"
        value={new Date(formData.timestamp).toLocaleString('vi-VN')}
        editable={false}
        placeholder="Thời gian tự động"
      />

      <Input
        label="Tiêu đề"
        value={formData.title}
        onChangeText={(text) => setFormData({...formData, title: text})}
        placeholder="Nhập tiêu đề báo cáo"
        error={errors.title}
      />

      <Input
        label="Mô tả chi tiết"
        value={formData.description}
        onChangeText={(text) => setFormData({...formData, description: text})}
        placeholder="Mô tả chi tiết vấn đề"
        multiline
        numberOfLines={4}
        error={errors.description}
      />

      {/* Mức độ nghiêm trọng */}
      <Text style={styles.label}>Mức độ nghiêm trọng</Text>
      <View style={styles.radioGroup}>
        {severityLevels.map((level) => (
          <TouchableOpacity 
            key={level} 
            style={[styles.radioButton, formData.severity === level && styles.radioButtonSelected]}
            onPress={() => setFormData({ ...formData, severity: level })}
          >
            <Text style={[styles.radioText, formData.severity === level && styles.radioTextSelected]}>
              {level}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Input
        label="Người phụ trách"
        value={formData.assignee}
        onChangeText={(text) => setFormData({...formData, assignee: text})}
        placeholder="Nhập tên người phụ trách"
      />

      {/* Trạng thái */}
      <Text style={styles.label}>Trạng thái</Text>
      <View style={styles.radioGroup}>
        {statusOptions.map((status) => (
          <TouchableOpacity 
            key={status} 
            style={[styles.radioButton, formData.status === status && styles.radioButtonSelected]}
            onPress={() => setFormData({ ...formData, status })}
          >
            <Text style={[styles.radioText, formData.status === status && styles.radioTextSelected]}>
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Button 
        onPress={handleSubmit}
        style={styles.submitButton}
        loading={loading && !isOfflineMode}
        disabled={loading && !isOfflineMode}
      >
        {incident ? 'Cập nhật' : 'Gửi báo cáo'}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.white, padding: 20 },
  label: { fontSize: 14, fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
  radioGroup: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
  radioButton: { 
    backgroundColor: '#E0E0E0', 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: 20, 
    marginRight: 10, 
    marginBottom: 10 
  },
  radioButtonSelected: { backgroundColor: theme.colors.primary },
  radioText: { fontSize: 14, color: '#333' },
  radioTextSelected: { color: '#fff', fontWeight: 'bold' },
  submitButton: { marginTop: 20, marginBottom: 40, width: '100%' },
  offlineWarning: { backgroundColor: '#FFECB3', padding: 10, borderRadius: 6, marginBottom: 15 },
  offlineWarningText: { color: '#5D4037', fontSize: 14 }
});
