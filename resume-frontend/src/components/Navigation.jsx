import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { setLastStep } from '../utils/exitTracking';
import './Navigation.css';
import {
  BUILDER_TARGET_STEP_KEY,
  BUILDER_TARGET_JOB_MATCHES,
  BUILDER_TARGET_IMPORT,
  BUILDER_LAST_STEP_KEY,
  BUILDER_IMPORT_STEP_ID,
} from '../constants/builder';

const Navigation = ({ showAuthModal, setShowAuthModal, showIntegratedModal, setShowIntegratedModal }) => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const displayName = typeof user === 'string' ? user : (user?.name || user?.email || '');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem('resumeUser');
    localStorage.removeItem('resumeToken');
    window.location.href = '/';
  };

  const openBuilder = (source, options = {}) => {
    const { targetStep } = options;
    setLastStep(source);
    if (typeof window !== 'undefined') {
      if (targetStep) {
        window.localStorage.setItem(BUILDER_TARGET_STEP_KEY, targetStep);
        if (targetStep === BUILDER_TARGET_IMPORT) {
          window.localStorage.setItem(BUILDER_LAST_STEP_KEY, String(BUILDER_IMPORT_STEP_ID));
        }
      } else {
        window.localStorage.removeItem(BUILDER_TARGET_STEP_KEY);
      }
    }
    if (setShowIntegratedModal) {
      setShowIntegratedModal(true);
    } else {
      if (targetStep === BUILDER_TARGET_JOB_MATCHES) {
        navigate('/builder?view=jobs');
      } else {
        navigate('/builder');
      }
    }
  };

  useEffect(() => {
    if (!showAccountMenu) {
      return;
    }

    const handleClickOutside = (event) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setShowAccountMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAccountMenu]);

  return (
    <>
      <nav className="nav-navbar">
        <div className="nav-navbar-left">
          <Link to="/" className="nav-logo">HiHired</Link>
        </div>

        {/* Desktop Navigation */}
        <div className="nav-navbar-center desktop-nav">
          <Link to="/" className="nav-link">Home</Link>
          <button
            type="button"
            className="nav-link nav-button"
            onClick={() => openBuilder('nav_jobs_cta', { targetStep: BUILDER_TARGET_JOB_MATCHES })}
          >
            Jobs
          </button>
          <button
            className="nav-link nav-button"
            onClick={() => openBuilder('nav_builder_cta', { targetStep: BUILDER_TARGET_IMPORT })}
          >
            Builder
          </button>
          <Link to="/#job-match" className="nav-link">
            Job Match
          </Link>
          {user && (
            <Link to="/history" className="nav-link">
              Resume History
            </Link>
          )}
          <Link to="/pricing" className="nav-link">
            Pricing
          </Link>
          {isAdmin && (
            <>
              <Link to="/admin/analytics" className="nav-link">
                Analytics
              </Link>
              <Link to="/admin/memberships" className="nav-link">
                Admin
              </Link>
            </>
          )}
          <Link to="/#about" className="nav-link">About</Link>
          <Link to="/contact" className="nav-link">Contact</Link>
        </div>

        <div className="nav-navbar-right">
          {user ? (
            <div className="nav-account-menu" ref={accountMenuRef}>
              <button
                type="button"
                className="nav-account-trigger"
                aria-haspopup="true"
                aria-expanded={showAccountMenu}
                onClick={() => setShowAccountMenu((prev) => !prev)}
              >
                <span className="nav-account-name">{displayName || 'Account'}</span>
                <span
                  className={`nav-account-caret ${showAccountMenu ? 'open' : ''}`}
                  aria-hidden="true"
                >
                  ▾
                </span>
              </button>
              {showAccountMenu && (
                <div className="nav-account-dropdown" role="menu">
                  <Link
                    to="/account"
                    className="nav-account-item"
                    role="menuitem"
                    onClick={() => setShowAccountMenu(false)}
                  >
                    Membership
                  </Link>
                  <button
                    type="button"
                    className="nav-account-item nav-account-logout"
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
              className="nav-auth-btn"
              onClick={() => {
                if (setShowAuthModal) {
                  setShowAuthModal(true);
                } else {
                  navigate('/login');
                }
              }}
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
            <Link to="/" className="mobile-nav-link" onClick={() => setShowMobileMenu(false)}>
              Home
            </Link>
            <button
              className="mobile-nav-link"
              type="button"
              onClick={() => {
                setShowMobileMenu(false);
                openBuilder('nav_mobile_jobs_cta', { targetStep: BUILDER_TARGET_JOB_MATCHES });
              }}
            >
              Jobs
            </button>
            <button
              className="mobile-nav-link"
              onClick={() => {
                setShowMobileMenu(false);
                openBuilder('nav_mobile_builder_cta', { targetStep: BUILDER_TARGET_IMPORT });
              }}
            >
              Builder
            </button>
            <Link
              to="/#job-match"
              className="mobile-nav-link"
              onClick={() => setShowMobileMenu(false)}
            >
              Job Match
            </Link>
            {user && (
              <Link
                to="/history"
                className="mobile-nav-link"
                onClick={() => setShowMobileMenu(false)}
              >
                Resume History
              </Link>
            )}
            <Link
              to="/pricing"
              className="mobile-nav-link"
              onClick={() => setShowMobileMenu(false)}
            >
              Pricing
            </Link>
            {user && (
              <Link
                to="/account"
                className="mobile-nav-link"
                onClick={() => setShowMobileMenu(false)}
              >
                Membership
              </Link>
            )}
            {isAdmin && (
              <>
                <Link
                  to="/admin/analytics"
                  className="mobile-nav-link"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Analytics
                </Link>
                <Link
                  to="/admin/memberships"
                  className="mobile-nav-link"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Admin
                </Link>
              </>
            )}
            <Link
              to="/#about"
              className="mobile-nav-link"
              onClick={() => setShowMobileMenu(false)}
            >
              About
            </Link>
            <Link
              to="/contact"
              className="mobile-nav-link"
              onClick={() => setShowMobileMenu(false)}
            >
              Contact
            </Link>
            {user ? (
              <button
                className="mobile-nav-link"
                onClick={() => {
                  setShowMobileMenu(false);
                  handleLogout();
                }}
              >
                Logout
              </button>
            ) : (
              <button
                className="mobile-nav-link"
                onClick={() => {
                  setShowMobileMenu(false);
                  if (setShowAuthModal) {
                    setShowAuthModal(true);
                  } else {
                    navigate('/login');
                  }
                }}
              >
                Login
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navigation;
