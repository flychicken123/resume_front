import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navigation.css';

const Navigation = ({ showAuthModal, setShowAuthModal, showIntegratedModal, setShowIntegratedModal }) => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const displayName = typeof user === 'string' ? user : (user?.name || user?.email || '');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('resumeUser');
    localStorage.removeItem('resumeToken');
    window.location.href = '/';
  };

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
            className="nav-link nav-button"
            onClick={() => {
              if (setShowIntegratedModal) setShowIntegratedModal(true);
              else navigate('/builder');
            }}
          >
            Builder
          </button>
          {user && (
            <Link to="/history" className="nav-link">
              Resume History
            </Link>
          )}
          <Link to="/pricing" className="nav-link">
            Pricing
          </Link>
          {isAdmin && (
            <Link to="/admin/memberships" className="nav-link">
              Admin
            </Link>
          )}
          <Link to="/#about" className="nav-link">About</Link>
          <Link to="/#contact" className="nav-link">Contact</Link>
        </div>

        <div className="nav-navbar-right">
          {user && (
            <span className="desktop-username">
              {displayName}
            </span>
          )}
          <button
            className="nav-auth-btn"
            onClick={() => {
              if (user) {
                handleLogout();
              } else {
                if (setShowAuthModal) setShowAuthModal(true);
                else navigate('/login');
              }
            }}
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
            <Link to="/" className="mobile-nav-link" onClick={() => setShowMobileMenu(false)}>
              Home
            </Link>
            <button
              className="mobile-nav-link"
              onClick={() => {
                setShowMobileMenu(false);
                if (setShowIntegratedModal) setShowIntegratedModal(true);
                else navigate('/builder');
              }}
            >
              Builder
            </button>
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
            {isAdmin && (
              <Link
                to="/admin/memberships"
                className="mobile-nav-link"
                onClick={() => setShowMobileMenu(false)}
              >
                Admin
              </Link>
            )}
            <Link
              to="/#about"
              className="mobile-nav-link"
              onClick={() => setShowMobileMenu(false)}
            >
              About
            </Link>
            <Link
              to="/#contact"
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
                  if (setShowAuthModal) setShowAuthModal(true);
                  else navigate('/login');
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





