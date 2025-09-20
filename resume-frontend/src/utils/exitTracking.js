import { getAPIBaseURL } from '../api';

let trackingInitialized = false;
let lastPagePath = window?.location?.pathname || '/';
let lastPageTitle = typeof document !== 'undefined' ? document.title : '';
let lastStep = '';
let eventSent = false;

const apiBaseUrl = typeof window !== 'undefined' ? getAPIBaseURL() : '';

const buildPayload = (reason = 'unload') => ({
  page_path: lastPagePath,
  page_title: lastPageTitle,
  step: lastStep || `page:${lastPagePath}`,
  reason,
  user_email: getStoredUserEmail(),
});

const getStoredUserEmail = () => {
  try {
    const rawUser = localStorage.getItem('resumeUser');
    if (!rawUser) return '';
    const parsed = JSON.parse(rawUser);
    return parsed?.email || '';
  } catch (err) {
    console.warn('Unable to read stored user email', err);
    return '';
  }
};

const sendExitEvent = (reason) => {
  if (!apiBaseUrl || eventSent) return;
  const payload = buildPayload(reason);
  try {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    const ok = navigator.sendBeacon?.(`${apiBaseUrl}/api/analytics/exit`, blob);
    if (!ok) {
      fetch(`${apiBaseUrl}/api/analytics/exit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  } catch (err) {
    console.warn('Exit tracking failed', err);
  }
  eventSent = true;
};

export const setLastStep = (step) => {
  if (typeof step === 'string' && step.trim()) {
    lastStep = step.trim();
  }
};

export const setCurrentPage = (path, title = '') => {
  lastPagePath = path || '/';
  lastPageTitle = title;
  if (!lastStep) {
    lastStep = `page:${lastPagePath}`;
  }
};

export const initExitTracking = () => {
  if (trackingInitialized || typeof window === 'undefined') return;
  trackingInitialized = true;

  window.addEventListener('beforeunload', () => sendExitEvent('beforeunload'));

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      sendExitEvent('visibilitychange');
    }
  });
};
