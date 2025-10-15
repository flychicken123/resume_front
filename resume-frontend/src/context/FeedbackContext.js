import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { sendFeedback, scheduleFeedbackFollowUp } from '../api';
import { useAuth } from './AuthContext';
import { setLastStep } from '../utils/exitTracking';

const FeedbackContext = createContext(null);

const DEFAULT_QUESTIONS = {
  'resume_import': 'Did the resume import capture your experience correctly?',
  'resume_download': 'Did your downloaded resume look right?',
  'job_match': 'Were these job matches relevant to you?',
  'widget': 'How can we improve your HiHired experience?',
};

const FEEDBACK_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

const getStoredUserEmail = () => {
  try {
    const rawUser = localStorage.getItem('resumeUser');
    if (!rawUser) return '';
    const parsed = JSON.parse(rawUser);
    if (typeof parsed === 'string') {
      return parsed;
    }
    return parsed?.email || parsed?.user || '';
  } catch (err) {
    console.warn('Unable to parse stored user email', err);
    return '';
  }
};

export const FeedbackProvider = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();

  const [promptState, setPromptState] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showThanks, setShowThanks] = useState(false);

  const sessionStartRef = useRef(Date.now());
  const pageStartRef = useRef(Date.now());
  const previousPathRef = useRef('');
  const currentPathRef = useRef(location.pathname);

  useEffect(() => {
    if (currentPathRef.current !== location.pathname) {
      previousPathRef.current = currentPathRef.current;
      currentPathRef.current = location.pathname;
      pageStartRef.current = Date.now();
    }
  }, [location.pathname]);

  const getUserEmail = useCallback(() => {
    return user?.email || getStoredUserEmail();
  }, [user]);

  const clearPrompt = useCallback(() => {
    setPromptState(null);
    setSubmitError('');
    setShowThanks(false);
  }, []);

  useEffect(() => {
    const escHandler = (event) => {
      if (event.key === 'Escape') {
        clearPrompt();
      }
    };
    window.addEventListener('keydown', escHandler);
    return () => window.removeEventListener('keydown', escHandler);
  }, [clearPrompt]);

  const markPromptSeen = (scenario) => {
    if (typeof window === 'undefined') return;
    const timestamp = Date.now();
    try {
      localStorage.setItem(`feedback_prompt_timestamp_${scenario}`, String(timestamp));
    } catch (err) {
      // ignore storage errors
    }
  };

  const hasPromptBeenShown = (scenario) => {
    if (typeof window === 'undefined') return false;
    const now = Date.now();

    try {
      const stored = localStorage.getItem(`feedback_prompt_timestamp_${scenario}`);
      if (stored) {
        const parsedTs = parseInt(stored, 10);
        if (!Number.isNaN(parsedTs) && now - parsedTs < FEEDBACK_COOLDOWN_MS) {
          return true;
        }
      }
    } catch (err) {
      // ignore storage errors
    }

    return false;
  };

  const triggerFeedbackPrompt = useCallback(
    ({ scenario, question, metadata = {}, force = false, allowComment = true }) => {
      if (!scenario) return;
      if (!force && hasPromptBeenShown(scenario)) {
        return;
      }

      const resolvedQuestion = question || DEFAULT_QUESTIONS[scenario] || DEFAULT_QUESTIONS.widget;
      markPromptSeen(scenario);
      setLastStep(`feedback_prompt_shown_${scenario}`);
      setSubmitError('');
      setShowThanks(false);
      setIsSubmitting(false);

      const hydratedMetadata = {
        source_path: currentPathRef.current,
        previous_path: previousPathRef.current,
        ...metadata,
      };
      if (!hydratedMetadata.step) {
        hydratedMetadata.step = `feedback:${scenario}`;
      }
      if (!hydratedMetadata.reason) {
        hydratedMetadata.reason = scenario === 'widget' ? 'manual_prompt' : scenario;
      }

      setPromptState({
        scenario,
        question: resolvedQuestion,
        metadata: hydratedMetadata,
        allowComment,
        openedAt: Date.now(),
      });
    },
    []
  );

  const scheduleFollowUp = useCallback(
    async ({ trigger, metadata = {}, delayHours = 24, email }) => {
      const targetEmail = email || getUserEmail();
      if (!trigger || !targetEmail) {
        return;
      }
      const payloadMetadata = {
        source_path: currentPathRef.current,
        previous_path: previousPathRef.current,
        scenario: trigger,
        ...metadata,
      };
      try {
        await scheduleFeedbackFollowUp(trigger, targetEmail, payloadMetadata, delayHours);
      } catch (err) {
        console.warn('Unable to schedule feedback follow-up', err);
      }
    },
    [getUserEmail]
  );

  const submitFeedbackHandler = useCallback(
    async ({ rating, comment }) => {
      if (!promptState) return;
      setIsSubmitting(true);
      setSubmitError('');

      const now = Date.now();
      const normalizedRating = rating == null ? null : Number(rating);
      const metadataPayload = {
        ...promptState.metadata,
        scenario: promptState.scenario,
      };
      const payload = {
        scenario: promptState.scenario,
        rating: normalizedRating,
        comment: comment || '',
        metadata: metadataPayload,
        user_email: getUserEmail(),
        page_path: currentPathRef.current,
        page_title: typeof document !== 'undefined' ? document.title || '' : '',
        step: promptState.metadata?.step || `feedback:${promptState.scenario}`,
        reason: promptState.metadata?.reason || promptState.scenario,
        previous_page_path: promptState.metadata?.previous_path || previousPathRef.current,
        session_duration_ms: now - sessionStartRef.current,
        page_duration_ms: now - pageStartRef.current,
        last_step_delta_ms: promptState.openedAt ? now - promptState.openedAt : null,
        referrer: (() => {
          if (typeof document !== 'undefined' && document.referrer) return document.referrer;
          if (typeof window !== 'undefined') return window.location.origin;
          return '';
        })(),
      };

      try {
        await sendFeedback(payload);
        setLastStep(`feedback_submitted_${promptState.scenario}`);
        setShowThanks(true);
        setTimeout(() => {
          clearPrompt();
        }, 1800);
      } catch (err) {
        setSubmitError(err?.message || 'Failed to send feedback');
      } finally {
        setIsSubmitting(false);
      }
    },
    [promptState, getUserEmail, clearPrompt]
  );

  const contextValue = useMemo(
    () => ({
      triggerFeedbackPrompt,
      openFeedbackWidget: () =>
        triggerFeedbackPrompt({ scenario: 'widget', force: true, allowComment: true }),
      scheduleFollowUp,
    }),
    [triggerFeedbackPrompt, scheduleFollowUp]
  );

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}
      <FeedbackWidget onOpen={() => contextValue.openFeedbackWidget()} />
      <FeedbackPrompt
        prompt={promptState}
        isSubmitting={isSubmitting}
        error={submitError}
        showThanks={showThanks}
        onClose={clearPrompt}
        onSubmit={submitFeedbackHandler}
      />
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return ctx;
};

const FeedbackWidget = ({ onOpen }) => {
  if (typeof window === 'undefined') return null;
  return (
    <div style={widgetContainerStyle}>
      <button type="button" style={widgetButtonStyle} onClick={onOpen}>
        💬 Give Feedback
      </button>
    </div>
  );
};

const FeedbackPrompt = ({ prompt, isSubmitting, error, showThanks, onClose, onSubmit }) => {
  const [rating, setRating] = useState(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    setRating(null);
    setComment('');
  }, [prompt?.scenario]);

  if (!prompt) {
    return null;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    if (rating == null && !prompt.allowComment) {
      return;
    }
    onSubmit({ rating, comment });
  };

  return (
    <div style={backdropStyle}>
      <div style={cardStyle} role="dialog" aria-modal="true">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#111827' }}>We'd love your feedback</h3>
          <button type="button" onClick={onClose} style={closeBtnStyle} aria-label="Dismiss feedback prompt">×</button>
        </div>
        <p style={{ margin: '0 0 1rem 0', color: '#374151', fontSize: '0.95rem' }}>{prompt.question}</p>
        {showThanks ? (
          <div style={{ textAlign: 'center', padding: '1rem 0', color: '#047857', fontWeight: 600 }}>
            Thanks! We appreciate the input.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={ratingRowStyle}>
              {ratingOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  style={{
                    ...ratingButtonStyle,
                    ...(rating === option.value ? ratingButtonActiveStyle : {}),
                  }}
                  onClick={() => setRating(option.value)}
                >
                  <span style={{ fontSize: '1.35rem' }}>{option.icon}</span>
                  <span style={{ fontSize: '0.75rem' }}>{option.label}</span>
                </button>
              ))}
            </div>
            {prompt.allowComment && (
              <div style={{ marginTop: '0.75rem' }}>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Anything specific we can improve?"
                  rows={3}
                  style={textareaStyle}
                />
              </div>
            )}
            {error && <div style={{ marginTop: '0.5rem', color: '#dc2626', fontSize: '0.85rem' }}>{error}</div>}
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" style={secondaryButtonStyle} onClick={onClose} disabled={isSubmitting}>
                Skip
              </button>
              <button type="submit" style={primaryButtonStyle} disabled={isSubmitting || rating == null}>
                {isSubmitting ? 'Sending…' : 'Submit'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const ratingOptions = [
  { value: 5, label: 'Loved it', icon: '😍' },
  { value: 4, label: 'Great', icon: '😊' },
  { value: 3, label: 'Okay', icon: '😐' },
  { value: 2, label: 'Needs work', icon: '😕' },
  { value: 1, label: 'Frustrating', icon: '😣' },
];

const widgetContainerStyle = {
  position: 'fixed',
  bottom: '6.5rem',
  right: '1.5rem',
  zIndex: 1200,
};

const widgetButtonStyle = {
  background: '#6366f1',
  color: '#ffffff',
  border: 'none',
  borderRadius: '9999px',
  padding: '0.75rem 1.5rem',
  fontSize: '0.95rem',
  fontWeight: 600,
  boxShadow: '0 10px 25px -10px rgba(79, 70, 229, 0.6)',
  cursor: 'pointer',
};

const backdropStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.38)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1300,
  padding: '1.5rem',
};

const cardStyle = {
  background: '#ffffff',
  borderRadius: '14px',
  maxWidth: '420px',
  width: '100%',
  padding: '1.5rem',
  boxShadow: '0 20px 45px -20px rgba(15, 23, 42, 0.4)',
};

const ratingRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '0.5rem',
};

const ratingButtonStyle = {
  flex: 1,
  border: '1px solid #e5e7eb',
  borderRadius: '10px',
  padding: '0.5rem',
  background: '#f9fafb',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.25rem',
  cursor: 'pointer',
};

const ratingButtonActiveStyle = {
  borderColor: '#6366f1',
  background: '#eef2ff',
  boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.25)',
};

const textareaStyle = {
  width: '100%',
  borderRadius: '10px',
  border: '1px solid #e5e7eb',
  padding: '0.65rem',
  fontSize: '0.9rem',
  resize: 'vertical',
};

const closeBtnStyle = {
  background: 'transparent',
  border: 'none',
  fontSize: '1.5rem',
  lineHeight: 1,
  cursor: 'pointer',
  color: '#6b7280',
};

const secondaryButtonStyle = {
  background: '#f3f4f6',
  color: '#4b5563',
  borderRadius: '8px',
  border: 'none',
  padding: '0.55rem 1.1rem',
  cursor: 'pointer',
};

const primaryButtonStyle = {
  background: '#6366f1',
  color: '#ffffff',
  borderRadius: '8px',
  border: 'none',
  padding: '0.55rem 1.3rem',
  cursor: 'pointer',
  fontWeight: 600,
};

export default FeedbackContext;
