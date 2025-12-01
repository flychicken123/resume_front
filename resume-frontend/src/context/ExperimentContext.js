import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { assignExperimentVariant, ensureExperimentUserId, trackExperimentEvent } from '../api';
import { useAuth } from './AuthContext';

const ASSIGNMENT_CACHE_KEY = 'experimentAssignments';
const ASSIGNMENT_INFLIGHT_KEY = 'experimentAssignmentsInFlight';

const readCachedAssignments = () => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(ASSIGNMENT_CACHE_KEY);
    if (!raw || raw === 'undefined' || raw === 'null') return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch (err) {
    return {};
  }
};

const writeCachedAssignments = (data) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ASSIGNMENT_CACHE_KEY, JSON.stringify(data));
  } catch (err) {
    // ignore
  }
};

const getInflightMap = () => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(ASSIGNMENT_INFLIGHT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
};

const setInflight = (key, until) => {
  if (typeof window === 'undefined') return;
  try {
    const map = getInflightMap();
    map[key] = until;
    sessionStorage.setItem(ASSIGNMENT_INFLIGHT_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
};

const clearInflight = (key) => {
  if (typeof window === 'undefined') return;
  try {
    const map = getInflightMap();
    delete map[key];
    sessionStorage.setItem(ASSIGNMENT_INFLIGHT_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
};

const ExperimentContext = createContext();

export const ExperimentProvider = ({ children }) => {
  const { user } = useAuth();
  const [userId, setUserId] = useState(() => ensureExperimentUserId());
  const [assignments, setAssignments] = useState(() => readCachedAssignments());
  const [loadingKeys, setLoadingKeys] = useState({});
  const inflightRef = useRef({});

  useEffect(() => {
    if (user?.id) {
      const nextId = `user:${user.id}`;
      setUserId(nextId);
      localStorage.setItem('experimentUserId', nextId);

      // Clear cached assignments when identity changes so logged-in users get their own bucket.
      const cached = readCachedAssignments();
      const hasAssignments = Object.keys(cached || {}).length > 0;
      if (hasAssignments) {
        setAssignments({});
        writeCachedAssignments({});
      }
    }
  }, [user]);

  const assignVariant = async (experimentKey, options = {}) => {
    const key = (experimentKey || '').trim();
    if (!key) {
      return null;
    }

    const getAssignmentUserId = (assignment) =>
      assignment?.user_id ||
      assignment?.assignment?.user_identifier ||
      assignment?.assignment?.user_id ||
      '';

    const cachedAssignment = assignments[key];
    const shouldReassignForUser =
      Boolean(userId) &&
      userId.startsWith('user:') &&
      cachedAssignment &&
      getAssignmentUserId(cachedAssignment) &&
      getAssignmentUserId(cachedAssignment) !== userId;

    if (cachedAssignment && !options.force && !shouldReassignForUser) {
      return assignments[key];
    }

    const cached = readCachedAssignments();
    if (cached[key] && !options.force && !shouldReassignForUser) {
      setAssignments((prev) => ({ ...prev, [key]: cached[key] }));
      const cachedUserId = getAssignmentUserId(cached[key]);
      if (cachedUserId) {
        setUserId(cachedUserId);
        localStorage.setItem('experimentUserId', cachedUserId);
      }
      return cached[key];
    }

    const inflightMap = getInflightMap();
    const now = Date.now();
    const inFlightUntil = inflightMap[key] || 0;
    if (inFlightUntil && inFlightUntil > now && !options.force) {
      // Another render already requested; skip to avoid hammering backend.
      return cached[key] || null;
    }
    setInflight(key, now + 5000); // 5s guard window

    if (inflightRef.current[key]) {
      return inflightRef.current[key];
    }

    setLoadingKeys((prev) => ({ ...prev, [key]: true }));
    const shouldForceReassign = options.forceReassign || shouldReassignForUser;
    inflightRef.current[key] = (async () => {
      try {
        const result = await assignExperimentVariant(key, {
          requestPath: options.requestPath || (typeof window !== 'undefined' ? window.location.pathname : ''),
          userId,
          anonymousId: userId,
          forceReassign: shouldForceReassign,
        });

        if (result?.user_id) {
          setUserId(result.user_id);
          localStorage.setItem('experimentUserId', result.user_id);
        }

        setAssignments((prev) => {
          const next = { ...prev, [key]: result };
          writeCachedAssignments(next);
          return next;
        });
        return result;
      } finally {
        clearInflight(key);
        setLoadingKeys((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        inflightRef.current[key] = null;
      }
    })();

    return inflightRef.current[key];
  };

  const trackEvent = async (experimentKey, eventName, metadata = {}, variantKey) => {
    const key = (experimentKey || '').trim();
    if (!key || !eventName) {
      return null;
    }

    const knownVariant = variantKey || assignments[key]?.variant?.variant_key || assignments[key]?.variant?.VariantKey;
    return trackExperimentEvent(key, eventName, { ...metadata, experimentUserId: userId }, knownVariant);
  };

  const clearAssignment = (experimentKey) => {
    const key = (experimentKey || '').trim();
    if (!key) return;
    setAssignments((prev) => {
      const next = { ...prev };
      delete next[key];
      writeCachedAssignments(next);
      return next;
    });
    clearInflight(key);
  };

  const value = useMemo(() => ({
    userId,
    assignments,
    isAssigning: loadingKeys,
    getVariant: (key) => assignments[key]?.variant?.variant_key || null,
    assignVariant,
    trackEvent,
    clearAssignment,
  }), [assignments, loadingKeys, userId]);

  return (
    <ExperimentContext.Provider value={value}>
      {children}
    </ExperimentContext.Provider>
  );
};

export const useExperiments = () => {
  const context = useContext(ExperimentContext);
  if (!context) {
    throw new Error('useExperiments must be used within an ExperimentProvider');
  }
  return context;
};
