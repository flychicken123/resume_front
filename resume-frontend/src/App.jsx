import React, { useEffect } from 'react';
import SEO from './components/SEO';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ResumeProvider } from './context/ResumeContext';
import { FeedbackProvider } from './context/FeedbackContext';
import Home from './components/Home';
import { LoginPage, BuilderPage, AdminMembershipPage, AdminExitAnalyticsPage, TermsOfServicePage, PrivacyPolicyPage, MembershipPage, GuidesPage, GuideDetailPage } from './pages';
import PricingPage from './components/PricingPage';
import SubscriptionSuccess from './components/SubscriptionSuccess';
import SubscriptionCancel from './components/SubscriptionCancel';
import Analytics from './components/Analytics';
import SessionMonitor from './components/SessionMonitor';
import ChatWidget from './components/ChatWidget';
import { initExitTracking, setCurrentPage } from './utils/exitTracking';
import './App.css';

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

function App() {
  return (
    <AuthProvider>
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
              <Route path="/admin/memberships" element={<AdminMembershipPage />} />
              <Route path="/subscription/success" element={<SubscriptionSuccess />} />
              <Route path="/subscription/cancel" element={<SubscriptionCancel />} />
              <Route path="/terms" element={<TermsOfServicePage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/account" element={<MembershipPage />} />
              <Route path="/guides" element={<GuidesPage />} />
              <Route path="/guides/:slug" element={<GuideDetailPage />} />
              {/* Hidden - Apply to Jobs feature
              <Route path="/apply" element={<JobApplicationPage />} />
              */}
            </Routes>
            <ChatWidget />
          </FeedbackProvider>
        </Router>
      </ResumeProvider>
    </AuthProvider>
  );
}

export default App;
