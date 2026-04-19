import React from 'react';
import { Helmet } from 'react-helmet';

const SEO = ({ 
  title, 
  description, 
  keywords, 
  canonical, 
  ogImage = "https://hihired.org/og-image.png",
  ogType = "website"
}) => {
  const defaultTitle = "HiHired - Free AI Resume Builder | Build Professional Resumes Online";
  const defaultDescription = "Free AI resume builder. Create ATS-friendly resumes in minutes. No registration required. Download PDF instantly.";
  const defaultKeywords = "resume builder, AI resume builder, free resume builder, professional resume, resume maker, build resume, write resume, create resume, resume template, ATS resume, job resume, career resume, online resume builder";
  const defaultCanonical = typeof window !== 'undefined'
    ? (() => {
        const pathname = window.location.pathname || '/';
        return pathname === '/' ? 'https://hihired.org/' : `https://hihired.org${pathname.replace(/\/$/, '')}`;
      })()
    : "https://hihired.org/";

  const isBrowser = typeof window !== 'undefined';
  const hostname = isBrowser ? window.location.hostname : '';
  const isLocalhost = isBrowser && (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname.includes('localhost')
  );
  const isPrerender = typeof navigator !== 'undefined' && navigator.userAgent === 'ReactSnap';
  const robotsContent = isLocalhost && !isPrerender ? 'noindex, nofollow' : 'index, follow';
  const resolvedTitle = title || defaultTitle;
  const resolvedDescription = description || defaultDescription;
  const resolvedCanonical = canonical || defaultCanonical;
  const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "HiHired",
    "alternateName": ["hihired.org", "HiHired Auto-Fill"],
    "url": "https://hihired.org",
    "logo": "https://hihired.org/favicon.svg",
    "description": "HiHired is a free AI resume builder and Chrome job application auto-fill tool for ATS-friendly resumes, cover letters, and faster job applications.",
  };
  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "HiHired",
    "alternateName": "hihired.org",
    "url": "https://hihired.org",
    "description": "HiHired helps job seekers build ATS-friendly resumes, tailor resumes to job descriptions, generate cover letters, and auto-fill job applications.",
    "publisher": {
      "@type": "Organization",
      "name": "HiHired",
      "url": "https://hihired.org"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://hihired.org/guides",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{resolvedTitle}</title>
      <meta name="title" content={resolvedTitle} />
      <meta name="description" content={resolvedDescription} />
      <meta name="keywords" content={keywords || defaultKeywords} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={resolvedCanonical} />
      <meta property="og:locale" content="en_US" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={resolvedCanonical} />
      <meta property="og:title" content={resolvedTitle} />
      <meta property="og:description" content={resolvedDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="HiHired" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={resolvedCanonical} />
      <meta property="twitter:title" content={resolvedTitle} />
      <meta property="twitter:description" content={resolvedDescription} />
      <meta property="twitter:image" content={ogImage} />
      
      {/* Additional SEO Meta Tags */}
      <meta name="robots" content={robotsContent} />
      <meta name="author" content="HiHired" />
      <meta name="application-name" content="HiHired" />
      <meta name="apple-mobile-web-app-title" content="HiHired" />
      <meta name="theme-color" content="#0ea5e9" />
      <meta name="msapplication-TileColor" content="#0ea5e9" />
      
      {/* Structured Data for Rich Snippets */}
      <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "HiHired",
        "description": resolvedDescription,
        "url": resolvedCanonical,
        "applicationCategory": "ProductivityApplication",
        "operatingSystem": "Web Browser",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "ratingCount": "1250"
        },
        "creator": {
          "@type": "Organization",
          "name": "HiHired",
          "url": "https://hihired.org"
        },
        "publisher": {
          "@type": "Organization",
          "name": "HiHired",
          "url": "https://hihired.org"
        },
        "mainEntityOfPage": resolvedCanonical
      })}
      </script>
      <script type="application/ld+json">
      {JSON.stringify(organizationStructuredData)}
      </script>
      <script type="application/ld+json">
      {JSON.stringify(websiteStructuredData)}
      </script>
    </Helmet>
  );
};

export default SEO; 
