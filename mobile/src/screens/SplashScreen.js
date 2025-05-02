import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('CustomerDashboard');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={theme.gradients.primary}
      style={styles.container}
    >
      <View style={styles.content}>
        <Image 
          source={require('../../assets/airplane.png')}
          style={styles.image}
          resizeMode="contain"
        />
        <Text style={styles.title}>Airport{'\n'}Management</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});