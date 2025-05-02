import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '../../utils/theme';

export function Button({ onPress, children, variant = 'primary', style }) {
  const buttonStyle = variant === 'primary' ? styles.primaryButton : styles.secondaryButton;
  const textStyle = variant === 'primary' ? styles.primaryText : styles.secondaryText;

  return (
    <TouchableOpacity style={[buttonStyle, style]} onPress={onPress}>
      <Text style={textStyle}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 25,
    width: '80%',
    elevation: 3,
  },
  secondaryButton: {
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 25,
    width: '80%',
    elevation: 3,
  },
  primaryText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  secondaryText: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});