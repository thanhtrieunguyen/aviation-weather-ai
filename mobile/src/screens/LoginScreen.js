import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Input } from '../components/Input/Input';
import { PasswordInput } from '../components/PasswordInput/PasswordInput';
import { Button } from '../components/Button/Button';
import { useAuth } from '../contexts/AuthContext';
import { validateEmail, validatePassword } from '../utils/validation';
import { theme } from '../utils/theme';

export default function LoginScreen({ navigation, route }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState('');

  useEffect(() => {
    const type = route.params?.loginType || '';
    setLoginType(type);
  }, [route.params]);

  const handleLogin = async () => {
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const response = await signIn(email, password);

      if (response?.error) {
        setError(response.error);
        return;
      }

      const userRole = response?.user?.role?.toLowerCase(); // Chuẩn hóa role về lowercase để so sánh

      if (!userRole) {
        setError('Không tìm thấy vai trò người dùng');
        return;
      }

      // Logic điều hướng
      if (loginType === 'pilot') {
        // Chỉ Admin được vào Pilot Dashboard
        if (userRole === 'admin') {
          navigation.replace('PilotDashboardAdmin');
        } else {
          setError('Chỉ Admin mới có quyền truy cập Pilot Dashboard');
          return;
        }
      } else if (loginType === 'customer') {
        if ( userRole === 'user') {
          navigation.replace('PilotDashboard');
        } else {
          setError('Bạn không có quyền truy cập Customer Dashboard');
          return;
        }
      } else {
        setError('Loại đăng nhập không hợp lệ');
      }
    } catch (err) {
      console.error('Login Error:', err);
      setError(err.message || 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={theme.gradients.primary} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.wrapper}>
            <Text style={styles.title}>
              {loginType === 'pilot' ? 'Pilot Login' : 'Customer Login'}
            </Text>
            <Text style={styles.subtitle}>Enter your credentials</Text>

            <View style={styles.inputContainer}>
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />

              <PasswordInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                containerStyle={styles.passwordInputContainer}
                inputStyle={styles.passwordInput}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              onPress={!loading ? handleLogin : null}
              disabled={loading}
              style={styles.button}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.white,
    marginBottom: 10,
    textAlign: 'center',
  },
  inputContainer: {
    marginVertical: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 10,
    width: '100%',
  },
  input: {
    marginBottom: 15,
    backgroundColor: 'white',
    padding: 16,
    paddingHorizontal: 25,
    borderRadius: 8,
    fontSize: 14,
  },
  passwordInputContainer: {
    marginBottom: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
  },
  passwordInput: {
    padding: 16,
    fontSize: 14,
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  button: {
    marginTop: 20,
  },
});