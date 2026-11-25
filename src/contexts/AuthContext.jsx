
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Error restoring user:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password, role) => {
    setLoading(true);

    try {
      if (!email || !password) {
        throw new Error('Please enter email and password.');
      }

      const normalizedEmail = email.trim().toLowerCase();

      let userData;

      // Student and faculty login using the database
      if (role === 'student' || role === 'faculty') {
        const response = await fetch('http://127.0.0.1:5000/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: normalizedEmail,
            password: password,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Invalid email or password.');
        }

        // Verify the account role
        if (result.user.role !== role) {
          throw new Error('This account is not authorized for this login type.');
        }

        userData = result.user;

      } else {
        throw new Error('Invalid login role.');
      }

      // Save login information
      const token = 'mock-jwt-token-' + Date.now();

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);

      return { success: true, user: userData };

    } catch (error) {
      return {
        success: false,
        error: error.message || 'Login failed.',
      };

    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
