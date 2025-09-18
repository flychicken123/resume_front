import React, { createContext, useContext, useState, useEffect } from 'react';

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
    console.log('AuthContext useEffect - savedUser:', savedUser);
    console.log('AuthContext useEffect - savedToken:', savedToken);

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
      console.log('AuthContext useEffect - setting user and token from localStorage');
      setUser(normalizedUser);
      setToken(savedToken);
    } else {
      console.log('AuthContext useEffect - no valid saved user/token found, but not auto-logging out');
    }
    setLoading(false);
  }, []);

  const login = (userData, authToken) => {
    console.log('AuthContext login called with:', { userData, authToken });
    const normalized = normalizeUser(userData);
    setUser(normalized);
    setToken(authToken);

    if (normalized) {
      localStorage.setItem('resumeUser', JSON.stringify(normalized));
    } else {
      localStorage.removeItem('resumeUser');
    }

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




