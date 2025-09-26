import React, { useState, useEffect, useRef } from 'react';
import './Home.css';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login from './auth/Login';
import IntegratedBuilderStart from './IntegratedBuilderStart';
import ResumeHistory from './ResumeHistory';
import SimpleHero from './SimpleHero';
import About from './About';
import Contact from './Contact';

import { setLastStep } from '../utils/exitTracking';
import SEO from './SEO';
import { trackReferrer, trackBuilderStart } from './Analytics';

const Home = () => {
  const { user, login, isAdmin } = useAuth();
  const displayName = typeof user === 'string' ? user : (user?.name || user?.email || '');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showIntegratedModal, setShowIntegratedModal] = useState(false);
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

    const handleStartBuilding = () => {
    // Track referrer and builder start when user clicks the button
    trackReferrer();
    trackBuilderStart('home_page_button');
    setLastStep('home_builder_cta');
    setShowIntegratedModal(true);
  };

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
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
          >
            Home
          </button>
          <button 
            className="home-nav-link" 
            onClick={() => {
              setShowIntegratedModal(true);
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
          >
            Builder
          </button>
          {user && (
            <button
              className="home-nav-link"
              onClick={() => setShowResumeHistory(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
            >
              Resume History
            </button>
          )}
          <Link
            to="/pricing"
            className="home-nav-link"
            style={{ textDecoration: 'none' }}
          >
            Pricing
          </Link>
          {isAdmin && (
            <Link to="/admin/memberships" className="home-nav-link">
              Admin
            </Link>
          )}
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
              {displayName}
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
            <button 
              className="mobile-nav-link"
              onClick={() => {
                setShowMobileMenu(false);
                setLastStep('home_mobile_builder_cta');
                setShowIntegratedModal(true);
              }}
            >
              Builder
            </button>
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
            <Link
              to="/pricing"
              className="mobile-nav-link"
              onClick={() => setShowMobileMenu(false)}
              style={{ textDecoration: 'none' }}
            >
              Pricing
            </Link>
            {isAdmin && (
              <Link
                to="/admin/memberships"
                className="mobile-nav-link"
                onClick={() => setShowMobileMenu(false)}
              >
                Admin
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
      
      {/* Simple Hero Section with Resume */}
      <SimpleHero 
        onImportClick={() => {
          trackBuilderStart('import_resume');
          setLastStep('home_import_cta');
          setShowIntegratedModal(true);
        }}
        onCreateClick={() => {
          trackBuilderStart('create_resume');
          setLastStep('home_create_cta');
          setShowIntegratedModal(true);
        }}
      />

      {/* Job Description Feature Section */}
      <div className="home-jobdesc-feature">
        <div className="home-jobdesc-feature-content">
          <h2>🎯 Smart Job Matching & Resume Optimization</h2>
          <p>
            Paste any job posting and we'll instantly customize your resume to match what employers are looking for. Our system identifies critical keywords, highlights relevant experience, and formats everything professionally. 
            Beat automated screening systems and get noticed by hiring managers.
          </p>
          <div className="home-jobdesc-feature-benefits">
            <div className="benefit-item">
              <span>🔍 Keyword analysis & optimization</span>
            </div>
            <div className="benefit-item">
              <span>📊 Smart skill prioritization</span>
            </div>
            <div className="benefit-item">
              <span>🎯 ATS-friendly formatting</span>
            </div>
          </div>
          <button 
            className="home-btn primary home-jobdesc-cta" 
            onClick={() => {
              setLastStep('home_jobdesc_cta');
              setShowIntegratedModal(true);
            }}
          >
📝 Start Building Your Resume
          </button>
        </div>
      </div>
      
      <div className="home-hero">
        <div className="home-hero-content">
          <div className="hero-main-content">
            <h1 className="hero-title">📝 Build Professional Resumes & Land Your Dream Job</h1>
            <p className="hero-subtitle">
              Create stunning resumes that get noticed by employers and pass through applicant tracking systems. From building your resume to applying for jobs - we've got you covered.
            </p>
            <div className="hero-features">
              <div className="hero-feature">
                <span>📝 Professional resume templates</span>
              </div>
              <div className="hero-feature">
                <span>🎯 Optimized for job applications</span>
              </div>
              <div className="hero-feature">
                <span>⚡ Apply to jobs instantly</span>
              </div>
            </div>
            <div className="home-cta-buttons">
              <button className="home-btn primary" onClick={handleStartBuilding}>
                {user ? '📝 Continue Building Resume' : '🚀 Start Building Your Resume - Free!'}
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
              <div className="impact-subtitle">Intelligent Technology That Delivers Results</div>
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
            Experience professional resume building that gets results. 
            Our intelligent system analyzes successful resumes and job postings to give you the competitive edge.
          </p>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🧠</div>
              <div className="feature-title">Neural Network Analysis</div>
              <div className="feature-description">
                Our AI uses deep learning to understand job requirements and intelligently match your experience to what employers are looking for.
              </div>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <div className="feature-title">Smart Keyword Optimization</div>
              <div className="feature-description">
                Advanced algorithms analyze job descriptions and automatically optimize your resume with the most relevant keywords and phrases.
              </div>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <div className="feature-title">Machine Learning Insights</div>
              <div className="feature-description">
                Our AI continuously learns from successful resumes and hiring patterns to provide data-driven recommendations for improvement.
              </div>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <div className="feature-title">Real-Time AI Processing</div>
              <div className="feature-description">
                Get instant AI-powered suggestions and optimizations as you build your resume, with real-time feedback and improvements.
              </div>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔮</div>
              <div className="feature-title">Predictive Success Modeling</div>
              <div className="feature-description">
                Our AI predicts resume success rates and provides actionable insights to maximize your chances of landing interviews.
              </div>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <div className="feature-title">AI-Driven Formatting</div>
              <div className="feature-description">
                Intelligent formatting algorithms ensure your resume is perfectly structured for both human readers and ATS systems.
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Success Stories Section */}
      <div className="success-stories-section">
        <div className="success-stories-content">
          <h2 className="success-stories-title">🤖 What People Say About Our AI</h2>
          <p className="success-stories-subtitle">Real success stories from job seekers who experienced the power of AI-driven resume optimization</p>
          
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
                "The AI technology is incredible! 🤖 It analyzed my experience and automatically optimized my resume for each job. The AI-powered keyword matching got me past every ATS system. Landed my dream job in 3 weeks!"
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
                "The AI is like having a personal career coach! 🤖 It intelligently restructured my experience to match job requirements and used machine learning to optimize keywords. My interview rate skyrocketed from 5% to 45%!"
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
                "The AI transformed my basic resume into a professional masterpiece! 🤖 It used intelligent algorithms to highlight my projects and skills in ways I never thought of. Now recruiters are contacting me daily!"
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

      {/* Integrated Builder Start Modal */}
      {showIntegratedModal && (
        <IntegratedBuilderStart onClose={() => setShowIntegratedModal(false)} />
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







