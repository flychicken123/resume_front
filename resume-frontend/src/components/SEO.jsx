import React from 'react';
import { Helmet } from 'react-helmet';

const SEO = ({ 
  title, 
  description, 
  keywords, 
  canonical, 
  ogImage = "https://hihired.org/og-image.jpg",
  ogType = "website"
}) => {
  const defaultTitle = "HiHired - Free AI Resume Builder | Build Professional Resumes Online";
  const defaultDescription = "Free AI resume builder. Create ATS-friendly resumes in minutes. No registration required. Download PDF instantly.";
  const defaultKeywords = "resume builder, AI resume builder, free resume builder, professional resume, resume maker, build resume, write resume, create resume, resume template, ATS resume, job resume, career resume, online resume builder";
  const defaultCanonical = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}` 
    : "https://hihired.org";

  // Use noindex on localhost to keep dev builds out of search
  const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '0.0.0.0' ||
    window.location.hostname.includes('localhost')
  );
  const robotsContent = isLocalhost ? 'noindex, nofollow' : 'index, follow';

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title || defaultTitle}</title>
      <meta name="title" content={title || defaultTitle} />
      <meta name="description" content={description || defaultDescription} />
      <meta name="keywords" content={keywords || defaultKeywords} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonical || defaultCanonical} />
      <meta property="og:locale" content="en_US" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical || defaultCanonical} />
      <meta property="og:title" content={title || defaultTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="HiHired" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonical || defaultCanonical} />
      <meta property="twitter:title" content={title || defaultTitle} />
      <meta property="twitter:description" content={description || defaultDescription} />
      <meta property="twitter:image" content={ogImage} />
      
      {/* Additional SEO Meta Tags */}
      <meta name="robots" content={robotsContent} />
      <meta name="author" content="HiHired" />
      <meta name="application-name" content="HiHired" />
      <meta name="apple-mobile-web-app-title" content="HiHired" />
      <meta name="theme-color" content="#667eea" />
      <meta name="msapplication-TileColor" content="#667eea" />
      
      {/* Structured Data for Rich Snippets */}
      <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "HiHired",
        "description": description || defaultDescription,
        "url": canonical || defaultCanonical,
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
        }
      })}
      </script>
    </Helmet>
  );
};

export default SEO; 
