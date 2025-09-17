import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const SessionMonitor = () => {
  const { logout } = useAuth();

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
              // Show alert to user
              alert('Your session has expired. Please log in again.');
              logout(true); // Logout and redirect to login page
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

  return null; // This component doesn't render anything
};

export default SessionMonitor;