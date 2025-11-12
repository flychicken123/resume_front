import React from 'react';
import Login from './Login';
import { useAuth } from '../../context/AuthContext';

const AuthModal = ({ onClose, contextMessage }) => {
  const { login } = useAuth();

  const handleClose = () => {
    if (onClose && typeof onClose === 'function') {
      onClose();
    }
  };

  const handleLogin = (userData, token) => {
    login(userData, token);
    handleClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.25)',
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ position: 'relative' }}>
        <Login onLogin={handleLogin} onClose={handleClose} contextMessage={contextMessage} />
      </div>
    </div>
  );
};

export default AuthModal; 
