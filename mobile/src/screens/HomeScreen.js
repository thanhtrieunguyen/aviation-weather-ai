import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../components/Button/Button';
import { theme } from '../utils/theme';

export default function HomeScreen({ navigation }) {
  return (
    <LinearGradient colors={theme.gradients.primary} style={styles.container}>
      <View style={styles.content}>
        <Image 
          source={require('../../assets/favicon.png')} 
          style={styles.image}
        />
        <Text style={styles.title}>Airport Management</Text>

        <Button 
          onPress={() => navigation.navigate('Login', { loginType: 'customer' })}
          variant="secondary"
          style={styles.button}
        >
          Customer Access
        </Button>
        
        <Button 
          onPress={() => navigation.navigate('Login', { loginType: 'pilot' })}
          variant="secondary"
          style={styles.button}
        >
          Pilot Login
        </Button>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: 20,
    textAlign: 'center',
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  button: {
    marginVertical: 10,
  },
});