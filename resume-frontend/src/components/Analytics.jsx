import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Analytics configuration
const GA_MEASUREMENT_ID = process.env.REACT_APP_GA_MEASUREMENT_ID || 'G-B327RPMPS5';

// Check if we're in development/localhost - don't track analytics in development
const isLocalhost = () => {
  return process.env.NODE_ENV === 'development' ||
         window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' || 
         window.location.hostname === '0.0.0.0' ||
         window.location.hostname.includes('localhost') ||
         window.location.hostname.includes('127.0.0.1');
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

// Enhanced user source tracking
export const getUserSource = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const referrer = document.referrer;
  
  // UTM parameter detection (debug logging removed for production)
  
  // Check for UTM parameters first (highest priority)
  if (urlParams.get('utm_source')) {
    return {
      source: urlParams.get('utm_source'),
      medium: urlParams.get('utm_medium') || 'unknown',
      campaign: urlParams.get('utm_campaign') || 'unknown',
      term: urlParams.get('utm_term') || 'unknown',
      content: urlParams.get('utm_content') || 'unknown',
      type: 'utm'
    };
  }
  
  // Check for common social media and search engine referrers
  if (referrer) {
    const referrerDomain = new URL(referrer).hostname.toLowerCase();
    
    // Search engines
    if (referrerDomain.includes('google')) {
      return { source: 'google', medium: 'search', type: 'search_engine' };
    }
    if (referrerDomain.includes('bing')) {
      return { source: 'bing', medium: 'search', type: 'search_engine' };
    }
    if (referrerDomain.includes('yahoo')) {
      return { source: 'yahoo', medium: 'search', type: 'search_engine' };
    }
    if (referrerDomain.includes('duckduckgo')) {
      return { source: 'duckduckgo', medium: 'search', type: 'search_engine' };
    }
    
    // Social media
    if (referrerDomain.includes('facebook')) {
      return { source: 'facebook', medium: 'social', type: 'social_media' };
    }
    if (referrerDomain.includes('twitter') || referrerDomain.includes('x.com')) {
      return { source: 'twitter', medium: 'social', type: 'social_media' };
    }
    if (referrerDomain.includes('linkedin')) {
      return { source: 'linkedin', medium: 'social', type: 'social_media' };
    }
    if (referrerDomain.includes('instagram')) {
      return { source: 'instagram', medium: 'social', type: 'social_media' };
    }
    if (referrerDomain.includes('tiktok')) {
      return { source: 'tiktok', medium: 'social', type: 'social_media' };
    }
    if (referrerDomain.includes('reddit')) {
      return { source: 'reddit', medium: 'social', type: 'social_media' };
    }
    if (referrerDomain.includes('youtube')) {
      return { source: 'youtube', medium: 'video', type: 'social_media' };
    }
    
    // Other referrers
    return { source: referrerDomain, medium: 'referral', type: 'external_website' };
  }
  
  // Direct traffic (no referrer)
  return { source: 'direct', medium: 'none', type: 'direct' };
};

// Track referrer/source when user enters the builder
export const trackReferrer = () => {
  const userSource = getUserSource();
  const currentPage = window.location.pathname;
  
  // Analytics tracking (debug logging removed for production)
  
  if (typeof gtag !== 'undefined' && !isLocalhost()) {
    
    gtag('event', 'page_referrer', {
      'event_category': 'user_acquisition',
      'event_label': userSource.source,
      'custom_parameter_1': userSource.medium,
      'custom_parameter_2': userSource.type,
      'custom_parameter_3': currentPage,
      'custom_parameter_4': window.location.search || 'no_params'
    });
    
    // Also track as a separate user source event for better analytics
    gtag('event', 'user_source_detected', {
      'event_category': 'user_acquisition',
      'event_label': userSource.source,
      'source_medium': userSource.medium,
      'source_type': userSource.type,
      'landing_page': currentPage,
      'custom_parameter_source': userSource.source,
      'custom_parameter_medium': userSource.medium,
      'custom_parameter_type': userSource.type
    });
  }
};

// Track when user starts building resume (enhanced with source info)
export const trackBuilderStart = (source) => {
  if (typeof gtag !== 'undefined' && !isLocalhost()) {
    const userSource = getUserSource();
    
    gtag('event', 'resume_builder_start', {
      'event_category': 'engagement',
      'event_label': source || 'unknown',
      'user_source': userSource.source,
      'user_medium': userSource.medium,
      'user_source_type': userSource.type,
      'custom_parameter_1': document.referrer || 'direct'
    });
  }
};

// Function to get detailed source information (useful for debugging)
export const getDetailedSourceInfo = () => {
  const userSource = getUserSource();
  const urlParams = new URLSearchParams(window.location.search);
  
  return {
    ...userSource,
    fullUrl: window.location.href,
    referrer: document.referrer || 'none',
    utmParams: {
      source: urlParams.get('utm_source'),
      medium: urlParams.get('utm_medium'),
      campaign: urlParams.get('utm_campaign'),
      term: urlParams.get('utm_term'),
      content: urlParams.get('utm_content')
    },
    timestamp: new Date().toISOString()
  };
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
