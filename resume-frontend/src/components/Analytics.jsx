import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Analytics configuration
const GA_MEASUREMENT_ID = process.env.REACT_APP_GA_MEASUREMENT_ID || 'G-B327RPMPS5';

// Check if we're in development/localhost
const isLocalhost = () => {
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' || 
         window.location.hostname === '0.0.0.0' ||
         window.location.hostname.includes('localhost');
};

// Initialize Google Analytics
export const initGA = () => {
  if (typeof window !== 'undefined' && window.gtag && !isLocalhost()) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_title: document.title,
      page_location: window.location.href,
    });
  }
};

// Track page views
export const trackPageView = (path) => {
  if (typeof window !== 'undefined' && window.gtag && !isLocalhost()) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: path,
      page_title: document.title,
    });
  }
};

// Track custom events
export const trackEvent = (action, category, label, value) => {
  if (typeof window !== 'undefined' && window.gtag && !isLocalhost()) {
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

// Track AI feature usage
export const trackAIFeatureUsage = (featureName) => {
  trackEvent('ai_feature_used', 'engagement', featureName, 1);
};

// Track form completion steps
export const trackFormStepCompletion = (stepName) => {
  trackEvent('form_step_completed', 'engagement', stepName, 1);
};

// Track time spent on builder
export const trackBuilderTimeSpent = (duration) => {
  trackEvent('builder_time_spent', 'engagement', 'resume_builder', duration);
};

// Track referrer/source when user enters the builder
export const trackReferrer = () => {
  if (typeof gtag !== 'undefined' && !isLocalhost()) {
    const referrer = document.referrer || 'direct';
    const currentPage = window.location.pathname;
    
    gtag('event', 'page_referrer', {
      'event_category': 'navigation',
      'event_label': referrer,
      'custom_parameter_1': currentPage,
      'custom_parameter_2': window.location.search || 'no_params'
    });
    
    console.log('Referrer tracked:', { referrer, currentPage });
  }
};

// Track when user starts building resume
export const trackBuilderStart = (source) => {
  if (typeof gtag !== 'undefined' && !isLocalhost()) {
    gtag('event', 'resume_builder_start', {
      'event_category': 'engagement',
      'event_label': source || 'unknown',
      'custom_parameter_1': document.referrer || 'direct'
    });
  }
};

// Track when user completes a step
export const trackStepCompletion = (stepName, stepNumber) => {
  if (typeof gtag !== 'undefined' && !isLocalhost()) {
    gtag('event', 'step_completion', {
      'event_category': 'progress',
      'event_label': stepName,
      'custom_parameter_1': stepNumber,
      'custom_parameter_2': document.referrer || 'direct'
    });
  }
};

// Analytics component for automatic page tracking
const Analytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view when location changes (only if not localhost)
    if (!isLocalhost()) {
      trackPageView(location.pathname);
    }
  }, [location]);

  return null; // This component doesn't render anything
};

export default Analytics;
