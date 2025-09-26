import { getAPIBaseURL } from '../api';

let trackingInitialized = false;
let lastPagePath = window?.location?.pathname || '/';
let previousPagePath = '';
let lastPageTitle = typeof document !== 'undefined' ? document.title : '';
let lastStep = '';
let lastStepAt = Date.now();
let pageEnteredAt = Date.now();
let sessionStart = Date.now();
let eventSent = false;

const apiBaseUrl = typeof window !== 'undefined' ? getAPIBaseURL() : '';

const buildPayload = (reason = 'unload') => {
  const now = Date.now();
  const effectiveStep = lastStep || `page:${lastPagePath}`;
  const lastStepDelta = lastStep ? now - lastStepAt : null;
  return {
    page_path: lastPagePath,
    page_title: lastPageTitle,
    previous_page_path: previousPagePath,
    step: effectiveStep,
    reason,
    user_email: getStoredUserEmail(),
    session_duration_ms: now - sessionStart,
    page_duration_ms: now - pageEnteredAt,
    last_step_delta_ms: lastStepDelta,
    referrer: typeof document !== 'undefined' ? document.referrer || '' : '',
    timestamp: new Date().toISOString(),
  };
};

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
    lastStepAt = Date.now();
  }
};

export const setCurrentPage = (path, title = '') => {
  const previousPage = lastPagePath;
  previousPagePath = previousPage;
  lastPagePath = path || '/';
  lastPageTitle = title;
  pageEnteredAt = Date.now();
  eventSent = false;
  if (!lastStep || lastStep.startsWith('page:') || lastStep === `page:${previousPage}`) {
    lastStep = `page:${lastPagePath}`;
    lastStepAt = Date.now();
  }
};

export const initExitTracking = () => {
  if (trackingInitialized || typeof window === 'undefined') return;
  trackingInitialized = true;

  sessionStart = Date.now();
  pageEnteredAt = Date.now();

  window.addEventListener('pageshow', () => {
    eventSent = false;
    pageEnteredAt = Date.now();
  });

  const handleBeforeUnload = () => {
    eventSent = false;
    sendExitEvent('beforeunload');
  };

  const handlePageHide = (event) => {
    if (event.persisted) {
      eventSent = false;
      return;
    }
    sendExitEvent('pagehide');
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      eventSent = false;
      pageEnteredAt = Date.now();
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('pagehide', handlePageHide);
  document.addEventListener('visibilitychange', handleVisibilityChange);
};
