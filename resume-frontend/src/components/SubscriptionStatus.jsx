import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const getAPIBaseURL = () => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8081';
    }
    return window.location.hostname === 'www.hihired.org' ? 'https://hihired.org' : window.location.origin;
  }
  return process.env.REACT_APP_API_URL || 'http://localhost:8081';
};

const SubscriptionStatus = ({ onLimitReached, minimal = false }) => {
  const { user } = useAuth();
  const [usage, setUsage] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasTriggeredModal, setHasTriggeredModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSubscriptionStatus();
    }
  }, [user]);

  // Trigger modal when limit is reached (only once)
  useEffect(() => {
    if (usage && !usage.can_generate && onLimitReached && !hasTriggeredModal) {
      setHasTriggeredModal(true);
      // Pass both usage and subscription so callers can render correct plan
      onLimitReached(usage, subscription);
    }
  }, [usage, subscription, onLimitReached, hasTriggeredModal]);

  const fetchSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('resumeToken');
      const response = await fetch(`${getAPIBaseURL()}/api/subscription/current`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
        setUsage(data.usage);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check usage before generating resume
  if (!user || loading || !usage || !subscription) {
    return null;
  }

  const planLabelOverrides = {
    premium: 'Premium Plan',
    ultimate: 'Ultimate Plan'
  };

  const planDisplayName = planLabelOverrides[subscription.plan_name] || subscription.display_name || (
    subscription.plan_name
      ? subscription.plan_name.charAt(0).toUpperCase() + subscription.plan_name.slice(1) + ' Plan'
      : 'Current Plan'
  );

  const usagePercentage = ((subscription.resume_limit - usage.remaining) / subscription.resume_limit) * 100;
  const isLimitReached = !usage.can_generate;
  // Hide the status component completely when limit is reached
  // The modal will be shown instead
  if (isLimitReached) {
    return null;
  }

  if (minimal) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex justify-between items-start mb-1">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            {planDisplayName}
          </h3>
          {!minimal && (
            <p className="text-xs text-gray-500 mt-1">
              {usage.remaining} of {subscription.resume_limit} resumes remaining
            </p>
          )}
        </div>
        {subscription.plan_name !== 'ultimate' && (
          <Link
            to="/pricing"
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Upgrade
          </Link>
        )}
      </div>

      {!minimal && (
        <>
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className={`h-2 rounded-full transition-all ${
                isLimitReached ? 'bg-red-500' : usagePercentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>

          {!isLimitReached && usagePercentage > 80 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-3">
              <p className="text-xs text-yellow-700">
                Running low! Only {usage.remaining} resumes left this {subscription.resume_period}.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SubscriptionStatus;

// Hook to check subscription before actions
export const useSubscriptionLimit = () => {
  const [canGenerate, setCanGenerate] = useState(true);
  const [checking, setChecking] = useState(false);

  const checkLimit = async () => {
    setChecking(true);
    try {
      const token = localStorage.getItem('resumeToken');
      if (!token) {
        setCanGenerate(true); // Allow non-authenticated users (they'll be limited server-side)
        return true;
      }

      const response = await fetch(`${getAPIBaseURL()}/api/subscription/check-limit`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCanGenerate(data.can_generate);
        return data.can_generate;
      }
    } catch (error) {
      console.error('Error checking limit:', error);
    } finally {
      setChecking(false);
    }
    return true; // Default to allowing if check fails
  };

  return { canGenerate, checking, checkLimit };
};

