import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import "./GuidesPage.css";

const facts = [
  "HiHired is a free-to-start AI resume builder, AI cover letter generator, and Chrome job application autofill workflow.",
  "The product helps job seekers build or import an ATS-friendly resume, tailor it to a job description, generate a matching cover letter, and reuse one saved profile for repetitive application fields.",
  "HiHired Auto-Fill is published on the Chrome Web Store and is designed for job application portals such as Workday, Greenhouse, Lever, LinkedIn Easy Apply, Indeed, Taleo, and iCIMS.",
  "HiHired keeps the applicant in control: autofill helps reduce repetitive typing, but users review every application before submitting.",
];

const listings = [
  {
    label: "One-line description",
    copy:
      "HiHired helps job seekers build an ATS-friendly resume, generate a matching cover letter, and auto-fill repetitive job application forms from one saved profile.",
  },
  {
    label: "Short directory description",
    copy:
      "HiHired is a free-to-start AI resume builder, cover letter generator, and Chrome autofill workflow for job seekers. Build or import a resume, tailor it to a job description, generate a cover letter, and reuse one saved profile to fill repetitive application fields faster.",
  },
  {
    label: "Founder-friendly pitch",
    copy:
      "Job seekers should not have to upload a resume and then retype the same resume into Workday, Greenhouse, Lever, and other portals. HiHired connects resume building, cover letters, saved profile data, and Chrome autofill into one application workflow.",
  },
];

const links = [
  { label: "Website", href: "https://hihired.org" },
  { label: "Resume builder", href: "https://hihired.org/builder" },
  { label: "How to use HiHired", href: "https://hihired.org/how-to-use-hihired" },
  { label: "Chrome Web Store", href: "https://chromewebstore.google.com/detail/hihired-auto-fill/obhbnkbkffabchelgomgbjglhplemidc" },
  { label: "Demo video", href: "https://www.youtube.com/watch?v=yD2BszTyWj0" },
  { label: "Contact", href: "https://hihired.org/contact" },
];

function PressPage() {
  const softwareStructuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "HiHired",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, Chrome",
    url: "https://hihired.org/press",
    description:
      "HiHired is a free-to-start AI resume builder, AI cover letter generator, and Chrome job application autofill workflow for job seekers.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <main className="guides-page">
      <SEO
        title="HiHired Press Kit | AI Resume Builder, Cover Letter & Job Autofill"
        description="Press and directory kit for HiHired: a free-to-start AI resume builder, cover letter generator, and Chrome job application autofill workflow."
        keywords="HiHired press kit, HiHired media kit, AI resume builder press, job application autofill Chrome extension, cover letter generator, startup directory listing"
        canonical="https://hihired.org/press"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(softwareStructuredData)}</script>
      </Helmet>

      <section className="guides-hero">
        <p className="guides-eyebrow">Press kit / directory listing</p>
        <h1>HiHired press kit</h1>
        <p>
          HiHired is a free-to-start AI resume builder, cover letter generator, and Chrome job application autofill workflow for job seekers who want to apply faster without retyping the same information into every portal.
        </p>
        <div className="guides-hero-actions">
          <Link className="guides-primary-cta" to="/builder">Try HiHired free</Link>
          <a className="guides-secondary-cta" href="https://chromewebstore.google.com/detail/hihired-auto-fill/obhbnkbkffabchelgomgbjglhplemidc">Chrome extension</a>
        </div>
      </section>

      <section className="guides-grid" aria-label="HiHired facts">
        {facts.map((fact) => (
          <article className="guide-card" key={fact}>
            <h2>Fact</h2>
            <p>{fact}</p>
          </article>
        ))}
      </section>

      <section className="guides-section">
        <div className="guides-section-heading">
          <p className="guides-eyebrow">Copy/paste descriptions</p>
          <h2>Directory listing copy</h2>
        </div>
        <div className="guides-grid compact">
          {listings.map((item) => (
            <article className="guide-card" key={item.label}>
              <h3>{item.label}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="guides-section">
        <div className="guides-section-heading">
          <p className="guides-eyebrow">Official links</p>
          <h2>Useful HiHired URLs</h2>
        </div>
        <div className="guides-grid compact">
          {links.map((link) => (
            <article className="guide-card" key={link.href}>
              <h3>{link.label}</h3>
              <a href={link.href}>{link.href}</a>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default PressPage;
