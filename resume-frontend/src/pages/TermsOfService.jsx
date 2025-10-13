import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const TermsOfService = () => (
  <div style={{ padding: '60px 20px', maxWidth: '960px', margin: '0 auto' }}>
    <SEO
      title="Terms of Service | HiHired"
      description="Read the HiHired Terms of Service to understand how our AI resume platform operates and how your data may be used."
      canonical="https://hihired.org/terms"
    />
    <h1 style={{ fontSize: '2.75rem', fontWeight: 800, marginBottom: '1.5rem', color: '#0f172a' }}>
      Terms of Service
    </h1>
    <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: '1.5rem' }}>
      Welcome to HiHired. These Terms of Service (“Terms”) govern your access to and use of the HiHired
      websites, applications, APIs, and AI-powered resume services (collectively, the “Services”).
      By accessing or using the Services you agree to be bound by these Terms. If you are using the Services
      on behalf of an organization, you represent that you have authority to bind that organization, in which
      case “you” means the organization.
    </p>

    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '2rem', marginBottom: '0.75rem', color: '#111827' }}>
      1. Eligibility & Account Responsibilities
    </h2>
    <p style={{ color: '#475569', lineHeight: 1.7 }}>
      You must be at least 16 years old to use the Services. You are responsible for maintaining the
      confidentiality of your account credentials and for all activity that occurs under your account. You
      agree to promptly notify us of any unauthorized use of your account.
    </p>

    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '2rem', marginBottom: '0.75rem', color: '#111827' }}>
      2. Acceptable Use
    </h2>
    <p style={{ color: '#475569', lineHeight: 1.7 }}>
      You agree to use the Services only for lawful purposes. You will not reverse engineer, scrape, or
      otherwise abuse the platform or attempt to gain unauthorized access to our infrastructure or data.
      HiHired reserves the right to suspend or terminate accounts that violate these Terms.
    </p>

    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '2rem', marginBottom: '0.75rem', color: '#111827' }}>
      3. Ownership & License
    </h2>
    <p style={{ color: '#475569', lineHeight: 1.7 }}>
      You retain ownership of the content you upload, including resumes, job history, and feedback. By
      submitting content, you grant HiHired a worldwide, royalty-free license to host, store, reproduce,
      analyze, and adapt that content as necessary to provide, operate, and improve the Services. This
      license survives termination of your account for as long as your data remains within our systems in
      accordance with our <Link to="/privacy">Privacy Policy</Link>.
    </p>

    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '2rem', marginBottom: '0.75rem', color: '#111827' }}>
      4. Commercial Use of Data
    </h2>
    <p style={{ color: '#475569', lineHeight: 1.7 }}>
      HiHired may analyze user-submitted data—such as resumes, profile details, job preferences, and usage
      patterns—to develop new products, features, insights, and commercial offerings. We may monetize
      aggregate or de-identified insights derived from user data, including by offering benchmarking,
      analytics, or recruiting services to third parties. We do <strong>not</strong> sell personally identifiable
      information without your consent, but you acknowledge and agree that HiHired may generate profit from
      analytics or services that rely on data you submit.
    </p>

    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '2rem', marginBottom: '0.75rem', color: '#111827' }}>
      5. AI-Generated Content & Disclaimers
    </h2>
    <p style={{ color: '#475569', lineHeight: 1.7 }}>
      Portions of the Services rely on machine learning models that may generate suggestions, resume text,
      or labor market insights. AI output can occasionally contain inaccuracies or biased language. You are
      solely responsible for reviewing, editing, and validating all generated content before using it in any
      job application or publication. HiHired disclaims liability for decisions or outcomes based on AI output.
    </p>

    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '2rem', marginBottom: '0.75rem', color: '#111827' }}>
      6. Paid Services & Billing
    </h2>
    <p style={{ color: '#475569', lineHeight: 1.7 }}>
      Certain features may require payment. By ordering paid Services you agree to the pricing, billing
      cycle, and terms presented at checkout. Unless otherwise stated, fees are non-refundable. We may
      change pricing with prior notice. It is your responsibility to cancel before a renewal date if you wish
      to avoid future charges.
    </p>

    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '2rem', marginBottom: '0.75rem', color: '#111827' }}>
      7. Termination
    </h2>
    <p style={{ color: '#475569', lineHeight: 1.7 }}>
      You may stop using the Services at any time. HiHired may suspend or terminate access if you breach
      these Terms, engage in fraudulent or illegal activity, or if we discontinue the Services. Upon
      termination certain provisions will survive, including ownership, licenses, warranty disclaimers,
      indemnity, and limitations of liability.
    </p>

    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '2rem', marginBottom: '0.75rem', color: '#111827' }}>
      8. Limitation of Liability
    </h2>
    <p style={{ color: '#475569', lineHeight: 1.7 }}>
      To the maximum extent permitted by law, HiHired and its affiliates shall not be liable for any indirect,
      incidental, special, consequential, or punitive damages, or for any loss of profits or revenues arising
      out of or in connection with your use of the Services. Our total liability for any claim shall not exceed
      the amount you paid us in the twelve (12) months preceding the claim.
    </p>

    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '2rem', marginBottom: '0.75rem', color: '#111827' }}>
      9. Changes to These Terms
    </h2>
    <p style={{ color: '#475569', lineHeight: 1.7 }}>
      We may modify these Terms from time to time. Material changes will be posted on this page or sent via
      email. Your continued use of the Services after changes become effective constitutes acceptance of the
      updated Terms.
    </p>

    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '2rem', marginBottom: '0.75rem', color: '#111827' }}>
      10. Contact
    </h2>
    <p style={{ color: '#475569', lineHeight: 1.7 }}>
      Questions about these Terms may be directed to{' '}
      <a href="mailto:legal@hihired.org" style={{ color: '#2563eb', fontWeight: 600 }}>
        legal@hihired.org
      </a>.
    </p>

    <hr style={{ margin: '3rem 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />
    <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
      Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
    </p>
  </div>
);

export default TermsOfService;

