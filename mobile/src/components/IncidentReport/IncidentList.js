import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../utils/theme';

export function IncidentList({ incidents, onSelectIncident }) {
  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Báo cáo thất thường</Text>
      </View>

      <ScrollView style={styles.list}>
        {incidents.map((incident) => (
          <TouchableOpacity
            key={incident.id}
            style={styles.incidentItem}
            onPress={() => onSelectIncident(incident)}
          >
            <View style={styles.incidentHeader}>
              <Text style={styles.flightNumber}>{incident.flightNumber}</Text>
              <Text style={styles.timestamp}>{formatDateTime(incident.timestamp)}</Text>
            </View>
            <View style={[styles.statusBadge, 
              { backgroundColor: incident.status === 'Đang xử lý' ? '#FFA500' : '#4CAF50' }
            ]}>
              <Text style={styles.statusText}>{incident.status}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRightWidth: 1,
    borderRightColor: theme.colors.background,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    padding: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: theme.colors.white,
    marginLeft: 8,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  incidentItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background,
  },
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  flightNumber: {
    fontWeight: 'bold',
  },
  timestamp: {
    color: theme.colors.gray,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
  },
});