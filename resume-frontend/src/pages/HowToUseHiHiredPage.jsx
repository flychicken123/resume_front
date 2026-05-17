import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import "./GuidesPage.css";

const BUILDER_STEPS = [
  {
    title: "Start with the builder",
    description:
      "Open the HiHired builder and choose whether to import an existing resume or create one from scratch.",
    action: "Go to hihired.org/builder and click Start Building.",
  },
  {
    title: "Import or add your resume details",
    description:
      "Upload your current resume, or enter your contact details, work experience, education, projects, and skills manually.",
    action: "Review every section after import so names, dates, links, and bullets are correct.",
  },
  {
    title: "Use AI to improve weak sections",
    description:
      "Rewrite experience bullets, generate a professional summary, and create a cleaner skills list from your background.",
    action: "Use AI suggestions as a first draft, then keep only the edits that are true to your experience.",
  },
  {
    title: "Customize for a job description",
    description:
      "Paste the target job description so HiHired can help align your resume and cover letter to the role.",
    action: "Prioritize exact skills, tools, responsibilities, and impact metrics from the job posting.",
  },
  {
    title: "Pick a template and export",
    description:
      "Choose a recruiter-friendly template, check spacing, and export a PDF you can attach to applications.",
    action: "Download the PDF and keep the saved profile ready for future applications.",
  },
];

const EXTENSION_STEPS = [
  {
    title: "Install or load the Chrome autofill extension",
    description:
      "If you are using the HiHired Auto-Fill beta, install it in Chrome or load the unpacked extension from your local build.",
  },
  {
    title: "Sign in and keep your profile complete",
    description:
      "The extension works best when your HiHired profile already has your name, email, phone, LinkedIn, location, resume, work history, and common answers.",
  },
  {
    title: "Open a job application page",
    description:
      "Go to a supported job form such as Greenhouse, Lever, Workday, LinkedIn Easy Apply, or Ashby, then run autofill from the extension.",
  },
  {
    title: "Review before submitting",
    description:
      "Always review required uploads, dropdowns, radio buttons, EEO questions, sponsorship answers, and location fields before you submit.",
  },
];

const CHECKLIST = [
  "Your resume PDF is attached when the application asks for a file upload.",
  "Location dropdowns are selected from the site’s suggestions, not just typed as text.",
  "Required Yes/No and EEO radio buttons are selected.",
  "LinkedIn, portfolio, GitHub, and phone number are correct.",
  "Any generated answer still sounds like you and does not invent experience.",
];

function HowToUseHiHiredPage() {
  const howToStructuredData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to use HiHired to build a resume and apply faster",
    description:
      "A step-by-step tutorial for using HiHired to build or import a resume, improve it with AI, customize it to a job, export a PDF, and use the Chrome autofill workflow safely.",
    totalTime: "PT15M",
    tool: [
      { "@type": "HowToTool", name: "HiHired resume builder" },
      { "@type": "HowToTool", name: "HiHired Auto-Fill Chrome extension beta" },
    ],
    step: BUILDER_STEPS.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.title,
      text: `${step.description} ${step.action}`,
      url: `https://hihired.org/how-to-use-hihired#builder-step-${index + 1}`,
    })),
  };

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Do I need an existing resume to use HiHired?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. You can either import an existing resume or start from scratch in the HiHired builder.",
        },
      },
      {
        "@type": "Question",
        name: "Should I submit immediately after autofill?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Always review required uploads, dropdown selections, radio buttons, and any generated text before submitting a job application.",
        },
      },
      {
        "@type": "Question",
        name: "Why can an application still show missing fields after autofill?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Some job sites require file uploads, selected dropdown suggestions, or React state changes that cannot be completed by typing plain text alone. Review required fields before submitting.",
        },
      },
    ],
  };

  return (
    <main className="guides-page guide-detail how-to-guide" aria-label="How to use HiHired tutorial">
      <SEO
        title="How to Use HiHired — Resume Builder and Job Application Autofill Tutorial"
        description="Learn how to use HiHired step by step: build or import your resume, improve it with AI, customize it to a job, export a PDF, and safely use the Chrome autofill workflow."
        canonical="https://hihired.org/how-to-use-hihired"
        keywords="how to use hihired, hihired tutorial, resume builder tutorial, how to build a resume with ai, job application autofill tutorial, chrome autofill job applications guide"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(howToStructuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(faqStructuredData)}</script>
      </Helmet>

      <nav className="guide-detail__breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <span>How to use HiHired</span>
      </nav>

      <section className="guide-detail__hero how-to-hero">
        <p className="guides-hero__kicker">Step-by-step tutorial</p>
        <h1>How to use HiHired to build a resume and apply faster</h1>
        <p>
          This is the practical user guide: start in the builder, create a clean resume, tailor it to a job,
          export a PDF, and then use the autofill workflow carefully when you apply.
        </p>
        <div className="guides-hero__cta">
          <Link to="/builder" className="guides-primary-btn">Start the builder</Link>
          <a href="#autofill" className="guides-secondary-btn">See autofill steps</a>
          <a href="#checklist" className="guides-secondary-btn">Pre-submit checklist</a>
        </div>
      </section>

      <section className="guide-detail__section how-to-overview">
        <h2>The full HiHired workflow</h2>
        <div className="how-to-flow" aria-label="HiHired workflow overview">
          <span>Build profile</span>
          <span>Improve resume</span>
          <span>Tailor to job</span>
          <span>Export PDF</span>
          <span>Autofill application</span>
          <span>Review & submit</span>
        </div>
        <p>
          Think of HiHired as one reusable job-search profile. You create or import your resume once,
          improve the content, customize it for each role, and reuse the same verified information when filling applications.
        </p>
      </section>

      <section className="guide-detail__section" id="builder">
        <h2>Part 1: Build your resume in HiHired</h2>
        <ol className="how-to-steps">
          {BUILDER_STEPS.map((step, index) => (
            <li key={step.title} id={`builder-step-${index + 1}`} className="how-to-step-card">
              <span className="how-to-step-card__number">{index + 1}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                <p className="how-to-step-card__action">Action: {step.action}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="guide-detail__section" id="autofill">
        <h2>Part 2: Use the Chrome autofill workflow</h2>
        <p>
          The autofill extension is useful for reducing repeated typing, but job sites can still require human review.
          File uploads, searchable location fields, and some required radio buttons may need a final manual check.
        </p>
        <div className="guide-card-grid">
          {EXTENSION_STEPS.map((step, index) => (
            <article key={step.title} className="guide-card how-to-mini-card">
              <p className="guide-card__intent">Autofill step {index + 1}</p>
              <h3>{step.title}</h3>
              <p className="guide-card__answer">{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="guide-detail__section" id="checklist">
        <h2>Before you submit any application</h2>
        <p>Use this checklist every time, especially on Ashby, Workday, Greenhouse, Lever, and LinkedIn Easy Apply.</p>
        <ul className="how-to-checklist">
          {CHECKLIST.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="guide-detail__section how-to-callout">
        <h2>Recommended first session</h2>
        <p>
          If you are new to HiHired, spend 10–15 minutes creating a strong base profile first. The autofill workflow
          becomes much more reliable when your saved resume data and common application answers are complete.
        </p>
        <Link to="/builder" className="guides-primary-btn">Open HiHired builder</Link>
      </section>
    </main>
  );
}

export default HowToUseHiHiredPage;
