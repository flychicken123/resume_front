import React, { useMemo, useState, useRef, useCallback, Component } from 'react';
import { getAPIBaseURL } from '../api';

const API_BASE_URL = getAPIBaseURL();

const SECTIONS = [
  { key: 'personal',   label: 'Personal Details',  stepId: 3 },
  { key: 'experience', label: 'Experience',         stepId: 5 },
  { key: 'education',  label: 'Education',          stepId: 7 },
  { key: 'skills',     label: 'Skills',             stepId: 8 },
  { key: 'summary',    label: 'Summary',            stepId: 9 },
  { key: 'jobDesc',    label: 'Job Description',    stepId: 4 },
  { key: 'projects',   label: 'Projects',           stepId: 6 },
];

function checkCompletion(resumeData, jobDescriptions) {
  const d = resumeData || {};
  return {
    personal:   !!(d.name?.trim() && d.email?.trim()),
    experience: Array.isArray(d.experiences) && d.experiences.some(e => e.jobTitle?.trim()),
    education:  Array.isArray(d.education) && d.education.some(e => e.school?.trim()),
    skills:     !!(typeof d.skills === 'string' ? d.skills.trim() : typeof d.skillsCategorized === 'string' ? d.skillsCategorized.trim() : Array.isArray(d.skills) ? d.skills.length > 0 : false),
    summary:    !!(d.summary?.trim()),
    jobDesc:    Array.isArray(jobDescriptions) && jobDescriptions.length > 0,
    projects:   Array.isArray(d.projects) && d.projects.some(p => p.projectName?.trim()),
  };
}

const ResumeProgressBar = ({ resumeData, jobDescriptions, onSectionClick }) => {
  const completion = useMemo(() => checkCompletion(resumeData, jobDescriptions), [resumeData, jobDescriptions]);
  const completedCount = Object.values(completion).filter(Boolean).length;
  const total = SECTIONS.length;
  const pct = Math.round((completedCount / total) * 100);

  const [showTooltip, setShowTooltip] = useState(false);
  const [hint, setHint] = useState('');
  const [loading, setLoading] = useState(false);
  const hintCacheRef = useRef({ key: '', hint: '' });
  const hoverTimerRef = useRef(null);

  const missing = SECTIONS.filter(s => !completion[s.key]).map(s => s.label);
  const complete = SECTIONS.filter(s => completion[s.key]).map(s => s.label);
  const cacheKey = missing.join(',');

  const fetchHint = useCallback(async () => {
    if (missing.length === 0) {
      setHint('Your resume is complete! Preview and download it.');
      return;
    }
    if (hintCacheRef.current.key === cacheKey) {
      setHint(hintCacheRef.current.hint);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/resume/progress-hint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missing, complete }),
      });
      const data = await res.json();
      const h = data.hint || `Consider adding your ${missing[0]} next.`;
      hintCacheRef.current = { key: cacheKey, hint: h };
      setHint(h);
    } catch {
      setHint(`Consider adding your ${missing[0]} next.`);
    } finally {
      setLoading(false);
    }
  }, [missing, complete, cacheKey]);

  const handleMouseEnter = () => {
    hoverTimerRef.current = setTimeout(() => {
      setShowTooltip(true);
      fetchHint();
    }, 300);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimerRef.current);
    setShowTooltip(false);
  };

  return (
    <div
      className="resume-progress-bar"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ position: 'relative' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '320px' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap', minWidth: '36px' }}>
          {pct}% Complete
        </span>
        <div style={{ flex: 1, height: '8px', borderRadius: '4px', background: '#e5e7eb', overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: '4px',
            background: completedCount === total ? '#10b981' : '#3b82f6',
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {showTooltip && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '6px',
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px',
          padding: '12px 16px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)', zIndex: 50,
        }}>
          <div style={{ fontSize: '0.78rem', color: '#374151', marginBottom: '8px', fontWeight: 600 }}>
            {loading ? 'Thinking...' : `💡 ${hint}`}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {SECTIONS.map(s => {
              const done = completion[s.key];
              return (
                <button
                  key={s.key}
                  onClick={() => { onSectionClick(s.stepId); setShowTooltip(false); }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '3px 10px', borderRadius: '12px', border: 'none',
                    fontSize: '0.72rem', fontWeight: 500, cursor: 'pointer',
                    background: done ? '#d1fae5' : '#f3f4f6',
                    color: done ? '#065f46' : '#6b7280',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: '0.65rem' }}>{done ? '✓' : '○'}</span>
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

class ProgressBarErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error) { console.error('[ResumeProgressBar] crashed:', error); }
  render() { return this.state.hasError ? null : this.props.children; }
}

const SafeResumeProgressBar = (props) => (
  <ProgressBarErrorBoundary>
    <ResumeProgressBar {...props} />
  </ProgressBarErrorBoundary>
);

export default SafeResumeProgressBar;
