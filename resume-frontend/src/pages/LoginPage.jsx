import React from 'react';
import { useAuth } from '../context/AuthContext';
import Login from '../components/auth/Login';

const LoginPage = () => {
  const { login } = useAuth();
  
  const handleLogin = (userData, token) => {
    login(userData, token);
    // Redirect to home page after successful login
    window.location.href = '/';
  };
  
  const handleClose = () => {
    // Redirect to home page if user closes login
    window.location.href = '/';
  };
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <Login onLogin={handleLogin} onClose={handleClose} />
    </div>
  );
};

export default LoginPage;

