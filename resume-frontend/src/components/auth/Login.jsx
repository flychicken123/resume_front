import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { trackUserLogin, trackGoogleUserRegistration } from '../Analytics';

const Login = ({ onLogin, onClose }) => {
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
        
        onLogin(email, result.token);
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
        onLogin(email, result.token);
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
    <div className="login-container" style={{ 
      maxWidth: 400, 
      width: 'calc(100vw - 2rem)',
      margin: '1rem auto', 
      padding: '1.5rem', 
      background: 'white', 
      borderRadius: 12, 
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)', 
      position: 'relative',
      maxHeight: 'calc(100vh - 2rem)',
      overflowY: 'auto'
    }}>
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          background: '#f3f4f6',
          border: 'none',
          fontSize: '20px',
          cursor: 'pointer',
          color: '#6b7280',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          fontWeight: 'bold',
          padding: '8px',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = '#e5e7eb';
          e.target.style.color = '#374151';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = '#f3f4f6';
          e.target.style.color = '#6b7280';
        }}
        aria-label="Close auth modal"
      >×</button>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>{mode === 'login' ? 'Login' : 'Sign Up'}</h2>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
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
          width={400}
        />
      </div>
      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Enter your email"
          style={{ marginBottom: '1rem' }}
        />
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Enter your password"
          style={{ marginBottom: '1rem' }}
        />
        {mode === 'signup' && (
          <>
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              style={{ marginBottom: '1rem' }}
            />
          </>
        )}
        {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
        <button type="submit" style={{ width: '100%' }}>{mode === 'login' ? 'Login' : 'Sign Up'}</button>
      </form>
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
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