import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Analytics configuration
const GA_MEASUREMENT_ID = process.env.REACT_APP_GA_MEASUREMENT_ID || 'GA_MEASUREMENT_ID';

// Initialize Google Analytics
export const initGA = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_title: document.title,
      page_location: window.location.href,
    });
  }
};

// Track page views
export const trackPageView = (path) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: path,
      page_title: document.title,
    });
  }
};

// Track custom events
export const trackEvent = (action, category, label, value) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Track resume generation
export const trackResumeGeneration = (templateType) => {
  trackEvent('resume_generated', 'engagement', templateType, 1);
};

// Track resume download
export const trackResumeDownload = (templateType) => {
  trackEvent('resume_downloaded', 'engagement', templateType, 1);
};

// Track user registration
export const trackUserRegistration = (method) => {
  trackEvent('user_registered', 'user', method, 1);
};

// Track user login
export const trackUserLogin = (method) => {
  trackEvent('user_logged_in', 'user', method, 1);
};

// Track Google user registration
export const trackGoogleUserRegistration = () => {
  trackEvent('google_user_registered', 'user', 'google_oauth', 1);
};

// Analytics component for automatic page tracking
const Analytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view when location changes
    trackPageView(location.pathname);
  }, [location]);

  return null; // This component doesn't render anything
};

export default Analytics;
