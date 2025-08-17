import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ResumeProvider } from './context/ResumeContext';
import Home from './components/Home';
import { LoginPage, BuilderPage } from './pages';
import Analytics from './components/Analytics';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <ResumeProvider>
        <Router future={{ 
          v7_startTransition: true,
          v7_relativeSplatPath: true 
        }}>
          <Analytics />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/builder" element={<BuilderPage />} />
          </Routes>
        </Router>
      </ResumeProvider>
    </AuthProvider>
  );
}

export default App;