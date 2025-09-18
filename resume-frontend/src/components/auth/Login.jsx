import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { trackUserLogin, trackGoogleUserRegistration } from '../Analytics';

const Login = ({ onLogin, onClose, contextMessage }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState('login'); // 'login' or 'signup'

  const handleGoogleLogin = async (googleToken, email) => {
    try {
      setError('');
      
      // Decode the Google token to get user information
      const decodedToken = decodeJwt(googleToken);
      console.log('Decoded Google token:', decodedToken);
      
      const getApiUrl = () => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          return 'http://localhost:8081';
        }
        return process.env.REACT_APP_API_URL || 'http://localhost:8081';
      };
      
      const API_BASE_URL = getApiUrl();
      console.log('Making Google login request to:', `${API_BASE_URL}/api/auth/google`);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: googleToken,
          email: email,
          name: decodedToken.name || '',
          picture: decodedToken.picture || '',
          google_id: decodedToken.sub || ''
        }),
      });
      
      console.log('Google login response status:', response.status);
      
      const result = await response.json();
      console.log('Google login backend response:', result);
      
      if (result.success) {
        console.log('Google login successful, token:', result.token);
        
        // Track Google login
        trackUserLogin('google_oauth');
        
        // Check if this is a new user registration
        if (result.message && result.message.includes('created')) {
          trackGoogleUserRegistration();
        }
        const userPayload = result.user || {
          email,
          name: decodedToken?.name || email,
          is_admin: result.user?.is_admin ?? false,
        };
        onLogin(userPayload, result.token);
      } else {
        console.log('Google login failed:', result.message);
        setError(result.message || 'Google authentication failed');
      }
    } catch (error) {
      console.error('Google login error:', error);
      setError('Google login failed. Please try email/password login instead.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    // Remove name validation since we use email as name
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (mode === 'signup') {
      if (!confirmPassword) {
        setError('Please confirm your password.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }
    setError('');

    try {
      const endpoint = mode === 'signup' ? '/api/auth/register' : '/api/auth/login';
      
      // Use same API_BASE_URL logic as other files
      const getApiUrl = () => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          return 'http://localhost:8081';
        }
        return process.env.REACT_APP_API_URL || 'http://localhost:8081';
      };
      
      const API_BASE_URL = getApiUrl();
      console.log('Making request to:', `${API_BASE_URL}${endpoint}`);
      console.log('Request body:', { email: email, password: password });
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
          name: email  // Use email as name
        }),
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      const result = await response.json();
      console.log('Backend response:', result);
      
      if (result.success) {
        console.log('Login successful, token:', result.token);
        
        // Track login method
        trackUserLogin(mode === 'signup' ? 'email_registration' : 'email_login');
        
        // Pass both user data and token to the login function
        const userPayload = result.user || {
          email,
          name: result.user?.name || email,
          is_admin: result.user?.is_admin ?? false,
        };
        onLogin(userPayload, result.token);
      } else {
        console.log('Login failed:', result.message);
        setError(result.message || 'Authentication failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  // Helper to decode Google credential
  function decodeJwt(token) {
    if (!token) return null;
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  }



    return (
      <div 
        className="compact-login-modal"
        style={{ 
          maxWidth: window.innerWidth <= 768 ? '320px' : '480px', 
          width: window.innerWidth <= 768 ? 'calc(100vw - 2rem)' : '480px',
          padding: window.innerWidth <= 768 ? '1rem 0.75rem 0.75rem 0.75rem' : '2rem 1.5rem', 
          background: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
          position: 'relative',
          maxHeight: 'calc(100vh - 4rem)',
          overflowY: 'auto',
          fontSize: window.innerWidth <= 768 ? '14px' : '16px',
          boxSizing: 'border-box'
        }}
      >
        <style>{`
          .compact-login-modal * {
            box-sizing: border-box;
          }
          
          /* Mobile styles (default) */
          .compact-login-modal input {
            width: 100% !important;
            padding: 0.4rem !important;
            font-size: 0.85rem !important;
            margin-bottom: 0.5rem !important;
            border: 1px solid #ccc !important;
            border-radius: 4px !important;
          }
          .compact-login-modal label {
            font-size: 0.75rem !important;
            margin-bottom: 0.2rem !important;
            display: block !important;
          }
          .compact-login-modal h2 {
            font-size: 1.1rem !important;
            margin-bottom: 0.8rem !important;
            text-align: center !important;
          }
          .compact-login-modal button[type="submit"] {
            width: 100% !important;
            padding: 0.5rem !important;
            font-size: 0.85rem !important;
            margin-top: 0.5rem !important;
          }
          .compact-login-modal > div:last-child {
            margin-top: 0.5rem !important;
            font-size: 0.75rem !important;
          }
          
          /* Desktop styles */
          @media (min-width: 769px) {
            .compact-login-modal input {
              padding: 0.75rem !important;
              font-size: 1rem !important;
              margin-bottom: 0.75rem !important;
            }
            .compact-login-modal label {
              font-size: 0.9rem !important;
              margin-bottom: 0.3rem !important;
            }
            .compact-login-modal h2 {
              font-size: 1.5rem !important;
              margin-bottom: 1.25rem !important;
            }
            .compact-login-modal button[type="submit"] {
              padding: 0.75rem !important;
              font-size: 1rem !important;
              margin-top: 0.75rem !important;
            }
            .compact-login-modal > div:last-child {
              margin-top: 0.75rem !important;
              font-size: 0.9rem !important;
            }
          }
        `}</style>
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          background: 'transparent',
          border: 'none',
          fontSize: '20px',
          cursor: 'pointer',
          color: '#dc2626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          fontWeight: 'bold',
          padding: '4px',
          width: '32px',
          height: '32px'
        }}
        onMouseEnter={(e) => {
          e.target.style.color = '#b91c1c';
          e.target.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.color = '#dc2626';
          e.target.style.transform = 'scale(1)';
        }}
        aria-label="Close auth modal"
      >×</button>
      <h2 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '1.3rem' }}>{mode === 'login' ? 'Login' : 'Sign Up'}</h2>
      {contextMessage && (
        <div
          style={{
            background: '#fef3c7',
            border: '1px solid #fcd34d',
            borderRadius: '6px',
            color: '#92400e',
            fontSize: '0.9rem',
            lineHeight: 1.4,
            marginBottom: '1rem',
            padding: '0.75rem'
          }}
        >
          {contextMessage}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <GoogleLogin
          onSuccess={credentialResponse => {
            console.log('Google login success:', credentialResponse);
            const info = decodeJwt(credentialResponse.credential);
            if (info && info.email) {
              // For Google OAuth, we need to call the backend to validate the token
              // and get a proper JWT token for our app
              handleGoogleLogin(credentialResponse.credential, info.email);
            } else {
              setError('Google login failed: could not get email');
            }
          }}
          onError={(error) => {
            console.error('Google login error:', error);
            if (process.env.NODE_ENV === 'development') {
              setError('Google OAuth not configured for localhost. Please use email/password login or configure Google OAuth client ID for localhost:3000.');
            } else {
              setError('Google login failed. Please try email/password login instead.');
            }
          }}
          width="100%"
          size="large"
        />
      </div>
      <form onSubmit={handleSubmit}>
        <label style={{ fontSize: '0.8rem', marginBottom: '0.2rem', display: 'block' }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Enter your email"
          style={{ marginBottom: '0.75rem', padding: '0.5rem', fontSize: '0.9rem' }}
        />
        <label style={{ fontSize: '0.8rem', marginBottom: '0.2rem', display: 'block' }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Enter your password"
          style={{ marginBottom: '0.75rem', padding: '0.5rem', fontSize: '0.9rem' }}
        />
        {mode === 'signup' && (
          <>
            <label style={{ fontSize: '0.8rem', marginBottom: '0.2rem', display: 'block' }}>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              style={{ marginBottom: '0.75rem', padding: '0.5rem', fontSize: '0.9rem' }}
            />
          </>
        )}
        {error && <div style={{ color: 'red', marginBottom: '0.75rem', fontSize: '0.85rem' }}>{error}</div>}
        <button type="submit" style={{ width: '100%', padding: '0.6rem', fontSize: '0.9rem' }}>{mode === 'login' ? 'Login' : 'Sign Up'}</button>
      </form>
      <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.85rem' }}>
        {mode === 'login' ? (
          <span>Don't have an account?{' '}
            <button type="button" style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setMode('signup'); setError(''); setConfirmPassword(''); }}>Sign up</button>
          </span>
        ) : (
          <span>Already have an account?{' '}
            <button type="button" style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setMode('login'); setError(''); setConfirmPassword(''); }}>Login</button>
          </span>
        )}
      </div>
    </div>
  );
};

export default Login; 







