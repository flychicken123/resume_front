import React, { useState, useEffect, useRef } from 'react';
import './Home.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login from './auth/Login';
import JobDescModal from './JobDescModal';
import ResumeHistory from './ResumeHistory';
import About from './About';
import Contact from './Contact';
import SEO from './SEO';
import ImportResumeModal from './ImportResumeModal';
import { trackReferrer, trackBuilderStart } from './Analytics';

const Home = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showJobDescModal, setShowJobDescModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showResumeHistory, setShowResumeHistory] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [usernameWidth, setUsernameWidth] = useState(100);
  const usernameRef = useRef(null);
  const buttonRef = useRef(null);



  // Track user source when home page loads
  useEffect(() => {
    trackReferrer();
    trackBuilderStart('home_page_load');
  }, []);

  // Calculate optimal spacing based on button width
  useEffect(() => {
    if (buttonRef.current && user) {
      const buttonWidth = buttonRef.current.offsetWidth;
      const minSpacing = 20; // Minimum spacing in pixels
      const optimalSpacing = Math.max(buttonWidth + minSpacing, 100); // At least 100px or button width + 20px
      setUsernameWidth(optimalSpacing);
    }
  }, [user]);

  // Handler for job description submission
  const handleJobDescSubmit = (description) => {
    // Store job description in localStorage for the builder to access
    localStorage.setItem('jobDescription', description);
    setShowJobDescModal(false);
  };

  const handleProceedAfterChoice = () => {
    setShowJobDescModal(false);
    setShowImportModal(true);
  };
  
  const handleStartBuilding = () => {
    // Track referrer and builder start when user clicks the button
    trackReferrer();
    trackBuilderStart('home_page_button');
    navigate('/builder');
  };

  const handleViewTemplates = () => {
    trackReferrer();
    trackBuilderStart('home_page_templates');
    navigate('/templates');
  };
  
  return (
    <div>
      <SEO 
        title="HiHired - Free AI Resume Builder | Build Professional Resumes Online"
        description="Create professional resumes in minutes with our free AI resume builder. Build ATS-friendly resumes, optimize for job descriptions, and land your dream job. No registration required."
        keywords="resume builder, AI resume builder, free resume builder, professional resume, resume maker, build resume, write resume, create resume, resume template, ATS resume, job resume, career resume, online resume builder"
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
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', font: 'inherit' }}
          >
            Home
          </button>
          <Link to="/builder" className="home-nav-link">Builder</Link>
          {user && (
            <button 
              className="home-nav-link" 
              onClick={() => setShowResumeHistory(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', font: 'inherit' }}
            >
              Resume History
            </button>
          )}
          <a href="#about" className="home-nav-link" onClick={(e) => {
            e.preventDefault();
            document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
          }}>About</a>
          <a href="#contact" className="home-nav-link" onClick={(e) => {
            e.preventDefault();
            document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
          }}>Contact</a>
        </div>
        
        <div className="home-navbar-right">
          {user ? (
            <span 
              ref={usernameRef}
              className="desktop-username"
              style={{ 
                color: '#3b82f6', 
                fontWeight: 500,
                marginRight: `${usernameWidth}px`
              }}
            >
              {user}
            </span>
          ) : null}
          <button 
            ref={buttonRef}
            className="home-auth-btn" 
            onClick={() => {
              if (user) {
                localStorage.removeItem('resumeUser');
                window.location.reload();
              } else {
                setShowAuthModal(true);
              }
            }}
            style={{ flexShrink: 0 }}
          >
{user ? 'Logout' : 'Login'}
          </button>
          
          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-button"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Toggle menu"
          >
            <span className={`hamburger ${showMobileMenu ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </nav>
      
      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="mobile-menu-overlay" onClick={() => setShowMobileMenu(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <button 
              className="mobile-nav-link" 
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setShowMobileMenu(false);
              }}
            >
              Home
            </button>
            <Link 
              to="/builder" 
              className="mobile-nav-link"
              onClick={() => setShowMobileMenu(false)}
            >
              Builder
            </Link>
            {user && (
              <button 
                className="mobile-nav-link" 
                onClick={() => {
                  setShowResumeHistory(true);
                  setShowMobileMenu(false);
                }}
              >
                Resume History
              </button>
            )}
            <a 
              href="#about" 
              className="mobile-nav-link" 
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
                setShowMobileMenu(false);
              }}
            >
              About
            </a>
            <a 
              href="#contact" 
              className="mobile-nav-link" 
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
                setShowMobileMenu(false);
              }}
            >
              Contact
            </a>
          </div>
        </div>
      )}
      
      {/* Job Description Feature Section */}
      <div className="home-jobdesc-feature">
        <div className="home-jobdesc-feature-content">
          <h2>Match Your Resume to Any Job</h2>
          <p>
            Paste a job description and we'll help you customize your resume to highlight the right skills and experience. 
            No more generic resumes that get lost in the pile.
          </p>
          <div className="home-jobdesc-feature-benefits">
            <div className="benefit-item">
              <span>Smart keyword matching</span>
            </div>
            <div className="benefit-item">
              <span>Relevant skill highlighting</span>
            </div>
            <div className="benefit-item">
              <span>ATS-friendly formatting</span>
            </div>
          </div>
          <button 
            className="home-btn primary home-jobdesc-cta" 
            onClick={() => {
              if (!user) {
                setShowAuthModal(true);
              } else {
                setShowJobDescModal(true);
              }
            }}
          >
Start Building with Job Description
          </button>
        </div>
      </div>
      
      <div className="home-hero">
        <div className="home-hero-content">
          <div className="hero-main-content">
            <h1 className="hero-title">Build Better Resumes</h1>
            <p className="hero-subtitle">
              Create professional resumes that actually get noticed. 
              Our tools help you format, organize, and optimize your experience for any job application.
            </p>
            <div className="hero-features">
              <div className="hero-feature">
                <span>Quick and easy to use</span>
              </div>
              <div className="hero-feature">
                <span>Professional templates</span>
              </div>
              <div className="hero-feature">
                <span>Free to use</span>
              </div>
            </div>
            <div className="home-cta-buttons">
              <button className="home-btn primary" onClick={handleStartBuilding}>
                {user ? 'Continue Building' : 'Start Building Now'}
              </button>
            </div>
          </div>
          <div className="home-trusted">
            <span>Used by job seekers everywhere</span>
            <div className="home-logos">
              <span>Students</span>
              <span>Professionals</span>
              <span>Career Changers</span>
              <span>Recent Grads</span>
            </div>
          </div>
        </div>
        <div className="home-hero-image">
          <div className="ai-impact-preview">
            <div className="impact-header">
              <div className="impact-title">Resume Builder</div>
              <div className="impact-subtitle">Professional Templates</div>
            </div>
            
            <div className="impact-stats">
              <div className="stat-item">
                <div className="stat-number">Free</div>
                <div className="stat-label">No Hidden Costs</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">Fast</div>
                <div className="stat-label">Quick Setup</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">Easy</div>
                <div className="stat-label">Simple to Use</div>
              </div>
            </div>
            
            <div className="comparison-section">
              <div className="comparison-item before">
                <div className="comparison-label">Before</div>
                <div className="comparison-content">
                  <div className="keyword-match">Hard to format</div>
                  <div className="skill-alignment">Inconsistent styling</div>
                  <div className="ats-score">Time consuming</div>
                </div>
              </div>
              
              <div className="comparison-item after">
                <div className="comparison-label">After</div>
                <div className="comparison-content">
                  <div className="keyword-match">Clean layouts</div>
                  <div className="skill-alignment">Professional look</div>
                  <div className="ats-score">Ready in minutes</div>
                </div>
              </div>
            </div>
            
            <div className="ai-features">
              <div className="feature-item">
                <span>Multiple templates</span>
              </div>
              <div className="feature-item">
                <span>Clean formatting</span>
              </div>
              <div className="feature-item">
                <span>Easy editing</span>
              </div>
              <div className="feature-item">
                <span>PDF download</span>
              </div>
              <div className="feature-item">
                <span>Save your work</span>
              </div>
              <div className="feature-item">
                <span>Works on mobile</span>
              </div>
            </div>
            
            <div className="ai-benefits">
              <div className="benefit-highlight">
                <span>Start building right away</span>
              </div>
              <div className="benefit-highlight">
                <span>No signup required</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Success Stories Section */}
      <div className="success-stories-section">
        <div className="success-stories-content">
          <h2 className="success-stories-title">What People Are Saying</h2>
          <p className="success-stories-subtitle">Real feedback from people who've used our resume builder</p>
          
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
                "This resume builder helped me organize my experience better. The templates look professional and the formatting saved me a lot of time."
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
                "HiHired's AI optimization helped me highlight the right skills for product management. The ATS-friendly format got me past the initial screening!"
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
                "As a recent graduate, I was struggling to get interviews. HiHired helped me structure my experience and skills in a way that caught recruiters' attention."
              </div>
              <div className="story-stats">
                <span className="stat">📈 3.2x More Callbacks</span>
                <span className="stat">💼 First job out of college</span>
              </div>
            </div>
          </div>
          
          <div className="success-metrics">
            <div className="metric-item">
              <div className="metric-number">10,000+</div>
              <div className="metric-label">Resumes Created</div>
            </div>
            <div className="metric-item">
              <div className="metric-number">85%</div>
              <div className="metric-label">Interview Rate</div>
            </div>
            <div className="metric-item">
              <div className="metric-number">2,500+</div>
              <div className="metric-label">Jobs Landed</div>
            </div>
            <div className="metric-item">
              <div className="metric-number">4.8★</div>
              <div className="metric-label">User Rating</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Auth Modal */}
      {showAuthModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.25)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ position: 'relative' }}>
            <Login onLogin={(email, token) => { login(email, token); setShowAuthModal(false); }} onClose={() => setShowAuthModal(false)} />
          </div>
        </div>
      )}

      {/* Job Description Modal */}
      {showJobDescModal && (
        <JobDescModal onClose={() => setShowJobDescModal(false)} onJobDescriptionSubmit={handleJobDescSubmit} onProceed={handleProceedAfterChoice} />
      )}

      {/* Import/Manual Choice Modal */}
      {showImportModal && (
        <ImportResumeModal onClose={() => setShowImportModal(false)} />
      )}

      {/* Resume History Modal */}
      {showResumeHistory && (
        <ResumeHistory onClose={() => setShowResumeHistory(false)} />
      )}
      
      {/* About Section */}
      <About />
      
      {/* Contact Section */}
      <Contact />
    </div>
  );
};

export default Home; 