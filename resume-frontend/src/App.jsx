import React, { useEffect } from 'react';
import SEO from './components/SEO';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ResumeProvider } from './context/ResumeContext';
import { FeedbackProvider } from './context/FeedbackContext';
import { ExperimentProvider } from './context/ExperimentContext';
import Home from './components/Home';
import { LoginPage, BuilderPage, AdminMembershipPage, AdminExitAnalyticsPage, AdminExperimentsPage, AdminJobsPage, TermsOfServicePage, PrivacyPolicyPage, MembershipPage, GuidesPage, GuideDetailPage, HowToUseHiHiredPage, ContactPage, AdsRewardsPage, ClawPoolSupportPage, PressPage, NotFoundPage } from './pages';
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
  if (!CHAT_WIDGET_ENABLED) {
    return null;
  }

  // Chatbot is now visible to all users (logged in or not)
  // The ChatWidget handles prompting login when needed
  return <ChatWidget />;
}

function LegacyGuideRedirect() {
  const { slug } = useParams();
  return <Navigate to={slug ? `/ai-search/${slug}` : '/ai-search'} replace />;
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
                description="Build a professional, ATS-friendly resume in minutes with our free AI resume builder. No signup required. Choose templates, customize to job descriptions, and download as PDF."
                ogImage="https://hihired.org/og-image.png"
              />
              <Analytics />
              <SessionMonitor />
              <ExitTrackingBridge />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/builder" element={<BuilderPage />} />
                <Route path="/template" element={<Navigate to="/builder" replace />} />
                <Route path="/templates" element={<Navigate to="/builder" replace />} />
                <Route path="/templates," element={<Navigate to="/builder" replace />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/admin/analytics" element={<AdminExitAnalyticsPage />} />
                <Route path="/admin/experiments" element={<AdminExperimentsPage />} />
                <Route path="/admin/memberships" element={<AdminMembershipPage />} />
                <Route path="/admin/jobs" element={<AdminJobsPage />} />
                <Route path="/subscription/success" element={<SubscriptionSuccess />} />
                <Route path="/subscription/cancel" element={<SubscriptionCancel />} />
                <Route path="/terms" element={<TermsOfServicePage />} />
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/account" element={<MembershipPage />} />
                <Route path="/how-to-use-hihired" element={<HowToUseHiHiredPage />} />
                <Route path="/guides" element={<LegacyGuideRedirect />} />
                <Route path="/guides/:slug" element={<LegacyGuideRedirect />} />
                <Route path="/ai-search" element={<GuidesPage />} />
                <Route path="/ai-search/:slug" element={<GuideDetailPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/press" element={<PressPage />} />
                <Route path="/ads-rewards" element={<AdsRewardsPage />} />
                <Route path="/clawpool-support" element={<ClawPoolSupportPage />} />
                <Route path="/clawpool-support/" element={<ClawPoolSupportPage />} />
                <Route path="*" element={<NotFoundPage />} />
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
