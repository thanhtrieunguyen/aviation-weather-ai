import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../utils/theme';

export function PasswordInput({ value, onChangeText, ...props }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Password</Text>
      <View style={styles.inputContainer}>
        <TextInput
          {...props}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!showPassword}
          placeholder="Enter your password"
          style={styles.input}
          textAlign="left" // Đảm bảo nhập từ bên trái
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons 
            name={showPassword ? "eye-off" : "eye"} 
            size={24} 
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>
      <Text style={styles.charCount}>{value.length} characters</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 5,
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 10,
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'left', // Đảm bảo văn bản nhập vào từ bên trái
  },
  eyeIcon: {
    position: 'absolute',
    right: 10,
    padding: 10,
  },
  charCount: {
    marginTop: 5,
    fontSize: 12,
    color: theme.colors.gray,
    textAlign: 'right', // Đẩy số ký tự về phía bên phải
  },
});
