import React, { createContext, useState, useContext, useEffect } from 'react';
import { LoginService } from '../services/LoginService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await LoginService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Load user error:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const signIn = async (email, password) => {
    setLoading(true);
    console.log('LoginService:', LoginService);
    try {
      const userData = await LoginService.login(email, password);
      setUser(userData.user);
      return { user: userData.user };
    } catch (error) {
      console.error('Sign In Error:', error);
      return { 
        error: error.message || 'Đăng nhập thất bại, vui lòng thử lại!' 
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    LoginService.logout();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);