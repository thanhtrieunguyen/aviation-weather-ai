import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity,
  StyleSheet,
  TextInput 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../utils/theme';

export function AirportSelector({ visible, airports, onSelect, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter airports based on search query
  const filteredAirports = airports.filter(airport => {
    const query = searchQuery.toLowerCase();
    return airport.name.toLowerCase().includes(query) || 
           airport.iata.toLowerCase().includes(query) ||
           (airport.city && airport.city.toLowerCase().includes(query));
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn Sân Bay</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          {/* Search input */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={theme.colors.gray} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm sân bay..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={theme.colors.gray}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={theme.colors.gray} />
              </TouchableOpacity>
            )}
          </View>
          
          <FlatList 
            data={filteredAirports}
            keyExtractor={(item) => item.iata}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.airportItem}
                onPress={() => {
                  onSelect(item.iata);
                  onClose();
                }}
              >
                <Ionicons name="airplane-outline" size={20} color={theme.colors.primary} />
                <View style={styles.airportInfo}>
                  <Text style={styles.airportName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.airportDetails}>
                    <Text style={styles.airportCode}>{item.iata}</Text>
                    {item.city && (
                      <Text style={styles.cityText}>• {item.city}</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={true}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: theme.colors.text,
  },
  airportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background,
  },
  airportInfo: {
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  airportName: {
    fontSize: 15,
    color: theme.colors.text,
  },
  airportDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  airportCode: {
    fontSize: 13,
    color: theme.colors.gray,
    fontWeight: 'bold',
  },
  cityText: {
    fontSize: 13,
    color: theme.colors.gray,
    marginLeft: 5,
  },
});
