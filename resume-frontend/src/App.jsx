import React, { useEffect } from 'react';
import SEO from './components/SEO';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ResumeProvider } from './context/ResumeContext';
import { FeedbackProvider } from './context/FeedbackContext';
import { ExperimentProvider } from './context/ExperimentContext';
import Home from './components/Home';
import { LoginPage, BuilderPage, AdminMembershipPage, AdminExitAnalyticsPage, AdminExperimentsPage, TermsOfServicePage, PrivacyPolicyPage, MembershipPage, GuidesPage, GuideDetailPage, ContactPage } from './pages';
import PricingPage from './components/PricingPage';
import SubscriptionSuccess from './components/SubscriptionSuccess';
import SubscriptionCancel from './components/SubscriptionCancel';
import Analytics from './components/Analytics';
import SessionMonitor from './components/SessionMonitor';
import ChatWidget from './components/ChatWidget';
import { initExitTracking, setCurrentPage } from './utils/exitTracking';
import './App.css';

const CHAT_WIDGET_ENABLED = true;

function ExitTrackingBridge() {
  const location = useLocation();

  useEffect(() => {
    initExitTracking();
  }, []);

  useEffect(() => {
    setCurrentPage(location.pathname, document.title || '');
  }, [location.pathname]);

  return null;
}

function ChatWidgetGate() {
  const { user, userEmail, token } = useAuth();

  const normalizedEmail = (userEmail || '').trim().toLowerCase();

  // Diagnostic logging to understand why the chat widget might be hidden in production
  try {
    // eslint-disable-next-line no-console
    console.log('[ChatWidgetGate] state', {
      CHAT_WIDGET_ENABLED,
      userEmail,
      normalizedEmail,
      hasToken: !!token,
      user,
      location: typeof window !== 'undefined' ? window.location.href : 'no-window',
    });
  } catch (_) {
    // ignore logging errors
  }

  if (!CHAT_WIDGET_ENABLED) {
    try {
      // eslint-disable-next-line no-console
      console.log('[ChatWidgetGate] widget disabled by flag');
    } catch (_) {}
    return null;
  }

  if (!userEmail) {
    try {
      // eslint-disable-next-line no-console
      console.log('[ChatWidgetGate] no userEmail available; chat hidden');
    } catch (_) {}
    return null;
  }

  const allowedEmails = ['harwtalk@gmail.com', 'flychicken1991@gmail.com'];

  if (!allowedEmails.includes(normalizedEmail)) {
    try {
      // eslint-disable-next-line no-console
      console.log('[ChatWidgetGate] email not in allowlist; got', normalizedEmail);
    } catch (_) {}
    return null;
  }

  try {
    // eslint-disable-next-line no-console
    console.log('[ChatWidgetGate] conditions satisfied; rendering ChatWidget');
  } catch (_) {}

  return <ChatWidget />;
}

function App() {
  return (
    <AuthProvider>
      <ExperimentProvider>
        <ResumeProvider>
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <FeedbackProvider>
              <SEO
                title="Free AI Resume Builder — Create Professional Resumes | HiHired"
                description="Build a professional, ATS-friendly resume in minutes with our free AI resume builder. No signup required. Choose templates, tailor to job descriptions, and download as PDF."
                ogImage="https://hihired.org/og-image.jpg"
              />
              <Analytics />
              <SessionMonitor />
              <ExitTrackingBridge />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/builder" element={<BuilderPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/admin/analytics" element={<AdminExitAnalyticsPage />} />
                <Route path="/admin/experiments" element={<AdminExperimentsPage />} />
                <Route path="/admin/memberships" element={<AdminMembershipPage />} />
                <Route path="/subscription/success" element={<SubscriptionSuccess />} />
                <Route path="/subscription/cancel" element={<SubscriptionCancel />} />
                <Route path="/terms" element={<TermsOfServicePage />} />
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/account" element={<MembershipPage />} />
                <Route path="/guides" element={<GuidesPage />} />
                <Route path="/guides/:slug" element={<GuideDetailPage />} />
                <Route path="/contact" element={<ContactPage />} />
              </Routes>
              <ChatWidgetGate />
            </FeedbackProvider>
          </Router>
        </ResumeProvider>
      </ExperimentProvider>
    </AuthProvider>
  );
}

export default App;
