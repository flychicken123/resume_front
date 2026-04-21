import React from 'react';
import { Helmet } from 'react-helmet';

export default function NotFoundPage() {
  return (
    <>
      <Helmet>
        <title>404 | Page not found | HiHired</title>
        <meta
          name="description"
          content="The page you requested could not be found on HiHired. Visit hihired.org to build ATS-friendly resumes, generate cover letters, and auto-fill job applications."
        />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://hihired.org/404.html" />
      </Helmet>
      <main style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', padding: '48px 20px' }}>
        <div style={{ maxWidth: 640, textAlign: 'center' }}>
          <p style={{ marginBottom: 12, fontSize: 14, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0ea5e9' }}>
            404
          </p>
          <h1 style={{ marginBottom: 16, fontSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: 1.1 }}>
            Page not found
          </h1>
          <p style={{ margin: '0 auto 24px', fontSize: 18, lineHeight: 1.6, color: '#475569' }}>
            This page does not exist. You can go back to hihired.org to build a resume, generate a cover letter, or use HiHired Auto-Fill.
          </p>
          <a
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 20px',
              borderRadius: 9999,
              background: '#0f172a',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            Go to HiHired home
          </a>
        </div>
      </main>
    </>
  );
}
