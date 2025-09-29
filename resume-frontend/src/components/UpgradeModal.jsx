import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';

const getAPIBaseURL = () => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8081';
    }
    return window.location.hostname === 'www.hihired.org' ? 'https://hihired.org' : window.location.origin;
  }
  return process.env.REACT_APP_API_URL || 'http://localhost:8081';
};

const UpgradeModal = ({ isOpen, onClose, currentPlan = 'free', usage = {} }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    onClose();
    try {
      const currentPath = window.location.pathname + window.location.search;
      localStorage.setItem('postCheckoutReturn', currentPath);
    } catch (e) {}
    const returnParam = encodeURIComponent(typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/');
    navigate(`/pricing?return=${returnParam}`);
  };

  const getTimeUntilReset = () => {
    if (!usage.reset_date) return '';
    const resetDate = new Date(usage.reset_date);
    const now = new Date();
    const diffTime = Math.abs(resetDate - now);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

    if (diffDays > 1) return `${diffDays} days`;
    if (diffHours > 1) return `${diffHours} hours`;
    return 'soon';
  };

  const plans = {
    free: {
      name: 'Free',
      limit: '1 resume per week',
      price: '$0',
      period: ''
    },
    premium: {
      name: 'Premium',
      limit: '30 resumes per month',
      price: '$7.99',
      period: '/month',
      features: [
        '30 resumes per month',
        'AI-generated cover letters included'
      ]
    },
    ultimate: {
      name: 'Ultimate',
      limit: '300 resumes per month',
      price: '$29.99',
      period: '/month',
      features: [
        '300 resumes per month',
        '24 hours online support'
      ]
    }
  };
  const startCheckout = async (planName) => {
    try {
      const token = localStorage.getItem('resumeToken');
      if (!token) {
        navigate('/login?return=/pricing');
        return;
      }
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const preferredReturn = urlParams.get('return');
        const currentPath = preferredReturn || (window.location.pathname + window.location.search);
        localStorage.setItem('postCheckoutReturn', currentPath);
      } catch (e) {}
      const res = await fetch(`${getAPIBaseURL()}/api/subscription/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan_name: planName })
      });
      const data = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        navigate('/pricing');
      }
    } catch (e) {
      navigate('/pricing');
    }
  };

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 300,
    padding: '16px'
  };

  const modalStyle = {
    background: 'white',
    borderRadius: '16px',
    maxWidth: '640px',
    width: '100%',
    padding: '24px',
    position: 'relative',
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
  };

  const closeBtnStyle = {
    position: 'absolute',
    top: '12px',
    right: '12px',
    padding: '8px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer'
  };

  const primaryBtnStyle = {
    flex: 1,
    padding: '10px 16px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600
  };

  const secondaryBtnStyle = {
    flex: 1,
    padding: '10px 16px',
    background: 'white',
    color: '#111827',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer'
  };

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true">
      <div style={modalStyle}>
        <button onClick={onClose} aria-label="Close" style={closeBtnStyle}>
          <XMarkIcon width={20} height={20} color="#6b7280" />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{
            width: '64px', height: '64px', margin: '0 auto 12px',
            background: '#fee2e2', borderRadius: '9999px', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
            Resume Limit Reached
          </h2>

          <p style={{ color: '#6b7280', margin: 0 }}>
            You've reached your {plans[currentPlan]?.limit || 'resume generation'} limit.
          </p>

          {usage.reset_date && (
            <p style={{ color: '#9ca3af', marginTop: '8px', fontSize: '12px' }}>
              Your limit will reset in {getTimeUntilReset()}
            </p>
          )}
        </div>

        <div style={{ background: '#f0f7ff', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
          <h3 style={{ fontWeight: 600, color: '#111827', margin: '0 0 10px' }}>
            Upgrade to Continue Creating Resumes
          </h3>

          <div style={{ display: 'grid', gap: '12px' }}>
            {currentPlan === 'free' && (
            <div style={{ background: 'white', borderRadius: '10px', padding: '12px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 600, color: '#111827' }}>Premium Plan</h4>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>30 resumes per month</p>
                  <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none' }}>
                    {plans.premium.features.map((feature, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: '#6b7280' }}>
                        <CheckIcon width={12} height={12} color="#10b981" style={{ marginRight: 4 }} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#2563eb' }}>$7.99</p>
                  <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px' }}>{plans.premium.period}</p>
                  <p style={{ margin: 0, color: '#2563eb', fontSize: '12px', fontWeight: 600 }}>First month $1.99</p>
                </div>
              </div>
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button onClick={() => startCheckout('premium')} style={{...primaryBtnStyle, flex: '0 0 auto', padding: '8px 12px'}}>Get Premium</button>
              </div>
            </div>
            )}

            {currentPlan === 'free' && (
            <div style={{ background: 'white', borderRadius: '10px', padding: '12px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 600, color: '#111827' }}>Ultimate Plan</h4>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '12px' }}>300 resumes per month</p>
                  <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none' }}>
                    {plans.ultimate.features.map((feature, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: '#6b7280' }}>
                        <CheckIcon width={12} height={12} color="#10b981" style={{ marginRight: 4 }} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#7c3aed' }}>$29.99</p>
                  <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px' }}>{plans.ultimate.period}</p>
                  <p style={{ margin: 0, color: '#7c3aed', fontSize: '12px', fontWeight: 600 }}>First month $6.99</p>
                </div>
              </div>
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button onClick={() => startCheckout('ultimate')} style={{...primaryBtnStyle, background: '#7c3aed', flex: '0 0 auto', padding: '8px 12px'}}>Get Ultimate</button>
              </div>
            </div>
            )}

          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onClose} style={secondaryBtnStyle}>Maybe Later</button>
          <button onClick={handleUpgrade} style={primaryBtnStyle}>View Plans</button>
        </div>

        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '12px', marginTop: '12px' }}>
          7-day free trial • Cancel anytime • Secure payment
        </p>
      </div>
    </div>
  );
};

export default UpgradeModal;




