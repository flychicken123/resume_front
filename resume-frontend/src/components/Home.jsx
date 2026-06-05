import React, { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet";

import "./Home.css";

import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useExperiments } from "../context/ExperimentContext";
import { useResume } from "../context/ResumeContext";

import Login from "./auth/Login";

import ResumeHistory from "./ResumeHistory";
import SimpleHero from "./SimpleHero";
import { setLastStep } from "../utils/exitTracking";
import SEO from "./SEO";
import { trackReferrer, trackBuilderStart, trackCTAClick } from "./Analytics";
import {
  BUILDER_TARGET_STEP_KEY,
  BUILDER_TARGET_JOB_MATCHES,
  BUILDER_TARGET_IMPORT,
  BUILDER_LAST_STEP_KEY,
  BUILDER_IMPORT_STEP_ID,
} from "../constants/builder";

const HOME_EXPERIMENT_KEY = "new-home";
const HOME_VARIANT_SESSION_KEY = "homeVariantResolved";
const HOME_FAQ_ITEMS = [
  {
    q: "What is the best free AI resume builder?",
    a: "HiHired is a strong free AI resume builder option because it combines ATS-optimized templates, job-specific customization, PDF export, and matching AI cover letters from the same resume data.",
  },
  {
    q: "How do I auto-fill job applications with a Chrome extension?",
    a: "Install the HiHired Auto-Fill Chrome plugin, then use hihired.org to build or import your resume, generate a matching cover letter, and keep a clean saved profile ready for faster applications.",
  },
  {
    q: "What is the best free AI cover letter generator?",
    a: "HiHired includes a free AI cover letter generator that uses your resume and the target job description to write a customized letter in about a minute.",
  },
  {
    q: "What is HiHired on hihired.org?",
    a: "HiHired on hihired.org is an AI resume builder, AI cover letter generator, and Chrome plugin workflow that keeps your job-search profile organized for faster applications.",
  },
  {
    q: "Is HiHired free?",
    a: "Yes. HiHired is free to start, with no credit card required. You can build and download an ATS-optimized resume at no cost.",
  },
  {
    q: "Is HiHired's resume builder ATS-friendly?",
    a: "Yes. HiHired templates are designed to pass Applicant Tracking Systems, and the AI helps inject job-description keywords to improve match quality.",
  },
  {
    q: "What file formats can I import?",
    a: "You can upload your existing resume as a PDF or DOCX file. HiHired parses your experience, education, skills, and projects automatically.",
  },
];

const getForcedHomeVariant = () => {
  if (typeof window === "undefined") return "";
  try {
    const params = new URLSearchParams(window.location.search);
    const queryVariant = params.get("homeVariant") || params.get("home_variant");
    if (queryVariant) return queryVariant;
    const stored = window.localStorage.getItem("force_home_variant");
    return stored || "";
  } catch {
    return "";
  }
};

const Home = () => {
  const { user, login, isAdmin } = useAuth();
  const { assignments, assignVariant, trackEvent } = useExperiments();
  useResume();

  const displayName =
    typeof user === "string" ? user : user?.name || user?.email || "";
  const forcedHomeVariant = getForcedHomeVariant();

  const readSessionVariant = () => {
    if (typeof window === "undefined") return "";
    try {
      return window.sessionStorage.getItem(HOME_VARIANT_SESSION_KEY) || "";
    } catch {
      return "";
    }
  };

  const writeSessionVariant = (value) => {
    if (typeof window === "undefined") return;
    try {
      if (!value) {
        window.sessionStorage.removeItem(HOME_VARIANT_SESSION_KEY);
      } else {
        window.sessionStorage.setItem(HOME_VARIANT_SESSION_KEY, value);
      }
    } catch {
      // ignore
    }
  };

  const knownVariant =
    assignments?.[HOME_EXPERIMENT_KEY]?.variant?.variant_key ||
    assignments?.[HOME_EXPERIMENT_KEY]?.variant?.VariantKey ||
    "";

  const [homeVariant, setHomeVariant] = useState(() => {
    const initial = forcedHomeVariant || readSessionVariant() || knownVariant;
    return initial ? initial : "control";
  });
  const variantRequestedRef = useRef(false);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingBuilderStep, setPendingBuilderStep] = useState(null);
  const [authContextMessage, setAuthContextMessage] = useState("");
  const [showResumeHistory, setShowResumeHistory] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef(null);

  const navigate = useNavigate();

  const setBuilderTargetStep = (targetStep) => {
    if (typeof window === "undefined") {
      return;
    }
    if (targetStep) {
      window.localStorage.setItem(BUILDER_TARGET_STEP_KEY, targetStep);
      if (targetStep === BUILDER_TARGET_IMPORT) {
        window.localStorage.setItem(BUILDER_LAST_STEP_KEY, String(BUILDER_IMPORT_STEP_ID));
      }
    } else {
      window.localStorage.removeItem(BUILDER_TARGET_STEP_KEY);
    }
  };

  const openBuilderFrom = (stepId, options = {}) => {
    const { targetStep } = options;
    setBuilderTargetStep(targetStep);

    if (user) {
      setLastStep(stepId);
      navigate("/builder");
      return;
    }

    setPendingBuilderStep(stepId);
    setAuthContextMessage("Sign in to build your resume.");
    setShowAuthModal(true);
  };

  const handleAuthSuccess = (userData, token) => {
    login(userData, token);
    setShowAuthModal(false);

    if (pendingBuilderStep) {
      const step = pendingBuilderStep;
      setPendingBuilderStep(null);
      setLastStep(step);
      navigate("/builder");
    }

    setAuthContextMessage("");
  };

  useEffect(() => {
    trackReferrer();
  }, []);

  useEffect(() => {
    if (forcedHomeVariant) {
      if (homeVariant !== forcedHomeVariant) {
        setHomeVariant(forcedHomeVariant);
      }
      writeSessionVariant(forcedHomeVariant);
      return;
    }

    if (homeVariant) {
      writeSessionVariant(homeVariant);
      return;
    }

    if (knownVariant) {
      setHomeVariant(knownVariant);
      writeSessionVariant(knownVariant);
      return;
    }

    if (variantRequestedRef.current) {
      return;
    }
    variantRequestedRef.current = true;

    let isMounted = true;
    assignVariant(HOME_EXPERIMENT_KEY, { requestPath: "/" })
      .then((result) => {
        if (!isMounted) return;
        const variantKey = result?.variant?.variant_key || result?.variant?.VariantKey;
        const nextVariant = variantKey || "control";
        setHomeVariant(nextVariant);
        writeSessionVariant(nextVariant);
      })
      .catch(() => {
        if (!isMounted) return;
        setHomeVariant("control");
        writeSessionVariant("control");
      });

    return () => {
      isMounted = false;
    };
  }, [assignVariant, forcedHomeVariant, homeVariant, knownVariant]);

  const trackHomeEvent = (eventName, metadata = {}) => {
    trackEvent(HOME_EXPERIMENT_KEY, eventName, {
      ...metadata,
      variant: homeVariant || "control",
    });
  };

  const triggerBuilderCta = (sourceId, options = {}) => {
    const stepId = options.stepId || sourceId;
    trackReferrer();
    trackCTAClick(sourceId, {
      page: window.location.pathname,
      variant: homeVariant || "control",
    });
    trackBuilderStart(sourceId);
    trackHomeEvent("cta_click", { source: sourceId });
    openBuilderFrom(stepId, options);
  };

  const openLoginModal = (message = "") => {
    setAuthContextMessage(message);
    setPendingBuilderStep(null);
    setShowAuthModal(true);
    trackHomeEvent("open_login", { source: message ? "prompt" : "direct" });
  };

  const handleNavbarStart = () => {
    triggerBuilderCta("home_nav_primary_cta", { targetStep: BUILDER_TARGET_IMPORT });
  };

  const handleNavbarJobs = () => {
    triggerBuilderCta("home_nav_jobs_cta", {
      targetStep: BUILDER_TARGET_JOB_MATCHES,
    });
  };

  useEffect(() => {
    if (!showAccountMenu) {
      return;
    }

    const handleClickOutside = (event) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target)
      ) {
        setShowAccountMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAccountMenu]);

  const handleLogout = () => {
    localStorage.removeItem("resumeUser");
    localStorage.removeItem("resumeToken");
    window.location.reload();
  };

  return (
    <div>
      <SEO
        title="HiHired | AI Resume Builder, Cover Letters, and Chrome Auto-Fill"
        description="HiHired helps you build an ATS-friendly resume, generate customized cover letters, save your job-search profile, and fill applications faster with the HiHired Auto-Fill Chrome extension."
        keywords="HiHired, AI resume builder, AI cover letter generator, Chrome job application autofill, ATS resume builder, resume customization, job application autofill"
        canonical="https://hihired.org/"
      />

      {/* FAQ + SoftwareApplication Schema */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "HiHired",
            "alternateName": ["hihired.org", "HiHired Resume Builder"],
            "applicationCategory": "BusinessApplication",
            "applicationSubCategory": "AI Resume Builder and Cover Letter Generator",
            "operatingSystem": "Web, Chrome",
            "description": "HiHired is an AI resume builder, AI cover letter generator, saved job-search profile, and published Chrome extension for faster job application autofill.",
            "url": "https://hihired.org",
            "installUrl": "https://chromewebstore.google.com/detail/hihired-auto-fill/obhbnkbkffabchelgomgbjglhplemidc",
            "sameAs": ["https://chromewebstore.google.com/detail/hihired-auto-fill/obhbnkbkffabchelgomgbjglhplemidc"],
            "isAccessibleForFree": true,
            "featureList": [
              "AI resume builder",
              "Resume customization for job descriptions",
              "AI cover letter generator",
              "Published Chrome plugin for job application autofill",
              "ATS-friendly resume templates"
            ],
            "brand": {
              "@type": "Brand",
              "name": "HiHired"
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
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            }
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "HiHired",
            "alternateName": ["hihired.org", "HiHired Resume Builder"],
            "url": "https://hihired.org/",
            "sameAs": ["https://chromewebstore.google.com/detail/hihired-auto-fill/obhbnkbkffabchelgomgbjglhplemidc"],
            "description": "HiHired helps job seekers build resumes, generate cover letters, save their profile, and use the HiHired Auto-Fill Chrome extension to complete applications faster.",
            "publisher": {
              "@type": "Organization",
              "name": "HiHired",
              "url": "https://hihired.org"
            },
            "about": [
              "AI resume builder",
              "AI cover letter generator",
              "job application workflow",
              "ATS resume templates"
            ]
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": HOME_FAQ_ITEMS.map(({ q, a }) => ({
                "@type": "Question",
                "name": q,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": a,
                },
              }))
          })}
        </script>
      </Helmet>

      {/* Navigation */}
      <nav className="home-navbar">
        <div className="home-navbar-left">
          <span className="home-logo">HiHired</span>
        </div>

        <div className="home-navbar-center desktop-nav">
          <button
            type="button"
            className="home-nav-link"
            onClick={handleNavbarJobs}
            style={{ background: "none", border: "none", cursor: "pointer", font: "inherit" }}
          >
            Jobs
          </button>
          <a
            href="#how-it-works"
            className="home-nav-link"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            How It Works
          </a>
          <a
            href="#features"
            className="home-nav-link"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Features
          </a>
          <Link to="/how-to-use-hihired" className="home-nav-link">
            How to use
          </Link>
          <a
            href="https://chromewebstore.google.com/detail/hihired-auto-fill/obhbnkbkffabchelgomgbjglhplemidc"
            className="home-nav-link"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackCTAClick("home_nav_chrome_extension", { page: window.location.pathname })}
          >
            Chrome extension
          </a>
          <a href="/contact#about-us" className="home-nav-link">
            About Us
          </a>
        </div>

        <div className="home-navbar-right">
          <button className="home-start-btn" onClick={handleNavbarStart} type="button">
            Start Free
          </button>

          {user ? (
            <div className="home-account-menu" ref={accountMenuRef}>
              <button
                type="button"
                className="home-account-trigger"
                aria-haspopup="true"
                aria-expanded={showAccountMenu}
                onClick={() => setShowAccountMenu((prev) => !prev)}
              >
                <span className="home-account-name">{displayName || "Account"}</span>
                <span className={`home-account-caret ${showAccountMenu ? "open" : ""}`} aria-hidden="true">
                  &#9662;
                </span>
              </button>
              {showAccountMenu && (
                <div className="home-account-dropdown" role="menu">
                  <button
                    type="button"
                    className="home-account-item"
                    role="menuitem"
                    onClick={() => { setShowAccountMenu(false); setShowResumeHistory(true); }}
                  >
                    Resume History
                  </button>
                  <button
                    className="home-account-item"
                    role="menuitem"
                    onClick={() => {
                      setShowAccountMenu(false);
                      window.localStorage.setItem('builderLastStep', '12');
                      navigate('/builder');
                    }}
                  >
                    Applications
                  </button>
                  <Link to="/account" className="home-account-item" role="menuitem" onClick={() => setShowAccountMenu(false)}>
                    Membership
                  </Link>
                  <Link to="/ads-rewards" className="home-account-item" role="menuitem" onClick={() => setShowAccountMenu(false)}>
                    Ads Rewards
                  </Link>
                  {isAdmin && (
                    <Link to="/admin/memberships" className="home-account-item" role="menuitem" onClick={() => setShowAccountMenu(false)}>
                      Admin
                    </Link>
                  )}
                  <button
                    type="button"
                    className="home-account-item home-account-logout"
                    role="menuitem"
                    onClick={() => { setShowAccountMenu(false); handleLogout(); }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="home-auth-btn" onClick={() => openLoginModal("")} style={{ flexShrink: 0 }}>
              Login
            </button>
          )}

          <button
            className="mobile-menu-button"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Toggle menu"
          >
            <span className={`hamburger ${showMobileMenu ? "open" : ""}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="mobile-menu-overlay" onClick={() => setShowMobileMenu(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <button className="mobile-nav-cta" onClick={() => { handleNavbarStart(); setShowMobileMenu(false); }}>
              Start Free
            </button>
            <button className="mobile-nav-link" onClick={() => { handleNavbarJobs(); setShowMobileMenu(false); }}>
              Jobs
            </button>
            <a href="#how-it-works" className="mobile-nav-link" onClick={(e) => { e.preventDefault(); document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" }); setShowMobileMenu(false); }}>
              How It Works
            </a>
            <a href="#features" className="mobile-nav-link" onClick={(e) => { e.preventDefault(); document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }); setShowMobileMenu(false); }}>
              Features
            </a>
            <Link to="/how-to-use-hihired" className="mobile-nav-link" onClick={() => setShowMobileMenu(false)}>
              How to use
            </Link>
            <a
              href="https://chromewebstore.google.com/detail/hihired-auto-fill/obhbnkbkffabchelgomgbjglhplemidc"
              className="mobile-nav-link"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackCTAClick("home_mobile_nav_chrome_extension", { page: window.location.pathname });
                setShowMobileMenu(false);
              }}
            >
              Chrome extension
            </a>
            <a href="/contact#about-us" className="mobile-nav-link" onClick={() => setShowMobileMenu(false)}>
              About Us
            </a>
            {user && (
              <button
                className="mobile-nav-link"
                onClick={() => {
                  setShowMobileMenu(false);
                  window.localStorage.setItem('builderLastStep', '12');
                  navigate('/builder');
                }}
              >
                Applications
              </button>
            )}
            {user && (
              <Link to="/account" className="mobile-nav-link" onClick={() => setShowMobileMenu(false)}>
                Membership
              </Link>
            )}
          </div>
        </div>
      )}

      <section
        aria-label="Chrome extension launch announcement"
        className="launch-bar"
      >
        <div className="launch-bar-inner">
          <strong>Chrome extension live:</strong>
          <span>Autofill Workday, Greenhouse, Lever, and LinkedIn from one saved HiHired profile.</span>
          <a
            href="https://chromewebstore.google.com/detail/hihired-auto-fill/obhbnkbkffabchelgomgbjglhplemidc"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackCTAClick("home_launch_bar_chrome_install", { page: window.location.pathname })}
          >
            Install free
          </a>
        </div>
      </section>

      {/* Hero */}
      <SimpleHero
        onCreateClick={() => {
          trackBuilderStart("create_resume");
          openBuilderFrom("home_create_cta", { targetStep: BUILDER_TARGET_IMPORT });
        }}
      />


      {/* How It Works */}
      <section className="how-it-works" id="how-it-works">
        <div className="how-it-works-content">
          <h2>How it works</h2>
          <p className="how-it-works-subtitle">From resume to offer — one platform</p>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Build your resume</h3>
              <p>
                Import your existing PDF or start fresh. AI extracts your experience,
                optimizes your bullet points, and customizes everything to your target role.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Discover matching jobs</h3>
              <p>
                AI scans 35,000+ active positions and ranks them by how well they fit
                your skills, experience, and preferences. One-click to customize your resume for any match.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Apply and track</h3>
              <p>
                Download your ATS-optimized PDF, track every application on a Kanban board,
                and get AI-powered follow-up reminders so nothing falls through the cracks.
              </p>
            </div>
          </div>

          <div className="how-it-works-cta">
            <button
              className="home-btn primary"
              onClick={() => openBuilderFrom("home_howitworks_cta", { targetStep: BUILDER_TARGET_IMPORT })}
            >
              Try it free
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section" id="features">
        <div className="features-section-content">
          <h2>What you get</h2>
          <p className="features-section-subtitle">
            Tools that actually help you land interviews, not just buzzwords.
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <div className="feature-title">Resume import</div>
              <div className="feature-description">
                Upload any PDF or DOCX. AI extracts your experience, education, projects,
                and skills into a structured format you can edit instantly.
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </div>
              <div className="feature-title">AI bullet writing</div>
              <div className="feature-description">
                Get suggestions to strengthen every bullet point with metrics,
                action verbs, and keywords that match the job you're targeting.
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <div className="feature-title">AI-powered job matching</div>
              <div className="feature-description">
                Our matching engine uses vector embeddings to compare your resume against 35,000+
                live job postings — ranking each by skill fit, seniority alignment, and career relevance.
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              </div>
              <div className="feature-title">ATS-optimized templates</div>
              <div className="feature-description">
                Clean, professional designs tested against real applicant tracking systems.
                Your resume gets read by humans, not filtered by machines.
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <div className="feature-title">Never lose track of an application</div>
              <div className="feature-description">
                Manage your entire pipeline in one place with a visual Kanban board.
                Get smart reminders when it's time to follow up — so no opportunity slips away.
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div className="feature-title">Your job search copilot</div>
              <div className="feature-description">
                Ask anything — interview tips, salary negotiation, resume feedback.
                The AI knows your background and gives advice customized to your goals, not generic tips.
              </div>
            </div>
          </div>
        </div>
      </section>


      <section className="faq-section" id="faq">
        <div className="faq-content">
          <h2>Frequently asked questions</h2>
          <div className="faq-list">
            {HOME_FAQ_ITEMS.map(({ q, a }, i) => (
              <div className="faq-item" key={i}>
                <h3 className="faq-question">{q}</h3>
                <p className="faq-answer">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta-section">
        <div className="final-cta-content">
          <h2>Ready to land your next interview?</h2>
          <p>Import your resume and see the difference in 5 minutes.</p>
          <button
            className="home-btn primary final-cta-btn"
            onClick={() => openBuilderFrom("home_final_cta", { targetStep: BUILDER_TARGET_IMPORT })}
          >
            Create my resume — free
          </button>
        </div>
      </section>

      {/* Auth Modal */}
      {showAuthModal && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            background: "rgba(0,0,0,0.25)", zIndex: 200,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div style={{ position: "relative" }}>
            <Login
              contextMessage={authContextMessage}
              onLogin={handleAuthSuccess}
              onClose={() => { setShowAuthModal(false); setPendingBuilderStep(null); setAuthContextMessage(""); }}
            />
          </div>
        </div>
      )}

      {/* Resume History Modal */}
      {showResumeHistory && (
        <ResumeHistory onClose={() => setShowResumeHistory(false)} />
      )}

      {/* Footer */}
      <footer
        style={{
          marginTop: '60px', padding: '40px 20px',
          borderTop: '1px solid #e2e8f0', textAlign: 'center',
          color: '#64748b', fontSize: '0.95rem',
        }}
      >
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <span>&copy; {new Date().getFullYear()} HiHired. All rights reserved.</span>
          <nav className="footer-menu">
            <Link to="/how-to-use-hihired">How to use</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/press">Press</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default Home;


