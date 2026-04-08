import React, { useMemo, Component } from 'react';

const SECTIONS = [
  { key: 'personal',   label: 'Personal',       stepId: 3, suggestion: 'Start by adding your name and contact info' },
  { key: 'experience', label: 'Experience',      stepId: 5, suggestion: 'Add your work experience — it\'s the most impactful section' },
  { key: 'education',  label: 'Education',       stepId: 7, suggestion: 'Include your education background' },
  { key: 'skills',     label: 'Skills',          stepId: 8, suggestion: 'List your key skills to help match with jobs' },
  { key: 'summary',    label: 'Summary',         stepId: 9, suggestion: 'Add a professional summary to make a strong first impression' },
  { key: 'jobDesc',    label: 'Job Description', stepId: 4, suggestion: 'Add a job description to tailor your resume' },
  { key: 'projects',   label: 'Projects',        stepId: 6, suggestion: 'Showcase your projects to stand out' },
];

const PRIORITY = ['experience', 'skills', 'education', 'summary', 'personal', 'jobDesc', 'projects'];

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

  const suggestion = useMemo(() => {
    if (completedCount === total) return 'Your resume is complete! Preview and download it.';
    for (const key of PRIORITY) {
      if (!completion[key]) {
        return SECTIONS.find(s => s.key === key)?.suggestion || '';
      }
    }
    return '';
  }, [completion, completedCount, total]);

  return (
    <div className="resume-progress-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
        <div style={{ flex: 1, height: '8px', borderRadius: '4px', background: '#e5e7eb', overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: '4px',
            background: completedCount === total ? '#10b981' : '#3b82f6',
            transition: 'width 0.4s ease',
          }} />
        </div>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>
          {completedCount}/{total} sections
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '4px' }}>
        {SECTIONS.map(s => {
          const done = completion[s.key];
          return (
            <button
              key={s.key}
              onClick={() => onSectionClick(s.stepId)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '2px 10px', borderRadius: '12px', border: 'none',
                fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer',
                background: done ? '#d1fae5' : '#f3f4f6',
                color: done ? '#065f46' : '#6b7280',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: '0.7rem' }}>{done ? '✓' : '○'}</span>
              {s.label}
            </button>
          );
        })}
      </div>

      {suggestion && (
        <div style={{ fontSize: '0.78rem', color: '#6b7280', fontStyle: 'italic' }}>
          💡 {suggestion}
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
