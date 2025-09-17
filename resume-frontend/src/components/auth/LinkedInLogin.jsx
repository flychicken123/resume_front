import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LinkedInLogin = ({ onSuccess, onError, isLinking = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, linkLinkedIn, token } = useAuth();
  
  // LinkedIn OAuth configuration
  const CLIENT_ID = process.env.REACT_APP_LINKEDIN_CLIENT_ID || '';
  const REDIRECT_URI = window.location.origin + '/linkedin-callback';
  const STATE = Math.random().toString(36).substring(7);
  
  // Check if CLIENT_ID is configured
  if (!CLIENT_ID) {
    console.error('LinkedIn Client ID is not configured. Please set REACT_APP_LINKEDIN_CLIENT_ID environment variable.');
  }
  
  useEffect(() => {
    // Handle LinkedIn callback
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');
      
      if (error) {
        console.error('LinkedIn auth error:', error);
        if (onError) onError(error);
        return;
      }
      
      if (code) {
        try {
          setIsLoading(true);
          
          // Exchange code for token on backend
          const headers = {
            'Content-Type': 'application/json',
          };
          
          // If linking, include the existing auth token
          if (isLinking && token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          
          const response = await fetch(`${getAPIBaseURL()}/api/auth/linkedin/token`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
              code: code,
              redirect_uri: REDIRECT_URI,
            }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to exchange LinkedIn token');
          }
          
          const data = await response.json();
          
          if (isLinking && token) {
            // Just linking LinkedIn to existing account
            localStorage.setItem('linkedinToken', data.linkedin_token);
            if (linkLinkedIn) {
              linkLinkedIn(data.linkedin_token);
            }
          } else {
            // Full login with LinkedIn
            localStorage.setItem('resumeToken', data.token);
            localStorage.setItem('linkedinToken', data.linkedin_token);
            await login(data.user.email, data.token);
          }
          
          // Clear URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
          
          if (onSuccess) {
            onSuccess(data);
          }
          
          // Only navigate if doing full login, not linking
          if (!isLinking) {
            navigate('/builder');
          }
        } catch (err) {
          console.error('LinkedIn login error:', err);
          if (onError) onError(err.message);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    // Check if we're on the callback page
    if (window.location.pathname === '/linkedin-callback') {
      handleCallback();
    }
  }, [login, navigate, onSuccess, onError]);
  
  const handleLinkedInLogin = () => {
    // Store state in sessionStorage for verification
    sessionStorage.setItem('linkedin_state', STATE);
    
    // Build LinkedIn OAuth URL
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
      `response_type=code&` +
      `client_id=${CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `state=${STATE}&` +
      `scope=${encodeURIComponent('openid profile email')}`;
    
    // Open LinkedIn auth in popup window
    const width = 500;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    const popup = window.open(
      authUrl,
      'LinkedIn Login',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
    );
    
    // Check if popup was blocked
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      // Fallback to redirect
      window.location.href = authUrl;
    } else {
      // Monitor popup for completion
      const checkPopup = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(checkPopup);
            return;
          }
          
          // Check if popup URL contains callback
          if (popup.location.href.includes('/linkedin-callback')) {
            const popupUrl = new URL(popup.location.href);
            const code = popupUrl.searchParams.get('code');
            const error = popupUrl.searchParams.get('error');
            
            if (code || error) {
              popup.close();
              clearInterval(checkPopup);
              
              // Handle the callback
              if (code) {
                handleLinkedInCallback(code);
              } else if (error) {
                console.error('LinkedIn auth error:', error);
                if (onError) onError(error);
              }
            }
          }
        } catch (e) {
          // Cross-origin error, ignore
        }
      }, 1000);
    }
  };
  
  const handleLinkedInCallback = async (code) => {
    try {
      setIsLoading(true);
      
      // Exchange code for token on backend
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // If linking, include the existing auth token
      if (isLinking && token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${getAPIBaseURL()}/api/auth/linkedin/token`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          code: code,
          redirect_uri: REDIRECT_URI,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to exchange LinkedIn token');
      }
      
      const data = await response.json();
      
      if (isLinking && token) {
        // Just linking LinkedIn to existing account
        localStorage.setItem('linkedinToken', data.linkedin_token);
        if (linkLinkedIn) {
          linkLinkedIn(data.linkedin_token);
        }
      } else {
        // Full login with LinkedIn
        localStorage.setItem('resumeToken', data.token);
        localStorage.setItem('linkedinToken', data.linkedin_token);
        await login(data.user.email, data.token);
      }
      
      if (onSuccess) {
        onSuccess(data);
      }
      
      // Only navigate if doing full login, not linking
      if (!isLinking) {
        navigate('/builder');
      }
    } catch (err) {
      console.error('LinkedIn login error:', err);
      if (onError) onError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getAPIBaseURL = () => {
    if (window.location.hostname === 'www.hihired.org') {
      return 'https://hihired.org';
    } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8081';
    }
    return window.location.origin;
  };
  
  // Temporarily commented out LinkedIn button - will resume work in the future
  return null;
  
  /* 
  return (
    <button
      onClick={handleLinkedInLogin}
      disabled={isLoading}
      className="linkedin-login-btn"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        width: '100%',
        padding: '12px 20px',
        backgroundColor: '#0077B5',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.3s ease',
        opacity: isLoading ? 0.7 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isLoading) e.target.style.backgroundColor = '#005885';
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = '#0077B5';
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
      </svg>
      {isLoading ? 'Connecting...' : (isLinking ? 'Link LinkedIn Account' : 'Continue with LinkedIn')}
    </button>
  );
  */
};

export default LinkedInLogin;