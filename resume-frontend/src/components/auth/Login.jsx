import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';

const Login = ({ onLogin, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState('login'); // 'login' or 'signup'

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
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
      const endpoint = mode === 'signup' ? '/auth/register' : '/auth/login';
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Pass both user data and token to the login function
        onLogin(email, result.token);
      } else {
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
    <div className="login-container" style={{ maxWidth: 400, margin: '4rem auto', padding: '2rem', background: 'white', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', position: 'relative' }}>
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          background: 'transparent',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer',
          color: '#999',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          fontWeight: 'normal',
          padding: '0',
          width: '24px',
          height: '24px'
        }}
        onMouseEnter={(e) => {
          e.target.style.color = '#333';
        }}
        onMouseLeave={(e) => {
          e.target.style.color = '#999';
        }}
        aria-label="Close auth modal"
      >×</button>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>{mode === 'login' ? 'Login' : 'Sign Up'}</h2>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <GoogleLogin
          onSuccess={credentialResponse => {
            const info = decodeJwt(credentialResponse.credential);
            if (info && info.email) {
              onLogin(info.email);
            } else {
              setError('Google login failed: could not get email');
            }
          }}
          onError={() => {
            setError('Google login failed');
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