import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './NewHome.css';
import newHomeContent from '../constants/newHomeContent';
import TRUSTED_COMPANIES from '../constants/trustedCompanies';

const NewHome = ({
  user,
  displayName,
  isAdmin,
  variantKey,
  hasResume = false,
  onPrimaryCta,
  onSecondaryCta,
  onSearch,
  onTailorJob,
  onJobAlertClick,
  onOpenLogin,
  onOpenResumeHistory,
  onLogout,
  onTrack,
  onRequireResume,
}) => {
  const [role, setRole] = useState('Product designer');
  const [location, setLocation] = useState('Remote or city');
  const [seniority, setSeniority] = useState('Mid / Senior');

  const {
    quickFilters,
    featuredJobs,
    spotlightTracks,
    playbookSteps,
    perks,
    metrics,
  } = newHomeContent;

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (!hasResume) {
      onRequireResume?.("search");
      return;
    }
    onTrack?.('search_submit', { role, location, seniority });
    onSearch?.({ role, location, seniority });
  };

  const handleTailorClick = (job) => {
    if (!hasResume) {
      onRequireResume?.("tailor_click");
      return;
    }
    onTrack?.('tailor_card', { title: job.title, company: job.company });
    onTailorJob?.(job);
  };

  return (
    <div className="new-home">
      <div className="nh-gradient" />
      <div className="nh-grid-overlay" />

      <header className="nh-nav">
        <div className="nh-nav-left">
          <span className="nh-logo">HiHired</span>
        </div>

        <nav className="nh-nav-links">
          <a href="#featured" onClick={(e) => { e.preventDefault(); document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' }); }}>Jobs</a>
          <a href="#playbook" onClick={(e) => { e.preventDefault(); document.getElementById('playbook')?.scrollIntoView({ behavior: 'smooth' }); }}>How it works</a>
          <a href="#product" onClick={(e) => { e.preventDefault(); document.getElementById('product')?.scrollIntoView({ behavior: 'smooth' }); }}>Tools</a>
          <Link to="/guides">Guides</Link>
          <Link to="/pricing">Pricing</Link>
        </nav>

        <div className="nh-nav-actions">
          {user ? (
            <>
              <button type="button" className="nh-ghost" onClick={() => onOpenResumeHistory?.()}>
                {displayName || 'Account'}
              </button>
              {isAdmin && (
                <Link className="nh-ghost" to="/admin/experiments">
                  Admin
                </Link>
              )}
              <button type="button" className="nh-ghost" onClick={onLogout}>Logout</button>
            </>
          ) : (
            <button type="button" className="nh-ghost" onClick={() => onOpenLogin?.('Sign in to save your searches')}>
              Log in
            </button>
          )}
          <button type="button" className="nh-primary" onClick={onPrimaryCta}>
            Start applying faster
          </button>
        </div>
      </header>

      <main className="nh-main">
        <section className="nh-hero" id="hero">
          <div className="nh-hero-text">
            <div className="nh-pill">New - Curated tech jobs + instant tailoring</div>
            <h1>Stop doom-scrolling job boards. Apply with a tailored resume in minutes.</h1>
            <p className="nh-lead">
              Search verified roles, then let the builder rewrite your resume to match each posting before you click apply.
            </p>
            <form className="nh-search" onSubmit={handleSearchSubmit}>
              <div className="nh-input">
                <label htmlFor="nh-role">Role</label>
                <input
                  id="nh-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Product manager, Data scientist..."
                />
              </div>
              <div className="nh-input">
                <label htmlFor="nh-location">Location</label>
                <input
                  id="nh-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Remote, SF, NYC..."
                />
              </div>
              <div className="nh-input">
                <label htmlFor="nh-seniority">Seniority</label>
                <input
                  id="nh-seniority"
                  value={seniority}
                  onChange={(e) => setSeniority(e.target.value)}
                  placeholder="Internship, Mid, Senior"
                />
              </div>
              <button type="submit" className="nh-primary">
                Find matching roles
              </button>
            </form>

            <div className="nh-quick-filters">
              {quickFilters.map((filter) => (
                <span key={filter.label} className="nh-chip">
                  <strong>{filter.label}</strong> - {filter.detail}
                </span>
              ))}
            </div>

            <div className="nh-hero-actions">
              <button type="button" className="nh-secondary" onClick={onPrimaryCta}>
                Try the resume builder
              </button>
              <button
                type="button"
                className="nh-text-btn"
                onClick={() => {
                  onJobAlertClick?.();
                  onOpenLogin?.("Create alerts for matching roles");
                }}
              >
                Create job alert ->
              </button>
            </div>

            <div className="nh-onboard-card">
              <div>
                <div className="nh-card-label">No resume yet?</div>
                <p className="nh-onboard-copy">
                  Start from a guided template, add your basics, and we&apos;ll tailor it to the first role you choose. Import later if you want.
                </p>
              </div>
              <div className="nh-onboard-actions">
                <button type="button" className="nh-primary" onClick={onPrimaryCta}>
                  Start from scratch
                </button>
                <button type="button" className="nh-ghost" onClick={onSecondaryCta}>
                  Browse roles first
                </button>
              </div>
            </div>
          </div>

          <div className="nh-hero-card">
            <div className="nh-hero-card-header">
              <div>
                <p className="nh-card-label">Live feed</p>
                <h3>Fresh, verified tech roles</h3>
              </div>
              <span className="nh-pill subtle">Comp ranges included</span>
            </div>

            <div className="nh-hero-jobs">
              {featuredJobs.slice(0, 2).map((job) => (
                <div key={job.title} className="nh-hero-job">
                  <div>
                    <p className="nh-card-label">{job.company}</p>
                    <div className="nh-hero-job-title">{job.title}</div>
                    <div className="nh-hero-job-meta">
                      <span>{job.location}</span>
                      <span>{job.salary}</span>
                    </div>
                  </div>
                  <button type="button" className="nh-ghost" onClick={() => handleTailorClick(job)}>
                    Tailor resume
                  </button>
                </div>
              ))}
            </div>

            <div className="nh-hero-metrics">
              {metrics.map((item) => (
                <div key={item.label} className="nh-metric">
                  <div className="nh-metric-value">{item.value}</div>
                  <div className="nh-metric-label">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="nh-featured" id="featured">
          <div className="nh-section-header">
            <div>
              <p className="nh-card-label">Trending this week</p>
              <h2>Roles you&apos;d actually want to apply to</h2>
              <p className="nh-section-lead">
                Human-vetted job posts with salary ranges and hiring signals. When you click tailor, we align your resume to that posting first.
              </p>
            </div>
            <div className="nh-section-actions">
              <button type="button" className="nh-secondary" onClick={onJobAlertClick}>
                Create alert
              </button>
              <button type="button" className="nh-primary" onClick={onPrimaryCta}>
                Build my resume
              </button>
            </div>
          </div>

          <div className="nh-job-grid">
            {featuredJobs.map((job) => (
              <article key={job.title} className="nh-job-card">
                <div className="nh-job-company">{job.company}</div>
                <h3>{job.title}</h3>
                <p className="nh-job-meta">{job.location} - {job.type}</p>
                <div className="nh-job-tags">
                  {job.tags.map((tag) => (
                    <span key={tag} className="nh-chip small">{tag}</span>
                  ))}
                </div>
                <div className="nh-job-meta-row">
                  <div className="nh-job-salary">{job.salary}</div>
                  <span className="nh-pill subtle">{job.posted}</span>
                </div>
                <div className="nh-job-actions">
                  <button
                    type="button"
                    className="nh-ghost"
                    onClick={() => {
                      if (!hasResume) {
                        onRequireResume?.("view_role");
                        return;
                      }
                      onTrack?.("view_role_click", {
                        title: job.title,
                        company: job.company,
                      });
                      onSecondaryCta?.();
                    }}
                    title={!hasResume ? "Build your resume to view and tailor" : undefined}
                  >
                    View
                  </button>
                  <button type="button" className="nh-primary" onClick={() => handleTailorClick(job)}>
                    Tailor resume
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="nh-spotlight">
            {spotlightTracks.map((track) => (
              <div key={track.label} className="nh-spotlight-card">
                <div className="nh-spotlight-title">{track.label}</div>
                <div className="nh-spotlight-roles">{track.roles}</div>
                <button type="button" className="nh-text-btn" onClick={() => onTrack?.('spotlight_click', { track: track.label })}>
                  See roles ->
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="nh-playbook" id="playbook">
          <div className="nh-section-header">
            <div>
              <p className="nh-card-label">Playbook</p>
              <h2>How HiHired keeps you moving</h2>
            </div>
            <button type="button" className="nh-primary" onClick={onPrimaryCta}>
              Start free
            </button>
          </div>
          <div className="nh-playbook-steps">
            {playbookSteps.map((step, index) => (
              <div key={step.title} className="nh-step-card">
                <div className="nh-step-index">0{index + 1}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="nh-product" id="product">
          <div className="nh-product-card">
            <p className="nh-card-label">Resume Builder</p>
            <h3>ATS-proof resumes tailored to each apply</h3>
            <ul>
              <li>Paste a job and get role-specific bullets that keep your voice.</li>
              <li>Live match score shows keyword and experience coverage.</li>
              <li>Export branded PDF or copy for LinkedIn in one click.</li>
            </ul>
            <button type="button" className="nh-primary" onClick={onPrimaryCta}>
              Launch builder
            </button>
          </div>
          <div className="nh-product-card">
            <p className="nh-card-label">Job Alerts</p>
            <h3>Curated tech roles with verified compensation</h3>
            <ul>
              <li>Remote, visa, and salary filters - no recruiter spam.</li>
              <li>Daily refresh powered by human review and hiring signals.</li>
              <li>Apply with an already-tailored resume for faster callbacks.</li>
            </ul>
            <button type="button" className="nh-secondary" onClick={onJobAlertClick}>
              Create an alert
            </button>
          </div>
        </section>

        <section className="nh-perks">
          {perks.map((perk) => (
            <div key={perk.title} className="nh-perk-card">
              <h4>{perk.title}</h4>
              <p>{perk.detail}</p>
            </div>
          ))}
        </section>

        <section className="nh-trusted">
          <div className="nh-trusted-head">
            <div>
              <p className="nh-card-label">Loved by job seekers</p>
              <h3>Used to land roles at teams like</h3>
            </div>
            <div className="nh-rating">4.9/5 satisfaction - 50k+ resumes built</div>
          </div>
          <div className="nh-trusted-logos">
            {TRUSTED_COMPANIES.slice(0, 9).map(({ name, logo, logoHeight }) => (
              <span key={name} className="nh-trusted-logo">
                <img
                  src={logo}
                  alt={`${name} logo`}
                  style={logoHeight ? { height: `${logoHeight}px` } : undefined}
                  loading="lazy"
                />
              </span>
            ))}
          </div>
        </section>

        <section className="nh-cta">
          <div>
            <p className="nh-card-label">Ready to get moving?</p>
            <h2>Ship a better resume and find roles that reply faster</h2>
            <p className="nh-section-lead">
              Join the experiment and tell us if this version helps you move quicker-we&apos;ll iterate weekly.
            </p>
          </div>
          <div className="nh-cta-actions">
            <button type="button" className="nh-primary" onClick={onPrimaryCta}>
              Start tailoring my resume
            </button>
            <button type="button" className="nh-secondary" onClick={onSecondaryCta}>
              Browse curated roles
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default NewHome;
