import React, { useState, useEffect, useRef } from "react";

import "./Home.css";

import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import Login from "./auth/Login";


import ResumeHistory from "./ResumeHistory";

import SimpleHero from "./SimpleHero";

import About from "./About";

import Contact from "./Contact";

import ProductOverview from "./ProductOverview";

import TeamSection from "./TeamSection";

import { setLastStep } from "../utils/exitTracking";

import SEO from "./SEO";

import { trackReferrer, trackBuilderStart, trackCTAClick } from "./Analytics";

const Home = () => {
  const { user, login, isAdmin } = useAuth();

  const displayName =
    typeof user === "string" ? user : user?.name || user?.email || "";

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingBuilderStep, setPendingBuilderStep] = useState(null);
  const [authContextMessage, setAuthContextMessage] = useState("");
  const [showResumeHistory, setShowResumeHistory] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef(null);

  const navigate = useNavigate();

  const openBuilderFrom = (stepId) => {
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

  // Track user source when home page loads

  useEffect(() => {
    trackReferrer();
  }, []);

  // Calculate optimal spacing based on button width

  const handleStartBuilding = () => {
    // Track referrer and builder start when user clicks the button

    trackReferrer();
    trackCTAClick("home_primary_cta", { page: window.location.pathname });

    trackBuilderStart("home_page_button");

    openBuilderFrom("home_builder_cta");
  };

  const handleNavbarStart = () => {
    trackReferrer();
    trackCTAClick("home_nav_primary_cta", { page: window.location.pathname });
    trackBuilderStart("home_nav_primary_cta");
    openBuilderFrom("home_nav_primary_cta");
  };

  const handleLogout = () => {
    localStorage.removeItem("resumeUser");
    localStorage.removeItem("resumeToken");
    window.location.reload();
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

  return (
    <div>
      <SEO
        title="HiHired - AI-Powered Resume Builder | Advanced Machine Learning Technology"
        description="Experience the future of resume building with our AI-powered platform. Advanced machine learning algorithms optimize your resume, analyze job descriptions, and increase interview rates by 3x. Free AI resume builder."
        keywords="AI resume builder, artificial intelligence resume, machine learning resume builder, AI-powered resume, smart resume AI, neural network resume optimization, AI job matching, intelligent resume builder"
        canonical="https://hihired.org/"
      />

      <nav className="home-navbar">
        <div className="home-navbar-left">
          <span className="home-logo">HiHired</span>
        </div>

        {/* Desktop Navigation */}

        <div className="home-navbar-center desktop-nav">
          <button
            className="home-nav-link"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              font: "inherit",
            }}
          >
            Home
          </button>

          <a
            href="#job-match"
            className="home-nav-link"
            onClick={(e) => {
              e.preventDefault();

              document
                .getElementById("job-match")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            How It Works
          </a>

          <a
            href="#product"
            className="home-nav-link"
            onClick={(e) => {
              e.preventDefault();

              document
                .getElementById("product")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Features
          </a>
          {/* Hidden - Apply to Jobs feature







          {user && (







            <Link







              to="/apply"







              className="home-nav-link"







            >







              Apply to Jobs







            </Link>







          )}







          */}

          <a
            href="#contact"
            className="home-nav-link"
            onClick={(e) => {
              e.preventDefault();

              document
                .getElementById("contact")
                .scrollIntoView({ behavior: "smooth" });
            }}
          >
            Contact
          </a>
        </div>

        <div className="home-navbar-right">
          <button
            className="home-start-btn"
            onClick={handleNavbarStart}
            type="button"
          >
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
                <span className="home-account-name">
                  {displayName || "Account"}
                </span>
                <span
                  className={`home-account-caret ${
                    showAccountMenu ? "open" : ""
                  }`}
                  aria-hidden="true"
                >
                  ▾
                </span>
              </button>
              {showAccountMenu && (
                <div className="home-account-dropdown" role="menu">
                  <button
                    type="button"
                    className="home-account-item"
                    role="menuitem"
                    onClick={() => {
                      setShowAccountMenu(false);
                      setShowResumeHistory(true);
                    }}
                  >
                    Resume History
                  </button>
                  <Link
                    to="/account"
                    className="home-account-item"
                    role="menuitem"
                    onClick={() => setShowAccountMenu(false)}
                  >
                    Membership
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin/memberships"
                      className="home-account-item"
                      role="menuitem"
                      onClick={() => setShowAccountMenu(false)}
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    type="button"
                    className="home-account-item home-account-logout"
                    role="menuitem"
                    onClick={() => {
                      setShowAccountMenu(false);
                      handleLogout();
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="home-auth-btn"
              onClick={() => {
                setAuthContextMessage("");
                setPendingBuilderStep(null);
                setShowAuthModal(true);
              }}
              style={{ flexShrink: 0 }}
            >
              Login
            </button>
          )}

          {/* Mobile Menu Button */}

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

      {/* Mobile Menu Overlay */}

      {showMobileMenu && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setShowMobileMenu(false)}
        >
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <button
              className="mobile-nav-cta"
              onClick={() => {
                handleNavbarStart();
                setShowMobileMenu(false);
              }}
            >
              Start Free
            </button>

            <button
              className="mobile-nav-link"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });

                setShowMobileMenu(false);
              }}
            >
              Home
            </button>

            <a
              href="#job-match"
              className="mobile-nav-link"
              onClick={(e) => {
                e.preventDefault();

                document
                  .getElementById("job-match")
                  ?.scrollIntoView({ behavior: "smooth" });

                setShowMobileMenu(false);
              }}
            >
              How It Works
            </a>

            <a
              href="#product"
              className="mobile-nav-link"
              onClick={(e) => {
                e.preventDefault();

                document
                  .getElementById("product")
                  ?.scrollIntoView({ behavior: "smooth" });

                setShowMobileMenu(false);
              }}
            >
              Features
            </a>

            {user && (
              <Link
                to="/account"
                className="mobile-nav-link"
                onClick={() => setShowMobileMenu(false)}
              >
                Membership
              </Link>
            )}

            {/* Hidden - Apply to Jobs feature







            {user && (







              <Link







                to="/apply"







                className="mobile-nav-link"







                onClick={() => setShowMobileMenu(false)}







              >







                Apply to Jobs







              </Link>







            )}







            */}

            <a
              href="#contact"
              className="mobile-nav-link"
              onClick={(e) => {
                e.preventDefault();

                document
                  .getElementById("contact")
                  .scrollIntoView({ behavior: "smooth" });

                setShowMobileMenu(false);
              }}
            >
              Contact
            </a>
          </div>
        </div>
      )}

      {/* Simple Hero Section with Resume */}

      <SimpleHero
        onImportClick={() => {
          trackBuilderStart("import_resume");

          openBuilderFrom("home_import_cta");
        }}
        onCreateClick={() => {
          trackBuilderStart("create_resume");

          openBuilderFrom("home_create_cta");
        }}
      />

      {/* Job Match Feature */}

      <div className="home-jobdesc-feature" id="job-match">
        <div className="home-jobdesc-surface">
          <div className="home-jobdesc-header">
            <span className="home-jobdesc-pill">✨ New · Job Match</span>
            <h2>Tailor every resume to the job in front of you</h2>
            <p>
              Paste any job description and Job Match highlights the must-have
              skills, maps them to your proven experience, and ships a polished,
              ATS-ready version in seconds without fabricating anything.
            </p>
          </div>

          <div className="home-jobmatch-grid">
            <div className="home-jobmatch-card">
              <div className="home-jobmatch-card-icon">📥</div>
              <div className="home-jobmatch-card-title">Drop in the job post</div>
              <p>
                We scan the description to surface must-have skills, keywords, and hiring
                priorities straight from the employer.
              </p>
            </div>

            <div className="home-jobmatch-card">
              <div className="home-jobmatch-card-icon">✍️</div>
              <div className="home-jobmatch-card-title">Refine your experience</div>
              <p>
                Bullet points get refreshed with role-specific phrasing, quantified wins,
                and context that keeps your voice authentic while never inventing new experience.
              </p>
            </div>

            <div className="home-jobmatch-card">
              <div className="home-jobmatch-card-icon">🚀</div>
              <div className="home-jobmatch-card-title">Ship an ATS-ready resume</div>
              <p>
                Export a polished version with match scores, keyword coverage, and formatting
                engineered to clear automated screeners.
              </p>
            </div>
          </div>

          <div className="home-jobmatch-flags">
            <div className="home-jobmatch-flag">
              <span className="home-jobmatch-flag-icon">🔍</span>
              Extracts critical skills from any job description
            </div>
            <div className="home-jobmatch-flag">
              <span className="home-jobmatch-flag-icon">🧠</span>
              Aligns your real experience with role requirements
            </div>
            <div className="home-jobmatch-flag">
              <span className="home-jobmatch-flag-icon">📈</span>
              Surfaces match score and ATS-ready keywords
            </div>
          </div>

          <div className="home-resume-flow">
            <div className="home-resume-steps">
              <h3>Build a tailored resume in four steps</h3>
              <ol>
                <li>
                  <span className="home-resume-step-title">Kick off instantly</span>
                  Sign in, then import your current resume or start from a clean template with your details.
                </li>
                <li>
                  <span className="home-resume-step-title">Paste the job description</span>
                  Our AI maps the role&apos;s must-have skills to your real experience without inventing facts.
                </li>
                <li>
                  <span className="home-resume-step-title">Refine with guided edits</span>
                  Approve suggested bullet points, quantify wins, and keep your voice polished for recruiters.
                </li>
                <li>
                  <span className="home-resume-step-title">Match fresh roles</span>
                  Turn on Job Match to see which new company openings fit your resume before you apply.
                </li>
              </ol>
            </div>

            <div className="home-job-refresh">
              <h3>Daily job matches from real companies</h3>
              <p>
                We refresh hiring feeds every morning so you see live roles from teams that are actively hiring—not recycled
                zombie listings like you&apos;ll find on LinkedIn.
              </p>
              <ul>
                <li>Compare your resume against today&apos;s openings with instant match scores.</li>
                <li>Spot skill gaps the moment a new posting lands so you can update before applying.</li>
                <li>Track only verified roles sourced directly from company career pages.</li>
              </ul>
            </div>
          </div>

          <div className="home-jobdesc-ctaWrap">
            <button
              className="home-btn primary home-jobdesc-cta"
              onClick={() => {
                openBuilderFrom("home_jobdesc_cta");
              }}
            >
              🚀 Try Job Match
            </button>
            <span className="home-jobdesc-cta-note">No credit card required · instant resume tailoring</span>
          </div>
        </div>
      </div>

      <div className="home-hero">
        <div className="home-hero-content">
          <div className="hero-main-content">
            <div className="hero-badge">✨ New: Job Match</div>

            <h1 className="hero-title">
              📝 Build Job-Matched Resumes That Land Interviews
            </h1>

            <p className="hero-subtitle">
              Sign in and start tailoring your resume in under 60 seconds. Paste any job description and our AI keeps your real accomplishments front and center.
            </p>

            <div className="hero-features">
              <div className="hero-feature">
                <span>🎯 Built around your proven experience—no filler</span>
              </div>

              <div className="hero-feature">
                <span>⚡ Jump in right after a quick sign-in</span>
              </div>

              <div className="hero-feature">
                <span>📈 Instant ATS keyword and recruiter insights</span>
              </div>
            </div>

            <div className="home-cta-buttons">
              <button
                className="home-btn primary"
                onClick={handleStartBuilding}
              >
                {user
                  ? "📝 Continue in the Builder"
                  : "🚀 Sign In & Start My Resume"}
              </button>
            </div>
          </div>

          <div className="home-trusted">
            <span>🌟 Trusted by job seekers worldwide</span>

            <div className="home-logos">
              <span>🎓 Students</span>

              <span>💼 Professionals</span>

              <span>🔄 Career Changers</span>

              <span>🌟 Recent Grads</span>
            </div>
          </div>
        </div>

        <div className="home-hero-image">
          <div className="ai-impact-preview">
            <div className="impact-header">
              <div className="impact-title">📝 Professional Resume Builder</div>

              <div className="impact-subtitle">
                Intelligent Technology That Delivers Results
              </div>
            </div>

            <div className="impact-stats">
              <div className="stat-item">
                <div className="stat-number">🤖 AI</div>

                <div className="stat-label">Powered Tech</div>
              </div>

              <div className="stat-item">
                <div className="stat-number">⚡ Smart</div>

                <div className="stat-label">Auto-Optimize</div>
              </div>

              <div className="stat-item">
                <div className="stat-number">📊 ML</div>

                <div className="stat-label">Algorithms</div>
              </div>
            </div>

            <div className="comparison-section">
              <div className="comparison-item before">
                <div className="comparison-label">Before</div>

                <div className="comparison-content">
                  <div className="keyword-match">❌ Manual keywords</div>

                  <div className="skill-alignment">❌ Generic content</div>

                  <div className="ats-score">❌ Hours of work</div>
                </div>
              </div>

              <div className="comparison-item after">
                <div className="comparison-label">After</div>

                <div className="comparison-content">
                  <div className="keyword-match">✅ AI powered</div>

                  <div className="skill-alignment">✅ Smart tools</div>

                  <div className="ats-score">✅ Fast AI</div>
                </div>
              </div>
            </div>

            <div className="ai-features">
              <div className="feature-item">
                <span>🤖 AI content generation</span>
              </div>

              <div className="feature-item">
                <span>📊 Smart skill analysis</span>
              </div>

              <div className="feature-item">
                <span>🎯 AI job matching</span>
              </div>

              <div className="feature-item">
                <span>⚡ Real-time AI optimize</span>
              </div>

              <div className="feature-item">
                <span>📄 AI-formatted PDF</span>
              </div>

              <div className="feature-item">
                <span>📱 Works on mobile</span>
              </div>
            </div>

            <div className="ai-benefits">
              <div className="benefit-highlight">
                <span>🤖 AI analyzes instantly</span>
              </div>

              <div className="benefit-highlight">
                <span>📊 ML improves results</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Features Section */}

      <div className="what-makes-different">
        <div className="what-makes-different-content">
          <h2>🚀 Smart Features That Set Us Apart</h2>

          <p>
            Experience professional resume building that gets results. Our
            intelligent system analyzes successful resumes and job postings to
            give you the competitive edge.
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🧠</div>

              <div className="feature-title">Neural Network Analysis</div>

              <div className="feature-description">
                Our AI uses deep learning to understand job requirements and
                intelligently match your experience to what employers are
                looking for.
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎯</div>

              <div className="feature-title">Smart Keyword Optimization</div>

              <div className="feature-description">
                Advanced algorithms analyze job descriptions and automatically
                optimize your resume with the most relevant keywords and
                phrases.
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>

              <div className="feature-title">Machine Learning Insights</div>

              <div className="feature-description">
                Our AI continuously learns from successful resumes and hiring
                patterns to provide data-driven recommendations for improvement.
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚡</div>

              <div className="feature-title">Real-Time AI Processing</div>

              <div className="feature-description">
                Get instant AI-powered suggestions and optimizations as you
                build your resume, with real-time feedback and improvements.
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔮</div>

              <div className="feature-title">Predictive Success Modeling</div>

              <div className="feature-description">
                Our AI predicts resume success rates and provides actionable
                insights to maximize your chances of landing interviews.
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎨</div>

              <div className="feature-title">AI-Driven Formatting</div>

              <div className="feature-description">
                Intelligent formatting algorithms ensure your resume is
                perfectly structured for both human readers and ATS systems.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Stories Section */}

      <div className="success-stories-section">
        <div className="success-stories-content">
          <h2 className="success-stories-title">
            🤖 What People Say About Our AI
          </h2>

          <p className="success-stories-subtitle">
            Real success stories from job seekers who experienced the power of
            AI-driven resume optimization
          </p>

          <div className="success-stories-grid">
            <div className="success-story-card">
              <div className="story-header">
                <div className="story-avatar">MC</div>

                <div className="story-info">
                  <div className="story-name">Michael Chen</div>

                  <div className="story-role">Software Engineer at Google</div>
                </div>
              </div>

              <div className="story-content">
                "The AI technology is incredible! 🤖 It analyzed my experience
                and automatically optimized my resume for each job. The
                AI-powered keyword matching got me past every ATS system. Landed
                my dream job in 3 weeks!"
              </div>

              <div className="story-stats">
                <span className="stat">Clean format</span>

                <span className="stat">Easy to use</span>
              </div>
            </div>

            <div className="success-story-card">
              <div className="story-header">
                <div className="story-avatar">👩‍💻</div>

                <div className="story-info">
                  <div className="story-name">Sarah Rodriguez</div>

                  <div className="story-role">Product Manager at Amazon</div>
                </div>
              </div>

              <div className="story-content">
                "The AI is like having a personal career coach! 🤖 It
                intelligently restructured my experience to match job
                requirements and used machine learning to optimize keywords. My
                interview rate skyrocketed from 5% to 45%!"
              </div>

              <div className="story-stats">
                <span className="stat">📊 92/100 ATS Score</span>

                <span className="stat">🚀 Hired in 3 weeks</span>
              </div>
            </div>

            <div className="success-story-card">
              <div className="story-header">
                <div className="story-avatar">👨‍🎓</div>

                <div className="story-info">
                  <div className="story-name">David Kim</div>

                  <div className="story-role">Data Scientist at Meta</div>
                </div>
              </div>

              <div className="story-content">
                "The AI transformed my basic resume into a professional
                masterpiece! 🤖 It used intelligent algorithms to highlight my
                projects and skills in ways I never thought of. Now recruiters
                are contacting me daily!"
              </div>

              <div className="story-stats">
                <span className="stat">📈 3.2x More Callbacks</span>

                <span className="stat">💼 First job out of college</span>
              </div>
            </div>
          </div>

          <div className="success-metrics">
            <div className="metric-item">
              <div className="metric-number">50,000+</div>

              <div className="metric-label">AI-Optimized Resumes</div>
            </div>

            <div className="metric-item">
              <div className="metric-number">92%</div>

              <div className="metric-label">AI Accuracy Rate</div>
            </div>

            <div className="metric-item">
              <div className="metric-number">3.2x</div>

              <div className="metric-label">Higher Interview Rate</div>
            </div>

            <div className="metric-item">
              <div className="metric-number">AI-Powered</div>

              <div className="metric-label">Machine Learning</div>
            </div>
          </div>
        </div>
      </div>

      <ProductOverview />

      {/* Auth Modal */}

      {showAuthModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",

            background: "rgba(0,0,0,0.25)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ position: "relative" }}>
              <Login
                contextMessage={authContextMessage}
                onLogin={handleAuthSuccess}
                onClose={() => {
                  setShowAuthModal(false);
                  setPendingBuilderStep(null);
                  setAuthContextMessage("");
                }}
              />
            </div>
          </div>
        )}

      {/* Resume History Modal */}

      {showResumeHistory && (
        <ResumeHistory onClose={() => setShowResumeHistory(false)} />
      )}

      {/* About Section */}

      <About />

      <TeamSection />

      {/* Contact Section */}

      <Contact />

      <footer
        style={{
          marginTop: '60px',
          padding: '40px 20px',
          borderTop: '1px solid #e2e8f0',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '0.95rem',
        }}
      >
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <span>© {new Date().getFullYear()} HiHired. All rights reserved.</span>
          <nav className="footer-menu">
            <a
              href="#about"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("about-what-we-are-building")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              About Us
            </a>
            <a
              href="#team"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("team")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Team
            </a>
            <Link to="/terms">
              Terms of Service
            </Link>
            <Link to="/privacy">
              Privacy Policy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default Home;
