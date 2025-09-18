import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircleIcon } from '@heroicons/react/24/solid';
import './SubscriptionCancel.css';

const SubscriptionCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="cancel-container">
      <div className="cancel-content">
        <XCircleIcon className="cancel-icon" />
        <h1>Payment Cancelled</h1>
        <p className="cancel-message">
          Your payment was cancelled and you have not been charged.
        </p>
        <div className="cancel-actions">
          <button onClick={() => navigate('/pricing')} className="btn-primary">
            View Plans Again
          </button>
          <button onClick={() => navigate('/')} className="btn-secondary">
            Go to Dashboard
          </button>
        </div>
        <p className="help-message">
          Need help? Contact our support team at support@resumeai.com
        </p>
      </div>
    </div>
  );
};

export default SubscriptionCancel;