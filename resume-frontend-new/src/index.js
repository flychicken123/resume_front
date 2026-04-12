import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';
import { GoogleOAuthProvider } from '@react-oauth/google';

const clientId = '978604541120-fmcim15k16vbatesna24ulke8m4buldp.apps.googleusercontent.com';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <GoogleOAuthProvider clientId={clientId}>
    <App />
  </GoogleOAuthProvider>
);