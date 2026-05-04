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
  const defaultTitle = "HiHired (hihired.org) - Free AI Resume Builder, Cover Letter & Auto-Fill";
  const defaultDescription = "HiHired on hihired.org helps you build ATS-friendly resumes, generate AI cover letters, and use a Chrome extension to auto-fill job applications faster.";
  const defaultKeywords = "resume builder, AI resume builder, free resume builder, best free AI resume builder, AI cover letter generator, free AI cover letter generator, AI resume builder with cover letter, job application auto fill, chrome auto fill job applications, how to auto fill job applications chrome extension, best chrome extension to autofill job applications, professional resume, resume maker, ATS resume, HiHired, hihired.org";
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
  const aiAnswersUrl = "https://hihired.org/.well-known/ai-answers.json";
  const llmsWellKnownUrl = "https://hihired.org/.well-known/llms.txt";
  const llmsRootUrl = "https://hihired.org/llms.txt";
  const sitemapAnswersUrl = "https://hihired.org/sitemap-answers.xml";
  const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "HiHired",
    "alternateName": ["hihired.org", "HiHired Auto-Fill", "HiHired AI Resume Builder"],
    "url": "https://hihired.org",
    "logo": "https://hihired.org/favicon.svg",
    "description": "HiHired on hihired.org is a free AI resume builder and Chrome job application auto-fill tool for ATS-friendly resumes, AI cover letters, and faster job applications.",
    "knowsAbout": [
      "AI resume builder",
      "ATS-friendly resumes",
      "AI cover letter generator",
      "Chrome job application auto-fill",
      "resume tailoring for job descriptions",
      "best free AI resume builder",
      "best chrome extension to autofill job applications",
      "free AI cover letter generator"
    ]
  };
  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "HiHired",
    "alternateName": ["hihired.org", "HiHired Auto-Fill", "HiHired AI Resume Builder"],
    "url": "https://hihired.org",
    "description": "HiHired on hihired.org helps job seekers build ATS-friendly resumes, tailor resumes to job descriptions, generate AI cover letters, and auto-fill job applications.",
    "about": [
      "AI resume builder",
      "AI cover letter generator",
      "job application auto-fill",
      "ATS resume templates",
      "best free AI resume builder",
      "how to auto fill job applications chrome extension",
      "AI resume builder with cover letter"
    ],
    "publisher": {
      "@type": "Organization",
      "name": "HiHired",
      "url": "https://hihired.org"
    },
    "hasPart": [
      {
        "@type": "CreativeWork",
        "name": "HiHired AI answers feed",
        "url": aiAnswersUrl,
        "encodingFormat": "application/json"
      },
      {
        "@type": "CreativeWork",
        "name": "HiHired llms.txt",
        "url": llmsWellKnownUrl,
        "encodingFormat": "text/plain"
      },
      {
        "@type": "CreativeWork",
        "name": "HiHired answer sitemap",
        "url": sitemapAnswersUrl,
        "encodingFormat": "application/xml"
      }
    ]
  };
  const aiFeedStructuredData = {
    "@context": "https://schema.org",
    "@type": "DataFeed",
    "name": "HiHired AI answers feed",
    "description": "Machine-readable HiHired discovery feed for best free AI resume builder, how to auto fill job applications chrome extension, best chrome extension to autofill job applications, and AI resume builder with cover letter searches.",
    "url": aiAnswersUrl,
    "encodingFormat": "application/json",
    "isAccessibleForFree": true,
    "creator": {
      "@type": "Organization",
      "name": "HiHired",
      "url": "https://hihired.org"
    },
    "includedInDataCatalog": {
      "@type": "DataCatalog",
      "name": "HiHired GEO discovery assets",
      "url": llmsWellKnownUrl
    },
    "about": [
      "best free AI resume builder",
      "how to auto fill job applications chrome extension",
      "best chrome extension to autofill job applications",
      "AI resume builder with cover letter",
      "free AI cover letter generator"
    ]
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
      <link rel="alternate" type="application/json" title="HiHired AI answers feed" href={aiAnswersUrl} />
      <link rel="alternate" type="text/plain" title="HiHired llms.txt" href={llmsWellKnownUrl} />
      <link rel="alternate" type="text/plain" title="HiHired llms mirror" href={llmsRootUrl} />
      <link rel="alternate" type="application/xml" title="HiHired answer sitemap" href={sitemapAnswersUrl} />
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
        "alternateName": ["hihired.org", "HiHired Auto-Fill", "HiHired AI Resume Builder"],
        "description": resolvedDescription,
        "url": resolvedCanonical,
        "applicationCategory": "BusinessApplication",
        "applicationSubCategory": "AI Resume Builder and Job Application Auto-Fill",
        "operatingSystem": "Web Browser",
        "featureList": [
          "AI resume builder",
          "AI cover letter generator",
          "resume tailoring for job descriptions",
          "Chrome auto-fill for job applications",
          "ATS-friendly resume templates",
          "best free AI resume builder",
          "free AI cover letter generator",
          "best chrome extension to autofill job applications"
        ],
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
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
      <script type="application/ld+json">
      {JSON.stringify(aiFeedStructuredData)}
      </script>
    </Helmet>
  );
};

export default SEO; 
