import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AuthModal from './auth/AuthModal';

const SessionMonitor = () => {
  const { logout } = useAuth();
  const [showSessionModal, setShowSessionModal] = useState(false);

  useEffect(() => {
    // Function to check if session is expired
    const checkSession = () => {
      const token = localStorage.getItem('resumeToken');
      
      // If no token, user is not logged in
      if (!token || token === 'undefined' || token === 'null') {
        return;
      }

      // Parse JWT token to check expiry (if JWT contains exp claim)
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          
          // Check if token has expired
          if (payload.exp) {
            const expiryTime = payload.exp * 1000; // Convert to milliseconds
            const currentTime = Date.now();
            
            if (currentTime >= expiryTime) {
              console.log('Session expired - logging out user');
              logout(false); // Clear session without navigation
              setShowSessionModal(true);
            }
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
    };

    // Check session immediately
    checkSession();

    // Check session every minute
    const interval = setInterval(checkSession, 60000);

    // Listen for storage events (logout from another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'resumeToken' && !e.newValue) {
        console.log('Token removed in another tab - logging out');
        logout(false); // Don't redirect, just update state
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [logout]);

  const handleCloseModal = () => setShowSessionModal(false);

  return showSessionModal ? (
    <AuthModal
      onClose={handleCloseModal}
      contextMessage="Your session has expired. Please log in again to continue."
    />
  ) : null;
};

export default SessionMonitor;