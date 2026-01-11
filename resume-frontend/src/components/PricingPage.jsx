import React, { useState, useEffect, useMemo } from 'react';

import { useNavigate } from 'react-router-dom';

import { CheckIcon } from '@heroicons/react/24/solid';

import { useAuth } from '../context/AuthContext';

import Navigation from './Navigation';

import './PricingPage.css';

const DEFAULT_PLAN_DETAILS = {

  free: {

    name: 'Free',

    price: '$0',

    period: '/forever',

    color: 'gray',

    features: [

      '1 resume per week'

    ],

    buttonText: 'Select Free',

    popular: false

  },

  premium: {

    name: 'Premium',

    price: '$7.99',

    period: '/month',

    color: 'blue',

    features: [

      '30 resumes per month',

      'AI-generated cover letters included'

    ],

    buttonText: 'Get Premium',

    popular: true

  },

  ultimate: {

    name: 'Ultimate',

    price: '$29.99',

    period: '/month',

    color: 'purple',

    features: [

      '300 resumes per month',

      '24 hours online support'

    ],

    buttonText: 'Get Ultimate',

    popular: false

  }

};

const PLAN_KEYS = ['free', 'premium', 'ultimate'];

// Introductory pricing settings used for display only.

// The backend + Stripe apply the intro month discount via a one-time coupon.

const INTRO_PRICING = {

  premium: { firstMonth: '$1.99', thereafter: '$7.99' },

  ultimate: { firstMonth: '$6.99', thereafter: '$29.99' },

};

const getAPIBaseURL = () => {

  if (typeof window !== 'undefined') {

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {

      return 'http://localhost:8081';

    }

    return window.location.hostname === 'www.hihired.org' ? 'https://hihired.org' : window.location.origin;

  }

  return process.env.REACT_APP_API_URL || 'http://localhost:8081';

};

const PricingPage = () => {

  const navigate = useNavigate();

  const { user } = useAuth();

  const [plans, setPlans] = useState([]);

  const [currentPlan, setCurrentPlan] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    fetchPlans();

    if (user) {

      fetchCurrentSubscription();

    }

  }, [user]);

  const fetchPlans = async () => {

    try {

      const response = await fetch(`${getAPIBaseURL()}/api/plans`);

      const data = await response.json();

      setPlans(data.plans || []);

    } catch (error) {

      console.error('Error fetching plans:', error);

    } finally {

      setLoading(false);

    }

  };

  const [subscriptionData, setSubscriptionData] = useState(null);

  const fetchCurrentSubscription = async () => {

    try {

      const token = localStorage.getItem('resumeToken');

      const response = await fetch(`${getAPIBaseURL()}/api/subscription/current`, {

        headers: {

          'Authorization': `Bearer ${token}`

        }

      });

      const data = await response.json();

      // Store full subscription data

      setSubscriptionData(data);

      // Set the current plan from the subscription data

      if (data.subscription && data.subscription.plan_name) {

        setCurrentPlan(data.subscription.plan_name);

      } else {

        setCurrentPlan('free');

      }

    } catch (error) {

      console.error('Error fetching current subscription:', error);

      setCurrentPlan('free');

      setSubscriptionData(null);

    }

  };

  const handleSelectPlan = async (planName) => {

    if (!user) {

      // Redirect to login with return URL

      navigate('/login?return=/pricing');

      return;

    }
    const normalizedPlan = (planName || '').toLowerCase();
    const normalizedCurrent = (currentPlan || '').toLowerCase();

    if (normalizedPlan && normalizedPlan === normalizedCurrent) {
      alert('You are already on this plan!');
      return;
    }

    if (normalizedCurrent === 'ultimate' && normalizedPlan === 'premium') {
      if (!window.confirm('Switch to the Premium plan? This change takes effect immediately and upcoming invoices will use the Premium price.')) {
        return;
      }

      setLoading(true);
      try {
        const token = localStorage.getItem('resumeToken');
        const response = await fetch(`${getAPIBaseURL()}/api/subscription/change-plan`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ plan_name: planName })
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const message = data?.error || 'Failed to update subscription. Please try again.';
          alert(message);
        } else {
          alert('Your subscription has been updated to the Premium plan.');
          fetchCurrentSubscription();
        }
      } catch (error) {
        console.error('Error changing subscription plan:', error);
        alert('Failed to update subscription. Please try again.');
      } finally {
        setLoading(false);
      }

      return;
    }

    if (normalizedPlan === 'free' && normalizedCurrent === 'free') {

      alert('You are already on the free plan!');

      return;

    }

    if (normalizedPlan === 'free' && (normalizedCurrent === 'premium' || normalizedCurrent === 'ultimate')) {

      // Handle downgrade to free plan

      let endDateMessage = '';

      if (subscriptionData && subscriptionData.usage && subscriptionData.usage.reset_date) {

        const endDate = new Date(subscriptionData.usage.reset_date);

        const formattedDate = endDate.toLocaleDateString('en-US', {

          year: 'numeric',

          month: 'long',

          day: 'numeric'

        });

        endDateMessage = `\n\nYour ${currentPlan} access will continue until ${formattedDate}.`;

      }

      if (window.confirm(`Are you sure you want to downgrade to the free plan? You will lose access to premium features at the end of your billing period.${endDateMessage}`)) {

        try {

          const token = localStorage.getItem('resumeToken');

          const response = await fetch(`${getAPIBaseURL()}/api/subscription/cancel`, {

            method: 'POST',

            headers: {

              'Authorization': `Bearer ${token}`,

              'Content-Type': 'application/json'

            }

          });

          if (response.ok) {

            let successMessage = 'Your subscription will be cancelled at the end of the billing period.';

            if (subscriptionData && subscriptionData.usage && subscriptionData.usage.reset_date) {

              const endDate = new Date(subscriptionData.usage.reset_date);

              const formattedDate = endDate.toLocaleDateString('en-US', {

                year: 'numeric',

                month: 'long',

                day: 'numeric'

              });

              successMessage = `Your subscription has been cancelled. You will continue to have ${currentPlan} access until ${formattedDate}.`;

            }

            alert(successMessage);

            fetchCurrentSubscription();

          } else {

            alert('Failed to cancel subscription. Please try again.');

          }

        } catch (error) {

          console.error('Error cancelling subscription:', error);

          alert('Failed to cancel subscription. Please try again.');

        }

      }

      return;

    }

    setLoading(true);

    try {

      // Persist the page to return to after successful checkout

      try {

        const urlParams = new URLSearchParams(window.location.search);

        const preferredReturn = urlParams.get('return');

        const currentPath = preferredReturn || (window.location.pathname + window.location.search);

        localStorage.setItem('postCheckoutReturn', currentPath);

      } catch (e) {}

      const token = localStorage.getItem('resumeToken');

      const response = await fetch(`${getAPIBaseURL()}/api/subscription/checkout`, {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json',

          'Authorization': `Bearer ${token}`

        },

        body: JSON.stringify({ plan_name: planName })

      });

      const data = await response.json();

      if (data.checkout_url) {

        // Redirect to Stripe checkout

        window.location.href = data.checkout_url;

      } else {

        alert('Failed to create checkout session');

      }

    } catch (error) {

      console.error('Error creating checkout:', error);

      alert('Failed to start subscription process');

    } finally {

      setLoading(false);

    }

  };

    const planDataMap = useMemo(() => {

    const map = {};

    (plans || []).forEach((plan) => {

      if (!plan || !plan.name) {

        return;

      }

      map[String(plan.name).toLowerCase()] = plan;

    });

    return map;

  }, [plans]);

  const planDetails = useMemo(() => {

    const details = {};

    PLAN_KEYS.forEach((key) => {

      const base = DEFAULT_PLAN_DETAILS[key];

      const planData = planDataMap[key];

      const price =

        planData && typeof planData.price === 'number' && !Number.isNaN(planData.price)

          ? `$${planData.price.toFixed(2)}`

          : base.price;

      const derivePeriod = () => {

        if (!planData || !planData.resume_period) {

          if (base.period && base.period.startsWith('/')) {

            return { periodText: base.period, limitUnit: base.period.slice(1) };

          }

          return { periodText: base.period || '', limitUnit: '' };

        }

        const normalized = String(planData.resume_period).toLowerCase();

        switch (normalized) {

          case 'monthly':

            return { periodText: '/month', limitUnit: 'month' };

          case 'weekly':

            return { periodText: '/week', limitUnit: 'week' };

          case 'yearly':

            return { periodText: '/year', limitUnit: 'year' };

          case 'daily':

            return { periodText: '/day', limitUnit: 'day' };

          default:

            return { periodText: `/${normalized}`, limitUnit: normalized };

        }

      };

      const { periodText, limitUnit } = derivePeriod();

      // Canonical features per plan to prevent accidental leakage of higher-tier perks

      const canonicalFeatures = {

        free: [

          '1 resume per week',

          'Basic templates',

          'PDF export',

          'Email support',

        ],

        premium: [

          '30 resumes per month',

          'AI-generated cover letters included',

        ],

        ultimate: [

          '300 resumes per month',

          '24 hours online support',

        ],

      };

      let features = canonicalFeatures[key] ? [...canonicalFeatures[key]] : [...base.features];

      // Ensure key benefits are present even if API provides features

      // Remove any accidental or conflicting features (defense-in-depth if API merges in future)

      const disallowMap = {

        premium: ['all templates', 'pdf & word export', 'custom branding', 'resume analytics', 'priority support', '2 resume', '2 resumes'],

        free: ['all templates', 'pdf & word export', 'custom branding', 'resume analytics', 'priority support'],

      };

      const toRemove = disallowMap[key] || [];

      features = features.filter((f) => {

        const lf = String(f).toLowerCase();

        return !toRemove.some((bad) => lf.includes(bad));

      });

      // Only inject derived limit label for Free; Premium/Ultimate use canonical counts

      if (key === 'free') {

        const limitValue =

          planData && planData.resume_limit !== undefined ? Number(planData.resume_limit) : Number.NaN;

        if (!Number.isNaN(limitValue) && limitValue > 0 && limitUnit) {

          const noun = limitValue === 1 ? 'resume' : 'resumes';

          const limitLabel = `${limitValue} ${noun} per ${limitUnit}`;

          const lowerFeatures = features.map((item) => String(item).toLowerCase());

          if (!lowerFeatures.includes(limitLabel.toLowerCase())) {

            features = [limitLabel, ...features];

          }

        }

      }

      details[key] = {

        ...base,

        price,

        period: periodText || base.period,

        features,

      };

    });

    return details;

  }, [planDataMap]);

  if (loading) {

    return (

      <div className="pricing-container">

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>

          <div style={{ textAlign: 'center' }}>

            <div style={{

              width: '48px',

              height: '48px',

              border: '3px solid #3b82f6',

              borderTopColor: 'transparent',

              borderRadius: '50%',

              margin: '0 auto 16px',

              animation: 'spin 1s linear infinite'

            }}></div>

            <p style={{ color: '#6b7280' }}>Loading pricing...</p>

          </div>

        </div>

      </div>

    );

  }

  return (

    <div className="pricing-page">

      <Navigation />

      <div className="pricing-container">

        <div className="pricing-wrapper">

          {/* Header */}

          <div className="pricing-header">

            <h1 className="pricing-title">Choose Your Plan</h1>

            <p className="pricing-subtitle">

              Pick the resume limit that fits your workflow

            </p>

          </div>

        {/* Pricing Cards */}

        <div className="pricing-cards">

          {PLAN_KEYS.map((planKey) => {

            const plan = planDetails[planKey];
            const normalizedCurrentPlan = (currentPlan || '').toLowerCase();
            const normalizedPlanKey = planKey.toLowerCase();
            const isCurrentPlan = normalizedCurrentPlan === normalizedPlanKey;
            const isPaidDowngrade = normalizedCurrentPlan === 'ultimate' && normalizedPlanKey === 'premium';
            const isDowngrade = ((normalizedCurrentPlan === 'premium' || normalizedCurrentPlan === 'ultimate') && normalizedPlanKey === 'free') || isPaidDowngrade;

            return (

              <div

                key={planKey}

                className={`pricing-card ${plan.popular ? 'popular' : ''}`}

              >

                {plan.popular && (

                  <div className="popular-badge">MOST POPULAR</div>

                )}

                <div className="pricing-card-content">

                  <h3 className="plan-name">{plan.name}</h3>

                  <div className="price-container">

                    <span className="price">{plan.price}</span>

                    <span className="price-period">{plan.period}</span>

                  </div>

                  {(planKey === 'premium' || planKey === 'ultimate') && (

                    <div className="intro-note">

                      First month {INTRO_PRICING[planKey].firstMonth}, then {INTRO_PRICING[planKey].thereafter}/month

                    </div>

                  )}

                  <ul className="features-list">

                    {plan.features.map((feature, idx) => (

                      <li key={idx} className="feature-item">

                        <CheckIcon className="feature-check" />

                        <span className="feature-text">{feature}</span>

                      </li>

                    ))}

                  </ul>

                  <button

                    onClick={() => handleSelectPlan(planKey)}

                    disabled={isCurrentPlan && !isDowngrade}

                    className={`plan-button ${planKey} ${isDowngrade ? 'downgrade' : ''}`}

                  >

                    {isCurrentPlan ? 'Current Plan' :

                     (currentPlan === 'premium' || currentPlan === 'ultimate') && planKey === 'free' ? 'Downgrade' :

                     (currentPlan === 'ultimate' && planKey === 'premium') ? 'Downgrade' :

                     (currentPlan === 'free' && (planKey === 'premium' || planKey === 'ultimate')) ? 'Upgrade' :

                     plan.buttonText}

                  </button>

                </div>

              </div>

            );

          })}

        </div>

        {/* Features Comparison */}

        <div className="all-plans-section">

          <h2 className="section-title">All Plans Include</h2>

          <div className="features-grid">

            <div className="feature-card">

              <div className="feature-icon-container blue">

                <svg className="feature-icon blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />

                </svg>

              </div>

              <h3 className="feature-title">Professional Templates</h3>

              <p className="feature-description">Access to beautifully designed resume templates</p>

            </div>

            <div className="feature-card">

              <div className="feature-icon-container green">

                <svg className="feature-icon green" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />

                </svg>

              </div>

              <h3 className="feature-title">AI-Powered</h3>

              <p className="feature-description">Smart suggestions and content optimization</p>

            </div>

            <div className="feature-card">

              <div className="feature-icon-container purple">

                <svg className="feature-icon purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />

                </svg>

              </div>

              <h3 className="feature-title">Secure & Private</h3>

              <p className="feature-description">Your data is encrypted and never shared</p>

            </div>

          </div>

        </div>

        {/* FAQ Section */}

        <div className="faq-section">

          <h2 className="faq-title">Frequently Asked Questions</h2>

          <div className="faq-list">

            <div className="faq-item">

              <h3 className="faq-question">Can I cancel anytime?</h3>

              <p className="faq-answer">Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.</p>

            </div>

            <div className="faq-item">

              <h3 className="faq-question">Do unused resumes roll over?</h3>

              <p className="faq-answer">No, unused resumes do not roll over to the next period. Your limit resets at the beginning of each billing cycle.</p>

            </div>

            <div className="faq-item">

              <h3 className="faq-question">Is there a free trial?</h3>

              <p className="faq-answer">Yes! All paid plans come with a 7-day free trial. You won't be charged until the trial ends.</p>

            </div>

            <div className="faq-item">

              <h3 className="faq-question">What payment methods do you accept?</h3>

              <p className="faq-answer">We accept all major credit cards, debit cards, and PayPal through our secure payment processor, Stripe.</p>

            </div>

          </div>

        </div>

      </div>

    </div>

  </div>

  );

};

export default PricingPage;
