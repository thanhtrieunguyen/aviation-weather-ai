import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Header = () => {
  return (
   <View style={styles.header}>
           <View style={styles.titleContainer}>
             <MaterialCommunityIcons name="airplane" size={24} color="white" />
             <Text style={styles.title}>Airport Management</Text>
           </View>
           <Text style={styles.subtitle}>Dashboard Airport</Text>
         </View>
  );
};

const styles = StyleSheet.create({
    header: {
        backgroundColor: '#4A90E2',
        padding: 20,
        paddingTop: 60,
      },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10, // Khoảng cách giữa biểu tượng và tiêu đề
  },
  title: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    marginTop: 5,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

});


export default Header;
