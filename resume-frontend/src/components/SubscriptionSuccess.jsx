import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { getAPIBaseURL } from '../api';
import './SubscriptionSuccess.css';

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const confirmSession = async () => {
      if (!sessionId) {
        setError('Invalid session');
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('resumeToken');
        const res = await fetch(`${getAPIBaseURL()}/api/subscription/confirm`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ session_id: sessionId })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || 'Failed to verify payment');
        }
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to verify payment');
        setLoading(false);
      }
    };

    confirmSession();
  }, [sessionId]);

  useEffect(() => {
    // After confirmation finishes (or immediately if already done), return to prior page
    if (!loading && !error) {
      try {
        const ret = localStorage.getItem('postCheckoutReturn');
        if (ret) {
          localStorage.removeItem('postCheckoutReturn');
          navigate(ret, { replace: true });
        }
      } catch (e) {}
    }
  }, [loading, error, navigate]);

  if (loading) {
    return (
      <div className="success-container">
        <div className="success-content">
          <div className="spinner"></div>
          <p>Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="success-container">
        <div className="success-content">
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="success-container">
      <div className="success-content">
        <CheckCircleIcon className="success-icon" />
        <h1>Payment Successful!</h1>
        <p className="success-message">
          Thank you for subscribing! Your premium features are now active.
        </p>
        <div className="success-details">
          <p>You can now enjoy:</p>
          <ul>
            <li>Unlimited resume downloads</li>
            <li>AI-powered resume optimization</li>
            <li>Priority support</li>
            <li>Advanced templates</li>
          </ul>
        </div>
        <p className="redirect-message">
          You can close this tab or return to your previous page.
        </p>
        <button onClick={() => {
          try {
            const ret = localStorage.getItem('postCheckoutReturn');
            if (ret) {
              localStorage.removeItem('postCheckoutReturn');
              navigate(ret, { replace: true });
              return;
            }
          } catch (e) {}
          navigate(-1);
        }} className="btn-primary">
          Return to Previous Page
        </button>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;
