import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

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
    console.log('AuthContext useEffect - savedUser:', savedUser);
    console.log('AuthContext useEffect - savedToken:', savedToken);
    
    if (savedUser && savedToken && savedToken !== 'undefined' && savedToken !== 'null') {
      console.log('AuthContext useEffect - setting user and token from localStorage');
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    } else {
      console.log('AuthContext useEffect - no valid saved user/token found, but not auto-logging out');
      // Don't auto-logout, just set loading to false
    }
    setLoading(false);
  }, []);

  const login = (userData, authToken) => {
    console.log('AuthContext login called with:', { userData, authToken });
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('resumeUser', JSON.stringify(userData));
    localStorage.setItem('resumeToken', authToken);
    console.log('AuthContext login completed, token saved to localStorage');
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
    console.log('AuthContext getAuthHeaders - token state:', token);
    console.log('AuthContext getAuthHeaders - localStorage token:', localStorage.getItem('resumeToken'));
    
    if (!token || token === 'undefined' || token === 'null') {
      console.log('AuthContext getAuthHeaders - no valid token, returning basic headers');
      return { 'Content-Type': 'application/json' };
    }
    
    console.log('AuthContext getAuthHeaders - returning headers with token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const value = {
    user,
    token,
    login,
    logout,
    loading,
    getAuthHeaders
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 