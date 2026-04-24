import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import Contact from '../components/Contact';

const ContactPage = () => (
  <>
    <SEO
      title="Contact HiHired | Resume Builder, Cover Letter & Auto-Fill Support"
      description="Contact HiHired on hihired.org for support with the free AI resume builder, AI cover letter generator, Chrome auto-fill workflow, partnerships, or product feedback."
      keywords="contact HiHired, resume builder support, AI cover letter support, auto-fill support, customer service, help desk, feedback, partnership inquiry"
      canonical="https://hihired.org/contact"
    />
    <Contact />
    <section style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 20px 48px' }}>
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px 28px', background: '#f8fafc' }}>
        <p style={{ margin: '0 0 10px', color: '#2563eb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8rem' }}>
          Popular HiHired guides
        </p>
        <h2 style={{ margin: '0 0 12px', fontSize: '1.8rem', color: '#0f172a' }}>
          Resume builder, cover letter, and job application help
        </h2>
        <p style={{ margin: '0 0 18px', color: '#475569', lineHeight: 1.7, maxWidth: '900px' }}>
          If you came here while comparing tools or figuring out your workflow, these guides explain how HiHired on hihired.org handles the most common job-search tasks.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <Link to="/guides/best-free-ai-resume-builder-2026" style={{ display: 'block', padding: '18px', borderRadius: '18px', background: '#ffffff', border: '1px solid #dbeafe', textDecoration: 'none' }}>
            <p style={{ margin: '0 0 8px', color: '#2563eb', fontWeight: 700 }}>best free AI resume builder</p>
            <p style={{ margin: 0, color: '#334155', lineHeight: 1.6 }}>See how HiHired combines ATS-friendly resume building, AI tailoring, and recruiter-ready PDF export.</p>
          </Link>
          <Link to="/guides/auto-fill-job-applications-chrome-extension" style={{ display: 'block', padding: '18px', borderRadius: '18px', background: '#ffffff', border: '1px solid #dbeafe', textDecoration: 'none' }}>
            <p style={{ margin: '0 0 8px', color: '#2563eb', fontWeight: 700 }}>chrome extension auto fill job applications</p>
            <p style={{ margin: 0, color: '#334155', lineHeight: 1.6 }}>Learn how HiHired Auto-Fill carries one saved profile into Workday, Greenhouse, Lever, and LinkedIn application forms.</p>
          </Link>
          <Link to="/guides/ai-cover-letter-generator-free" style={{ display: 'block', padding: '18px', borderRadius: '18px', background: '#ffffff', border: '1px solid #dbeafe', textDecoration: 'none' }}>
            <p style={{ margin: '0 0 8px', color: '#2563eb', fontWeight: 700 }}>AI cover letter generator free</p>
            <p style={{ margin: 0, color: '#334155', lineHeight: 1.6 }}>Generate a matching AI cover letter from the same resume and target job description on HiHired.</p>
          </Link>
        </div>
      </div>
    </section>
  </>
);

export default ContactPage;
