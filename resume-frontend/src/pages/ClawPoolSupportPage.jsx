import React from 'react';
import SEO from '../components/SEO';

const sectionStyle = {
  marginTop: '2rem',
  marginBottom: '0.75rem',
  fontSize: '1.75rem',
  fontWeight: 700,
  color: '#111827',
};

const pStyle = {
  color: '#475569',
  lineHeight: 1.7,
  marginBottom: '1rem',
};

const linkStyle = {
  color: '#2563eb',
  fontWeight: 600,
};

const ClawPoolSupportPage = () => (
  <div style={{ padding: '60px 20px', maxWidth: '960px', margin: '0 auto' }}>
    <SEO
      title="ClawPool Support"
      description="Get help with ClawPool subscriptions, billing, account access, and technical support."
      keywords="ClawPool support, ClawPool help, subscription support, billing help, privacy, terms"
      canonical="https://clawpool.hihired.org/"
    />

    <h1 style={{ fontSize: '2.75rem', fontWeight: 800, marginBottom: '1.5rem', color: '#0f172a' }}>
      ClawPool Support
    </h1>

    <p style={pStyle}>
      Need help with ClawPool? This page covers account access, subscriptions, billing, privacy questions,
      and general technical support for the iOS app.
    </p>

    <h2 style={sectionStyle}>Contact Support</h2>
    <p style={pStyle}>
      For general support, billing issues, subscription questions, or App Store related problems, email{' '}
      <a href="mailto:support@hihired.org" style={linkStyle}>support@hihired.org</a>.
    </p>
    <p style={pStyle}>
      We usually respond within 1 to 2 business days.
    </p>

    <h2 style={sectionStyle}>What We Can Help With</h2>
    <ul style={{ ...pStyle, marginLeft: '1.25rem' }}>
      <li>Account sign-in issues</li>
      <li>Subscription purchase or renewal problems</li>
      <li>Billing and cancellation questions</li>
      <li>AI chat or container access issues</li>
      <li>Bug reports and feature feedback</li>
      <li>Privacy and data deletion requests</li>
    </ul>

    <h2 style={sectionStyle}>Subscription Support</h2>
    <p style={pStyle}>
      ClawPool subscriptions on iOS are billed through Apple In-App Purchase and renew automatically unless
      canceled at least 24 hours before the end of the current billing period.
    </p>
    <p style={pStyle}>
      You can manage or cancel your subscription from your iPhone settings under Apple ID → Subscriptions.
    </p>

    <h2 style={sectionStyle}>Privacy</h2>
    <p style={pStyle}>
      ClawPool includes AI-powered features. If you have questions about how data is processed or want to
      request deletion, email <a href="mailto:privacy@hihired.org" style={linkStyle}>privacy@hihired.org</a>.
    </p>
    <p style={pStyle}>
      Privacy Policy: <a href="https://hihired.org/privacy" style={linkStyle}>https://hihired.org/privacy</a>
    </p>

    <h2 style={sectionStyle}>Terms</h2>
    <p style={pStyle}>
      Terms of Use: <a href="https://hihired.org/terms" style={linkStyle}>https://hihired.org/terms</a>
    </p>

    <h2 style={sectionStyle}>Before Contacting Support</h2>
    <ul style={{ ...pStyle, marginLeft: '1.25rem' }}>
      <li>Make sure your app is updated to the latest version.</li>
      <li>Include your device model and iOS version.</li>
      <li>Describe the issue and include screenshots if possible.</li>
      <li>For billing issues, include the subscription tier and approximate purchase time.</li>
    </ul>

    <hr style={{ margin: '3rem 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />
    <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
      Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
    </p>
  </div>
);

export default ClawPoolSupportPage;
