import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const PrivacyPolicy = () => (
  <div style={{ padding: '60px 20px', maxWidth: '960px', margin: '0 auto' }}>
    <SEO
      title="Privacy Policy | HiHired Resume Builder & Auto-Fill Data Practices"
      description="Learn how HiHired on hihired.org protects data used by the AI resume builder, AI cover letter tools, and Chrome auto-fill extension."
      keywords="privacy policy, HiHired privacy, hihired.org privacy, resume data security, auto-fill extension privacy, AI resume builder privacy, GDPR, CCPA"
      canonical="https://hihired.org/privacy"
    />
    <h1 style={{ fontSize: '2.75rem', fontWeight: 800, marginBottom: '1.5rem', color: '#0f172a' }}>
      Privacy Policy
    </h1>
    <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: '1.5rem' }}>
      HiHired (“we”, “us”, or “our”) is committed to respecting your privacy. This Privacy Policy explains
      how we collect, use, share, and safeguard personal information when you access our AI resume builder,
      related websites, mobile experiences, and APIs (collectively, the “Services”).
    </p>

    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '2rem', marginBottom: '0.75rem', color: '#111827' }}>
      1. Information We Collect
    </h2>
    <ul style={{ color: '#475569', lineHeight: 1.7, marginLeft: '1.25rem' }}>
      <li><strong>Account & Contact Data:</strong> Name, email, authentication tokens, and billing information.</li>
      <li><strong>Resume Content:</strong> Work history, education, skills, uploaded files, and AI-generated drafts.</li>
      <li><strong>Usage & Device Data:</strong> Log files, IP addresses, browser type, interactions, and cookies.</li>
      <li><strong>Feedback & Support:</strong> Messages submitted through surveys, chat, or support channels.</li>
    </ul>

    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '2rem', marginBottom: '0.75rem', color: '#111827' }}>
      2. How We Use Information
    </h2>
    <ul style={{ color: '#475569', lineHeight: 1.7, marginLeft: '1.25rem' }}>
      <li>Provide, personalize, and maintain the Services, including AI-powered suggestions and formatting.</li>
      <li>Communicate with you about features, security alerts, technical notices, and administrative messages.</li>
      <li>Improve our machine learning models, analytics, and product roadmap.</li>
      <li>Detect, investigate, and prevent fraud, abuse, or security incidents.</li>
      <li>Comply with legal obligations and enforce our <Link to="/terms">Terms of Service</Link>.</li>
      <li><strong>Commercialize insights:</strong> We may create and offer aggregate or de-identified insights,
        benchmarking reports, or recruiting services derived from user data, which may generate revenue for HiHired.</li>
    </ul>

    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '2rem', marginBottom: '0.75rem', color: '#111827' }}>
      3. How We Share Information
    </h2>
    <ul style={{ color: '#475569', lineHeight: 1.7, marginLeft: '1.25rem' }}>
      <li>
        <strong>Vendors & Service Providers:</strong> We share data with trusted partners who help operate our
        infrastructure, analytics, customer support, payments, and AI stack under strict confidentiality.
      </li>
      <li>
        <strong>Analytics & Research:</strong> We may share aggregated or de-identified data with employers,
        training platforms, or market researchers for benchmarking or trend analysis.
      </li>
      <li>
        <strong>Business Transfers:</strong> If we are involved in a merger, acquisition, or asset sale, data may be
        transferred as part of that transaction, subject to this Policy.
      </li>
      <li>
        <strong>Legal Compliance:</strong> We may disclose information if required by law or to protect our rights,
        users, or the public.
      </li>
    </ul>
    <p style={{ color: '#475569', lineHeight: 1.7 }}>
      We do <strong>not</strong> sell personally identifiable information to data brokers. Any profit derived from data
      is based on aggregated, anonymized, or de-identified insights, unless you provide explicit consent.
    </p>

    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '2rem', marginBottom: '0.75rem', color: '#111827' }}>
      4. Cookies & Tracking
    </h2>
    <p style={{ color: '#475569', lineHeight: 1.7 }}>
      We use cookies, SDKs, and similar technologies to keep you signed in, understand usage patterns, and
      personalize content. You can adjust cookie preferences through your browser settings; disabling cookies
      may limit certain features.
    </p>

    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '2rem', marginBottom: '0.75rem', color: '#111827' }}>
      5. Data Retention
    </h2>
    <p style={{ color: '#475569', lineHeight: 1.7 }}>
      We retain personal information for as long as your account is active or as needed to provide the Services.
      We may retain aggregated or de-identified data for research and product development. You may request
      deletion of your account and resume data by contacting{' '}
      <a href="mailto:privacy@hihired.org" style={{ color: '#2563eb', fontWeight: 600 }}>privacy@hihired.org</a>.
    </p>

    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '2rem', marginBottom: '0.75rem', color: '#111827' }}>
      6. Your Choices & Rights
    </h2>
    <ul style={{ color: '#475569', lineHeight: 1.7, marginLeft: '1.25rem' }}>
      <li>Access, update, or delete your profile data via account settings or by contacting us.</li>
      <li>Opt out of marketing emails by using the unsubscribe link or emailing support.</li>
      <li>Request a copy of the personal information we maintain about you.</li>
      <li>For residents of certain jurisdictions, additional rights may apply (e.g., GDPR, CCPA).</li>
    </ul>

    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '2rem', marginBottom: '0.75rem', color: '#111827' }}>
      7. Security
    </h2>
    <p style={{ color: '#475569', lineHeight: 1.7 }}>
      We employ administrative, technical, and physical safeguards designed to protect personal information.
      However, no method of transmission or storage is completely secure, and we cannot guarantee absolute
      security.
    </p>

    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '2rem', marginBottom: '0.75rem', color: '#111827' }}>
      8. International Users
    </h2>
    <p style={{ color: '#475569', lineHeight: 1.7 }}>
      HiHired is operated from the United States. By using the Services you consent to the transfer and
      processing of your information in the U.S. and any other country where we operate or engage service
      providers.
    </p>

    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '2rem', marginBottom: '0.75rem', color: '#111827' }}>
      9. Chrome Extension
    </h2>
    <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: '0.75rem' }}>
      The HiHired Auto-Fill Chrome Extension accesses the following data solely to provide autofill functionality:
    </p>
    <ul style={{ color: '#475569', lineHeight: 1.7, marginLeft: '1.25rem', marginBottom: '0.75rem' }}>
      <li><strong>Active tab content:</strong> Read only when you click the extension button. We extract job application form fields to auto-fill them with your resume data. We do not collect or transmit page content to our servers.</li>
      <li><strong>Resume data:</strong> Retrieved from hihired.org when you log in. Stored locally in Chrome storage and only sent to hihired.org servers.</li>
      <li><strong>Job preferences:</strong> Saved locally and synced to your hihired.org account. Used to auto-fill EEO fields (gender, race, veteran status) on job applications.</li>
    </ul>
    <p style={{ color: '#475569', lineHeight: 1.7 }}>
      The extension does <strong>not</strong> collect browsing history, track websites you visit, or share any
      data with third parties. All data is transmitted exclusively between your browser and hihired.org servers
      over HTTPS.
    </p>

    <section style={{ marginTop: '2rem', padding: '24px', borderRadius: '24px', border: '1px solid #dbeafe', background: '#f8fbff' }}>
      <p style={{ margin: '0 0 10px', color: '#2563eb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8rem' }}>
        Related HiHired resources
      </p>
      <h2 style={{ margin: '0 0 12px', fontSize: '1.8rem', color: '#0f172a' }}>
        Learn how HiHired handles resume building, cover letters, and auto-fill
      </h2>
      <p style={{ margin: '0 0 18px', color: '#475569', lineHeight: 1.7 }}>
        If you are reviewing privacy before signing up, these pages explain the core HiHired workflows on hihired.org that this policy applies to.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <Link to="/guides/best-free-ai-resume-builder-2026" style={{ display: 'block', padding: '18px', borderRadius: '18px', background: '#ffffff', border: '1px solid #dbeafe', textDecoration: 'none' }}>
          <p style={{ margin: '0 0 8px', color: '#2563eb', fontWeight: 700 }}>free AI resume builder guide</p>
          <p style={{ margin: 0, color: '#334155', lineHeight: 1.6 }}>See how HiHired stores and uses resume data inside its ATS-focused resume builder workflow.</p>
        </Link>
        <Link to="/guides/auto-fill-job-applications-chrome-extension" style={{ display: 'block', padding: '18px', borderRadius: '18px', background: '#ffffff', border: '1px solid #dbeafe', textDecoration: 'none' }}>
          <p style={{ margin: '0 0 8px', color: '#2563eb', fontWeight: 700 }}>job application auto-fill guide</p>
          <p style={{ margin: 0, color: '#334155', lineHeight: 1.6 }}>Review how the HiHired Chrome extension reads form fields and fills job applications from saved profile data.</p>
        </Link>
        <Link to="/guides/ai-resume-builder-with-cover-letter" style={{ display: 'block', padding: '18px', borderRadius: '18px', background: '#ffffff', border: '1px solid #dbeafe', textDecoration: 'none' }}>
          <p style={{ margin: '0 0 8px', color: '#2563eb', fontWeight: 700 }}>AI resume builder with cover letter</p>
          <p style={{ margin: 0, color: '#334155', lineHeight: 1.6 }}>Understand how HiHired reuses the same resume context and job details to produce a matching AI cover letter.</p>
        </Link>
      </div>
    </section>

    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '2rem', marginBottom: '0.75rem', color: '#111827' }}>
      10. Changes to this Policy
    </h2>
    <p style={{ color: '#475569', lineHeight: 1.7 }}>
      We may update this Privacy Policy from time to time. The “Last updated” date below reflects the
      effective date of the current version. Material changes will be posted on this page or communicated via
      email or in-product notification.
    </p>

    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '2rem', marginBottom: '0.75rem', color: '#111827' }}>
      11. Contact Us
    </h2>
    <p style={{ color: '#475569', lineHeight: 1.7 }}>
      For privacy-related questions or requests, please contact{' '}
      <a href="mailto:privacy@hihired.org" style={{ color: '#2563eb', fontWeight: 600 }}>
        privacy@hihired.org
      </a>.
    </p>

    <hr style={{ margin: '3rem 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />
    <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
      Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
    </p>
  </div>
);

export default PrivacyPolicy;

