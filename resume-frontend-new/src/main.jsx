import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider, createTheme } from '@mantine/core';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { ResumeProvider } from './context/ResumeContext';
import '@mantine/core/styles.css';
import App from './App';

const theme = createTheme({
  primaryColor: 'orange',
  fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  headings: {
    fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    fontWeight: '700',
  },
  defaultRadius: 'md',
  colors: {
    orange: [
      '#fff4e6', '#ffe8cc', '#ffd8a8', '#ffc078', '#ffa94d',
      '#ff922b', '#fd7e14', '#f76707', '#e8590c', '#d9480f',
    ],
  },
});

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <MantineProvider theme={theme} defaultColorScheme="light">
        <BrowserRouter>
          <AuthProvider>
            <ResumeProvider>
              <App />
            </ResumeProvider>
          </AuthProvider>
        </BrowserRouter>
      </MantineProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
