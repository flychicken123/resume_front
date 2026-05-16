import React, { createContext, useContext, useState, useEffect } from 'react';
import { ensureExperimentUserId } from '../api';

const AuthContext = createContext();

const normalizeUser = (rawUser) => {
  if (!rawUser) {
    return null;
  }

  if (typeof rawUser === 'string') {
    return {
      email: rawUser,
      name: rawUser,
      isAdmin: false,
    };
  }

  if (typeof rawUser === 'object') {
    const normalized = {
      id: rawUser.id ?? rawUser.user_id ?? null,
      email: rawUser.email ?? rawUser.user ?? '',
      name: rawUser.name ?? rawUser.email ?? rawUser.user ?? '',
      isAdmin: rawUser.isAdmin ?? rawUser.is_admin ?? false,
    };

    return normalized.email ? normalized : null;
  }

  return null;
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing user session on app load
  useEffect(() => {
    const savedUser = localStorage.getItem('resumeUser');
    const savedToken = localStorage.getItem('resumeToken');

    let parsedUser = null;
    if (savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
      try {
        parsedUser = JSON.parse(savedUser);
      } catch (error) {
        parsedUser = savedUser;
      }
    }

    const normalizedUser = normalizeUser(parsedUser);

    if (normalizedUser && savedToken && savedToken !== 'undefined' && savedToken !== 'null') {
      setUser(normalizedUser);
      setToken(savedToken);
    }
    setLoading(false);
  }, []);

  const login = (userData, authToken) => {
    const normalized = normalizeUser(userData);
    setUser(normalized);
    setToken(authToken);

    if (normalized) {
      localStorage.setItem('resumeUser', JSON.stringify(normalized));
    } else {
      localStorage.removeItem('resumeUser');
    }

    localStorage.setItem('resumeToken', authToken);
  };

  const logout = (redirect = true) => {
    console.log('AuthContext logout called');
    setUser(null);
    setToken(null);
    localStorage.removeItem('resumeUser');
    localStorage.removeItem('resumeToken');
    console.log('AuthContext logout completed');
    
    // Redirect to login page if specified
    if (redirect) {
      window.location.href = '/login';
    }
  };

  const getAuthHeaders = () => {
    const baseHeaders = {
      'Content-Type': 'application/json',
      'X-Experiment-User': ensureExperimentUserId(),
    };

    if (!token || token === 'undefined' || token === 'null') {
      return baseHeaders;
    }

    return {
      ...baseHeaders,
      'Authorization': `Bearer ${token}`
    };
  };

  const value = {
    user,
    token,
    login,
    logout,
    loading,
    getAuthHeaders,
    isAdmin: user?.isAdmin ?? false,
    userEmail: user?.email ?? null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 




