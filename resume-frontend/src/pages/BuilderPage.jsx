import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Text, Button, Badge, Paper, Progress, Stepper, TextInput, Textarea,
  SimpleGrid, Group, Stack, Box, Modal, Divider, PasswordInput, Select, Checkbox,
} from '@mantine/core';
import {
  IconUpload, IconFileImport, IconTemplate, IconUser, IconFileDescription,
  IconBriefcase, IconCode, IconSchool, IconTools, IconFileText, IconHeart,
  IconMail, IconChecklist, IconSparkles, IconArrowLeft, IconArrowRight,
  IconWand, IconDeviceFloppy, IconBrandGoogle, IconLock, IconAt,
} from '@tabler/icons-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useResume } from '../context/ResumeContext';
import {
  generateExperienceAI,
  improveExperienceGrammarAI,
  optimizeProjectAI,
  improveProjectGrammarAI,
  generateSummaryAI,
  improveSummaryGrammarAI,
  autoGenerateSkillsAI,
  generateResume,
  getAPIBaseURL,
} from '../api';
import styles from './BuilderPage.module.css';

const API_BASE_URL = getAPIBaseURL();

const STEPS = [
  { label: 'Import Resume', icon: IconFileImport, desc: 'Upload an existing resume to auto-fill your information, or start from scratch.' },
  { label: 'Template & Format', icon: IconTemplate, desc: 'Choose a template design and font size for your resume.' },
  { label: 'Personal Details', icon: IconUser, desc: 'Enter your contact information and personal details.' },
  { label: 'Job Description', icon: IconFileDescription, desc: 'Paste the job description to tailor your resume.' },
  { label: 'Experience', icon: IconBriefcase, desc: 'Add your work experience and achievements.' },
  { label: 'Projects', icon: IconCode, desc: 'Showcase your notable projects.' },
  { label: 'Education', icon: IconSchool, desc: 'Add your educational background.' },
  { label: 'Skills', icon: IconTools, desc: 'List your technical and soft skills.' },
  { label: 'Summary', icon: IconFileText, desc: 'Write a compelling professional summary.' },
  { label: 'Job Matches', icon: IconHeart, desc: 'Find jobs that match your profile.' },
  { label: 'Cover Letter', icon: IconMail, desc: 'Generate a tailored cover letter.' },
  { label: 'Track Applications', icon: IconChecklist, desc: 'Track your job applications.' },
];

const TEMPLATES = [
  { id: 'classic-professional', name: 'Classic Professional', desc: 'Traditional layout with clean typography, perfect for corporate environments', image: '/templates/classic.png' },
  { id: 'modern-clean', name: 'Modern Clean', desc: 'Contemporary design with blue accents, ideal for tech and creative industries', image: '/templates/modern.png' },
  { id: 'executive-serif', name: 'Executive Serif', desc: 'Executive style with refined serif typography, great for leadership roles', image: '/templates/executive.png' },
  { id: 'attorney-template', name: 'Attorney Professional', desc: 'Polished legal layout showcasing case results, bar admissions, and courtroom expertise', image: '/templates/executive.png' },
];

const FONT_SIZES = [
  { label: 'Small', value: 1.0 },
  { label: 'Medium', value: 1.2 },
  { label: 'Large', value: 1.4 },
  { label: 'Extra Large', value: 1.6 },
];

const DEGREE_OPTIONS = [
  { value: 'high-school', label: 'High School' },
  { value: 'associate', label: 'Associate' },
  { value: 'bachelor', label: 'Bachelor' },
  { value: 'master', label: 'Master' },
  { value: 'mba', label: 'MBA' },
  { value: 'phd', label: 'Ph.D.' },
  { value: 'jd', label: 'J.D.' },
  { value: 'md', label: 'M.D.' },
  { value: 'other', label: 'Other' },
];

function getFormatStyles(templateId, fontSizeMultiplier) {
  const sf = 2 * fontSizeMultiplier;

  const base = {
    page: { width: '100%', height: '100%', padding: `${10 * sf}px`, boxSizing: 'border-box', overflow: 'hidden' },
    name: { textAlign: 'center', fontWeight: 'bold', fontSize: `${10 * sf}px`, margin: 0 },
    title: { textAlign: 'center', fontSize: `${6 * sf}px`, margin: 0 },
    contact: { textAlign: 'center', fontSize: `${6 * sf}px`, margin: `${2 * sf}px 0` },
    sectionTitle: { fontWeight: 'bold', fontSize: `${8.4 * sf}px`, margin: `${4 * sf}px 0 ${2 * sf}px 0`, padding: `0 0 ${1 * sf}px 0` },
    company: { fontWeight: 'bold', fontSize: `${6 * sf}px`, margin: `${2 * sf}px 0 ${1 * sf}px 0` },
    role: { fontSize: `${6 * sf}px`, fontStyle: 'italic', margin: 0 },
    dates: { fontSize: `${5.5 * sf}px`, margin: 0 },
    bullet: { fontSize: `${6 * sf}px`, margin: `${0.5 * sf}px 0`, lineHeight: 1.3 },
    text: { fontSize: `${6 * sf}px`, margin: `${1 * sf}px 0`, lineHeight: 1.3 },
  };

  switch (templateId) {
    case 'classic-professional':
      return {
        ...base,
        page: { ...base.page, fontFamily: 'Calibri, Arial, sans-serif', lineHeight: 1.2, color: '#374151' },
        name: { ...base.name, color: '#1f2937' },
        title: { ...base.title, color: '#6b7280' },
        contact: { ...base.contact, color: '#6b7280' },
        sectionTitle: { ...base.sectionTitle, color: '#1f2937', borderBottom: '1px solid #000' },
        company: { ...base.company, color: '#374151' },
        bullet: { ...base.bullet, color: '#374151', marginLeft: `${4 * sf}px` },
        bulletPrefix: '• ',
      };

    case 'modern-clean':
      return {
        ...base,
        page: { ...base.page, fontFamily: "'Segoe UI', sans-serif", lineHeight: 1.15, color: '#374151' },
        headerContainer: { borderBottom: '3px solid #3498db', paddingBottom: `${3 * sf}px`, marginBottom: `${3 * sf}px` },
        name: { ...base.name, fontWeight: 600, color: '#2c3e50', fontSize: `${10 * sf}px` },
        title: { ...base.title, color: '#7f8c8d' },
        contact: { ...base.contact, color: '#7f8c8d' },
        sectionTitle: { ...base.sectionTitle, color: '#3498db', fontWeight: 600, fontSize: `${8.6 * sf}px`, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #000' },
        company: { ...base.company, color: '#2c3e50', fontWeight: 600 },
        bullet: { ...base.bullet, color: '#374151', marginLeft: `${3.5 * sf}px` },
        bulletPrefix: '• ',
      };

    case 'executive-serif':
      return {
        ...base,
        page: { ...base.page, fontFamily: "'Noto Serif', Georgia, serif", lineHeight: 1.2, color: '#374151' },
        name: { ...base.name, color: '#2A7B88', fontSize: `${10 * sf}px` },
        title: { ...base.title, color: '#7f8c8d' },
        contact: { ...base.contact, color: '#7f8c8d' },
        sectionTitle: { ...base.sectionTitle, color: '#2A7B88', fontSize: `${8.2 * sf}px`, textTransform: 'capitalize', borderBottom: 'none', paddingLeft: `${5 * sf}px`, textIndent: `${-5 * sf}px` },
        sectionMarker: '● ',
        company: { ...base.company, color: '#2c3e50', textTransform: 'uppercase', letterSpacing: '0.4px' },
        bullet: { ...base.bullet, display: 'flex', gap: `${1 * sf}px`, marginLeft: `${4 * sf}px` },
        bulletMarker: { color: '#39A5B7', flexShrink: 0 },
        bulletMarkerChar: '▪ ',
        bulletText: { color: '#374151' },
      };

    case 'attorney-template':
      return {
        ...base,
        isAttorney: true,
        page: { ...base.page, fontFamily: "Georgia, 'Times New Roman', serif", padding: 0, display: 'flex', flexDirection: 'column' },
        header: { background: '#DCC3AE', borderBottom: '5px solid #B68A65', padding: `${6 * sf}px ${10 * sf}px`, textAlign: 'center' },
        name: { ...base.name, fontSize: `${11 * sf}px`, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#3C2E27', textAlign: 'center' },
        title: { ...base.title, color: '#443730' },
        bodyContainer: { display: 'flex', flex: 1, overflow: 'hidden' },
        sidebar: { width: '35%', background: '#faf6f2', padding: `${5 * sf}px`, borderRight: '1px solid #E5D1C0', boxSizing: 'border-box' },
        mainCol: { width: '65%', padding: `${5 * sf}px`, boxSizing: 'border-box' },
        sectionTitle: { ...base.sectionTitle, color: '#3C2E27', fontSize: `${7.4 * sf}px`, borderBottom: '1px solid #E5D1C0' },
        contact: { ...base.contact, textAlign: 'left', color: '#443730' },
        company: { ...base.company, color: '#3C2E27' },
        bullet: { ...base.bullet, color: '#443730', marginLeft: `${3 * sf}px` },
        bulletPrefix: '• ',
        sidebarBulletColor: '#B68A65',
      };

    default:
      return base;
  }
}

function ResumePreview({ templateId, fontSizeMultiplier, data }) {
  const s = getFormatStyles(templateId, fontSizeMultiplier);
  const d = data;

  const skillsList = d.skills ? d.skills.split(',').map(sk => sk.trim()).filter(Boolean) : [];
  const experienceList = (d.experiences || []).filter(e => e.jobTitle || e.company);
  const projectList = (d.projects || []).filter(p => p.projectName);
  const eduList = (d.education || []).filter(e => e.school);
  const contactParts = [d.email, d.phone].filter(Boolean).join(' | ');

  if (s.isAttorney) {
    return (
      <div style={s.page}>
        <div style={s.header}>
          <div style={s.name}>{d.name || 'Your Name'}</div>
          <div style={s.title}>{experienceList[0]?.jobTitle || 'Your Title'}</div>
        </div>
        <div style={s.bodyContainer}>
          <div style={s.sidebar}>
            <div style={s.sectionTitle}>Contact</div>
            <div style={{ ...s.text, color: '#443730' }}>{d.email || 'email@example.com'}</div>
            <div style={{ ...s.text, color: '#443730' }}>{d.phone || '(555) 000-0000'}</div>

            <div style={s.sectionTitle}>Education</div>
            {eduList.length > 0 ? eduList.map((edu, i) => (
              <div key={i}>
                <div style={{ ...s.text, fontWeight: 'bold', color: '#3C2E27' }}>{edu.degree} {edu.field && `in ${edu.field}`}</div>
                <div style={{ ...s.text, color: '#443730' }}>{edu.school}{edu.gradYear ? `, ${edu.gradYear}` : ''}</div>
                {edu.gpa && <div style={{ ...s.text, color: '#443730' }}>GPA: {edu.gpa}</div>}
              </div>
            )) : (
              <div style={{ ...s.text, color: '#443730' }}>Your education details</div>
            )}

            <div style={s.sectionTitle}>Key Skills</div>
            {skillsList.length > 0 ? skillsList.map((sk, i) => (
              <div key={i} style={{ ...s.bullet, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: '#B68A65' }}>•</span>
                <span>{sk}</span>
              </div>
            )) : (
              <div style={{ ...s.text, color: '#443730' }}>Your skills</div>
            )}
          </div>
          <div style={s.mainCol}>
            <div style={s.sectionTitle}>Profile</div>
            <div style={s.text}>{d.summary || 'Your professional summary will appear here.'}</div>

            <div style={s.sectionTitle}>Experience</div>
            {experienceList.length > 0 ? experienceList.map((exp, i) => (
              <div key={i} style={{ marginBottom: `${2 * 2 * fontSizeMultiplier}px` }}>
                <div style={s.company}>{exp.jobTitle} — {exp.company}</div>
                <div style={s.dates}>{[exp.startDate, exp.currentlyWorking ? 'Present' : exp.endDate].filter(Boolean).join(' - ')}</div>
                {exp.description && exp.description.split('\n').filter(Boolean).map((b, j) => (
                  <div key={j} style={s.bullet}>{s.bulletPrefix}{b.replace(/^[•\-]\s*/, '')}</div>
                ))}
              </div>
            )) : (
              <div style={s.text}>Your experience will appear here.</div>
            )}

            <div style={s.sectionTitle}>Projects</div>
            {projectList.length > 0 ? projectList.map((p, i) => (
              <div key={i}>
                <div style={s.company}>{p.projectName}</div>
                <div style={s.text}>{p.description}</div>
              </div>
            )) : (
              <div style={s.text}>Your projects will appear here.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const renderHeader = () => {
    const wrap = s.headerContainer ? { ...s.headerContainer } : {};
    return (
      <div style={wrap}>
        <div style={s.name}>{d.name || 'Your Name'}</div>
        <div style={s.title}>{experienceList[0]?.jobTitle || 'Your Title'}</div>
        <div style={s.contact}>
          {contactParts || 'email@example.com | (555) 000-0000'}
        </div>
      </div>
    );
  };

  const renderSection = (title) => {
    if (s.sectionMarker) {
      return <div style={s.sectionTitle}>{s.sectionMarker}{title}</div>;
    }
    return <div style={s.sectionTitle}>{title}</div>;
  };

  const renderBullet = (text, idx) => {
    if (s.bulletMarkerChar) {
      return (
        <div key={idx} style={s.bullet}>
          <span style={s.bulletMarker}>{s.bulletMarkerChar}</span>
          <span style={s.bulletText}>{text}</span>
        </div>
      );
    }
    return <div key={idx} style={s.bullet}>{s.bulletPrefix}{text}</div>;
  };

  return (
    <div style={s.page}>
      {renderHeader()}

      {renderSection('Summary')}
      <div style={s.text}>{d.summary || 'Your professional summary will appear here.'}</div>

      {renderSection('Experience')}
      {experienceList.length > 0 ? experienceList.map((exp, i) => (
        <div key={i} style={{ marginBottom: `${2 * 2 * fontSizeMultiplier}px` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={s.company}>{exp.jobTitle} — {exp.company}</div>
            <div style={s.dates}>{[exp.startDate, exp.currentlyWorking ? 'Present' : exp.endDate].filter(Boolean).join(' - ')}</div>
          </div>
          {exp.description && exp.description.split('\n').filter(Boolean).map((b, j) => renderBullet(b.replace(/^[•\-]\s*/, ''), j))}
        </div>
      )) : (
        <div style={s.text}>Your experience will appear here.</div>
      )}

      {renderSection('Projects')}
      {projectList.length > 0 ? projectList.map((p, i) => (
        <div key={i}>
          <div style={s.company}>{p.projectName}</div>
          <div style={s.text}>{p.description}</div>
        </div>
      )) : (
        <div style={s.text}>Your projects will appear here.</div>
      )}

      {renderSection('Education')}
      {eduList.length > 0 ? eduList.map((edu, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={s.company}>{edu.degree}{edu.field ? ` in ${edu.field}` : ''} — {edu.school}</div>
          <div style={s.dates}>{edu.gradYear}{edu.gpa ? ` | GPA: ${edu.gpa}` : ''}</div>
        </div>
      )) : (
        <div style={s.text}>Your education will appear here.</div>
      )}

      {renderSection('Skills')}
      <div style={s.text}>{skillsList.length > 0 ? skillsList.join(', ') : 'Your skills will appear here.'}</div>
    </div>
  );
}

function MiniPreview({ templateId }) {
  const colors = {
    'classic-professional': { bg: '#fff', header: '#1f2937', accent: '#6b7280', line: '#000' },
    'modern-clean': { bg: '#fff', header: '#2c3e50', accent: '#3498db', line: '#3498db' },
    'executive-serif': { bg: '#fff', header: '#2A7B88', accent: '#39A5B7', line: '#2A7B88' },
    'attorney-template': { bg: '#DCC3AE', header: '#3C2E27', accent: '#B68A65', line: '#B68A65' },
  };
  const c = colors[templateId] || colors['classic-professional'];
  const isAtt = templateId === 'attorney-template';

  if (isAtt) {
    return (
      <div style={{ width: '100%', height: '100%', background: '#fff', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: c.bg, padding: '8px', borderBottom: `3px solid ${c.line}`, textAlign: 'center' }}>
          <div style={{ height: 6, background: c.header, width: '50%', margin: '0 auto 3px', borderRadius: 2 }} />
          <div style={{ height: 3, background: c.accent, width: '30%', margin: '0 auto', borderRadius: 2 }} />
        </div>
        <div style={{ display: 'flex', flex: 1 }}>
          <div style={{ width: '35%', background: '#faf6f2', padding: '6px' }}>
            {[1, 2, 3].map(i => <div key={i} style={{ height: 3, background: c.accent, marginBottom: 3, borderRadius: 1, width: '80%' }} />)}
          </div>
          <div style={{ width: '65%', padding: '6px' }}>
            {[1, 2, 3, 4].map(i => <div key={i} style={{ height: 3, background: '#ccc', marginBottom: 3, borderRadius: 1, width: i === 1 ? '60%' : '90%' }} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', background: '#fff', padding: '10px' }}>
      <div style={{ textAlign: 'center', marginBottom: 6, borderBottom: templateId === 'modern-clean' ? `2px solid ${c.line}` : 'none', paddingBottom: 4 }}>
        <div style={{ height: 7, background: c.header, width: '45%', margin: '0 auto 3px', borderRadius: 2 }} />
        <div style={{ height: 3, background: c.accent, width: '60%', margin: '0 auto', borderRadius: 2 }} />
      </div>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} style={{ marginBottom: 4 }}>
          {i % 2 === 1 && <div style={{ height: 4, background: c.header, width: '35%', marginBottom: 2, borderRadius: 1, borderBottom: `1px solid ${c.line}` }} />}
          <div style={{ height: 3, background: '#ddd', width: '90%', borderRadius: 1 }} />
        </div>
      ))}
    </div>
  );
}

function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return {};
  }
}

export default function BuilderPage() {
  const { user, login, logout, loading: authLoading } = useAuth();
  const { data: resumeData, updateData } = useResume();

  const [activeStep, setActiveStep] = useState(0);
  const [scale, setScale] = useState(1);
  const containerRef = useRef(null);

  // Safe accessor — resumeData may be null briefly
  const rd = resumeData || {
    name: '', email: '', phone: '', summary: '',
    selectedFormat: 'classic-professional',
    selectedFontSize: 'medium',
    experiences: [{ jobTitle: '', company: '', city: '', state: '', startDate: '', endDate: '', currentlyWorking: false, description: '' }],
    projects: [{ projectName: '', technologies: '', url: '', description: '' }],
    education: [{ degree: '', school: '', field: '', gpa: '', startYear: '', gradYear: '', location: '', honors: '' }],
    skills: '',
    jobDescription: '',
    coverLetter: '',
  };

  // Template/font state derived from resumeData
  const selectedTemplate = rd.selectedFormat || 'classic-professional';
  const selectedFontSize = rd.selectedFontSize === 'small' ? 1.0 : rd.selectedFontSize === 'large' ? 1.4 : rd.selectedFontSize === 'extra-large' ? 1.6 : 1.2;

  // Import tab state
  const [importTab, setImportTab] = useState('file');
  const [pasteText, setPasteText] = useState('');

  // AI button states
  const [aiStates, setAiStates] = useState({});

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Job URL state
  const [jobUrl, setJobUrl] = useState('');

  // Show auth modal if not logged in after loading
  useEffect(() => {
    if (!authLoading && !user) {
      setShowAuthModal(true);
    } else if (user) {
      setShowAuthModal(false);
    }
  }, [authLoading, user]);

  const handleAuthModalClose = useCallback(() => {
    if (user) setShowAuthModal(false);
  }, [user]);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setAuthError('');
      const decoded = decodeJWT(credentialResponse.credential);
      const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Google authentication failed');
      }
      const result = await res.json();
      const userData = result.user || { name: decoded.name || decoded.email, email: decoded.email };
      const token = result.token || credentialResponse.credential;
      login(userData, token);
      setShowAuthModal(false);
    } catch (err) {
      setAuthError(err.message || 'Google sign-in failed');
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setAuthError('Please enter email and password.');
      return;
    }
    try {
      setAuthError('');
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authMode === 'signup'
          ? { email: authEmail, password: authPassword, name: authEmail, marketing_opt_in: true, plan_preference: 'free' }
          : { email: authEmail, password: authPassword }),
      });
      const result = await res.json();
      if (!result.success) {
        throw new Error(result.message || (authMode === 'login' ? 'Invalid email or password' : 'Registration failed'));
      }
      const userData = result.user || { name: authEmail.split('@')[0], email: authEmail };
      const token = result.token;
      login(userData, token);
      setShowAuthModal(false);
      setAuthError('');
    } catch (err) {
      setAuthError(err.message || 'Authentication failed');
    }
  };

  const handleAuthButton = () => {
    if (user) {
      logout(false);
      setShowAuthModal(true);
    } else {
      setShowAuthModal(true);
    }
  };

  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const padX = 40, padY = 40;
    const availW = rect.width - padX;
    const availH = rect.height - padY;
    const scaleX = availW / 816;
    const scaleY = availH / 1056;
    setScale(Math.min(scaleX, scaleY, 1));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    updateScale();
    return () => ro.disconnect();
  }, [updateScale]);

  // Helper to update resumeData via context
  const updateField = (field, value) => {
    updateData(prev => ({ ...prev, [field]: value }));
  };

  const updateExperience = (index, field, value) => {
    updateData(prev => {
      const exps = [...(prev.experiences || [])];
      exps[index] = { ...exps[index], [field]: value };
      return { ...prev, experiences: exps };
    });
  };

  const updateProject = (index, field, value) => {
    updateData(prev => {
      const projs = [...(prev.projects || [])];
      projs[index] = { ...projs[index], [field]: value };
      return { ...prev, projects: projs };
    });
  };

  const updateEducation = (index, field, value) => {
    updateData(prev => {
      const edus = [...(prev.education || [])];
      edus[index] = { ...edus[index], [field]: value };
      return { ...prev, education: edus };
    });
  };

  // Progress calculation
  const calcProgress = () => {
    let done = 0;
    const total = 7;
    if (rd.name && rd.email) done++;
    if ((rd.experiences || []).some(e => e.jobTitle)) done++;
    if ((rd.education || []).some(e => e.school)) done++;
    if (rd.skills) done++;
    if (rd.summary) done++;
    if (rd.jobDescription) done++;
    if ((rd.projects || []).some(p => p.projectName)) done++;
    return Math.round((done / total) * 100);
  };

  const progressPct = calcProgress();

  // AI interaction helpers
  const getAiButtonText = (key, defaultText) => {
    if (aiStates[key] === 'checking') return 'Checking...';
    if (aiStates[key] === 'done') return '\u2713 AI Enhanced';
    if (aiStates[key] === 'error') return '\u2717 Try Again';
    return defaultText;
  };

  const handleExperienceAI = async (idx) => {
    const exp = (rd.experiences || [])[idx];
    if (!exp || !exp.description) return;
    const key = `exp-${idx}`;
    setAiStates(prev => ({ ...prev, [key]: 'checking' }));
    try {
      const result = await generateExperienceAI(exp.description, rd.jobDescription || '');
      if (result) {
        updateExperience(idx, 'description', result);
      }
      setAiStates(prev => ({ ...prev, [key]: 'done' }));
    } catch (err) {
      console.error('AI experience error:', err);
      setAiStates(prev => ({ ...prev, [key]: 'error' }));
    }
  };

  const handleProjectAI = async (idx) => {
    const proj = (rd.projects || [])[idx];
    if (!proj || !proj.description) return;
    const key = `proj-${idx}`;
    setAiStates(prev => ({ ...prev, [key]: 'checking' }));
    try {
      const result = await optimizeProjectAI(
        { name: proj.projectName || '', technologies: proj.technologies || '', description: proj.description || '' },
        rd.jobDescription || ''
      );
      if (result) {
        updateProject(idx, 'description', result);
      }
      setAiStates(prev => ({ ...prev, [key]: 'done' }));
    } catch (err) {
      console.error('AI project error:', err);
      setAiStates(prev => ({ ...prev, [key]: 'error' }));
    }
  };

  const handleSummaryAI = async () => {
    setAiStates(prev => ({ ...prev, summary: 'checking' }));
    try {
      const result = await generateSummaryAI({
        experience: (rd.experiences || []).map(e => e.description).filter(Boolean).join('\n'),
        education: (rd.education || []).map(e => `${e.degree} ${e.field} ${e.school}`).filter(Boolean).join(', '),
        skills: rd.skills ? rd.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        existingSummary: rd.summary || null,
        jobDescription: rd.jobDescription || '',
      });
      if (result) {
        updateField('summary', result);
      }
      setAiStates(prev => ({ ...prev, summary: 'done' }));
    } catch (err) {
      console.error('AI summary error:', err);
      setAiStates(prev => ({ ...prev, summary: 'error' }));
    }
  };

  const handleSkillsAI = async () => {
    setAiStates(prev => ({ ...prev, skills: 'checking' }));
    try {
      const result = await autoGenerateSkillsAI(rd, rd.jobDescription || '', rd.skills ? rd.skills.split(',').map(s => s.trim()) : null);
      if (result) {
        updateField('skills', result);
      }
      setAiStates(prev => ({ ...prev, skills: 'done' }));
    } catch (err) {
      console.error('AI skills error:', err);
      setAiStates(prev => ({ ...prev, skills: 'error' }));
    }
  };

  const handleGenerateResume = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    try {
      const previewEl = document.querySelector(`.${styles.resumePage}`);
      const htmlContent = previewEl ? previewEl.innerHTML : '';
      const result = await generateResume({
        html: htmlContent,
        resumeData: rd,
        templateId: selectedTemplate,
        fontSizeMultiplier: selectedFontSize,
      });
      if (result && result.pdfUrl) {
        window.open(result.pdfUrl, '_blank');
      } else if (result && result.pdf) {
        const blob = new Blob([Uint8Array.from(atob(result.pdf), c => c.charCodeAt(0))], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else {
        alert('Resume generated successfully!');
      }
    } catch (err) {
      console.error('Generate resume error:', err);
      alert('Failed to generate resume: ' + (err.message || 'Unknown error'));
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Stack gap="md">
            <h2 style={{ margin: 0 }}>Let&apos;s import your career history</h2>
            <Text size="sm" c="dimmed">Import your information from an existing resume, LinkedIn profile, or add it manually.</Text>
            <Button variant="gradient" gradient={{ from: 'orange', to: 'red' }} disabled>Import from Resume History</Button>
            <Group gap="xs">
              <Button variant={importTab === 'file' ? 'filled' : 'light'} color="orange" size="sm" onClick={() => setImportTab('file')}>Resume File</Button>
              <Button variant="light" color="gray" size="sm" disabled>LinkedIn Import</Button>
              <Button variant={importTab === 'paste' ? 'filled' : 'light'} color="orange" size="sm" onClick={() => setImportTab('paste')}>Paste Text</Button>
            </Group>
            {importTab === 'file' && (
              <Paper p="xl" radius="md" style={{ border: '2px dashed #d1d5db', textAlign: 'center', background: '#f9fafb' }}>
                <IconUpload size={40} color="#9ca3af" style={{ marginBottom: 12 }} />
                <Text fw={600} size="sm">Upload your resume (PDF, DOC, DOCX)</Text>
                <Text size="xs" c="dimmed" mt="xs">Click to browse or drop a file here</Text>
                <Button variant="light" color="orange" mt="md">Browse Files</Button>
              </Paper>
            )}
            {importTab === 'paste' && (
              <Stack gap="sm">
                <Textarea placeholder="Paste your resume text here..." minRows={6} value={pasteText} onChange={(e) => setPasteText(e.currentTarget.value)} />
                <Button variant="light" color="orange" size="sm">Import from text</Button>
              </Stack>
            )}
            <Text size="sm" c="blue" style={{ cursor: 'pointer' }} onClick={() => setActiveStep(1)}>Skip and enter manually</Text>
            <Paper p="md" radius="md" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
              <Text size="sm" fw={600} mb="xs">How it works:</Text>
              <Text size="sm">1. Import or enter info</Text>
              <Text size="sm">2. Review and edit</Text>
              <Text size="sm">3. Preview and download</Text>
            </Paper>
          </Stack>
        );

      case 1:
        return (
          <Stack gap="md">
            <h2 style={{ margin: 0 }}>Template &amp; Format</h2>
            <Text size="sm" c="dimmed">{STEPS[1].desc}</Text>
            <div className={styles.templateGrid}>
              {TEMPLATES.map((t) => (
                <Paper
                  key={t.id}
                  p="sm"
                  radius="md"
                  withBorder
                  className={`${styles.templateCard} ${selectedTemplate === t.id ? styles.templateCardSelected : ''}`}
                  onClick={() => updateField('selectedFormat', t.id)}
                >
                  <div className={styles.miniPreview}>
                    <img src={t.image} alt={t.name} />
                  </div>
                  <Text fw={600} size="sm">{t.name}</Text>
                  <Text size="xs" c="dimmed" lineClamp={2}>{t.desc}</Text>
                </Paper>
              ))}
            </div>
            <Text fw={600} size="sm" mt="md">Font Size</Text>
            <div className={styles.fontSizeGrid}>
              {FONT_SIZES.map((fs) => (
                <div
                  key={fs.value}
                  className={`${styles.fontSizeBtn} ${selectedFontSize === fs.value ? styles.fontSizeBtnActive : ''}`}
                  onClick={() => updateField('selectedFontSize', fs.label.toLowerCase().replace(' ', '-'))}
                >
                  {fs.label}
                </div>
              ))}
            </div>
          </Stack>
        );

      case 2:
        return (
          <Stack gap="md">
            <h2 style={{ margin: 0 }}>Personal Information</h2>
            <Text size="sm" c="dimmed">Let&apos;s start with your basic information. This will appear at the top of your resume.</Text>
            <SimpleGrid cols={2} spacing="md">
              <TextInput label="Full Name *" placeholder="Enter full name" value={rd.name || ''} onChange={(e) => updateField('name', e.currentTarget.value)} />
              <TextInput label="Email *" placeholder="Enter email" value={rd.email || ''} onChange={(e) => updateField('email', e.currentTarget.value)} />
              <TextInput label="Phone" placeholder="Enter phone number" value={rd.phone || ''} onChange={(e) => updateField('phone', e.currentTarget.value)} />
            </SimpleGrid>
            <Textarea label="Professional Summary" placeholder="Brief overview of your professional background..." minRows={4} value={rd.summary || ''} onChange={(e) => updateField('summary', e.currentTarget.value)} />
            <Text size="xs" c="dimmed">Tip: You can use AI to enhance your summary in Step 8.</Text>
          </Stack>
        );

      case 3:
        return (
          <Stack gap="md">
            <h2 style={{ margin: 0 }}>Job Description</h2>
            <Text size="sm" c="dimmed">Add one or more job descriptions so our AI can tailor your resume to match what employers are looking for.</Text>
            <Group gap="sm">
              <TextInput placeholder="https://example.com/job-posting" style={{ flex: 1 }} value={jobUrl} onChange={(e) => setJobUrl(e.currentTarget.value)} />
              <Button variant="light" color="orange" onClick={() => { if (jobUrl) updateField('jobDescription', 'Senior Software Engineer\n\nWe are looking for a skilled engineer with experience in React, Node.js, and cloud technologies...'); }}>Fetch from URL</Button>
            </Group>
            <Textarea placeholder="Paste the job description here..." minRows={10} value={rd.jobDescription || ''} onChange={(e) => updateField('jobDescription', e.currentTarget.value)} />
            <Text size="xs" c="dimmed">{'\uD83D\uDCCC'} Add multiple job descriptions to tailor your resume for different positions. Our AI will optimize your content for each role.</Text>
          </Stack>
        );

      case 4:
        return (
          <Stack gap="md">
            <h2 style={{ margin: 0 }}>Work Experience</h2>
            <Text size="sm" c="dimmed">* Required fields. Add your work history starting with the most recent position.</Text>
            {rd.jobDescription && (
              <Paper p="sm" radius="md" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <Text size="sm" c="blue">{'\uD83C\uDFAF'} AI Optimization Available — Your job description has been loaded. Use &quot;Check with AI&quot; to optimize each experience entry.</Text>
              </Paper>
            )}
            {(rd.experiences || []).map((exp, idx) => (
              <Paper key={idx} p="md" radius="md" withBorder>
                <SimpleGrid cols={2} spacing="md">
                  <TextInput label="Job Title *" placeholder="e.g. Software Engineer" value={exp.jobTitle || ''} onChange={(e) => updateExperience(idx, 'jobTitle', e.currentTarget.value)} />
                  <TextInput label="Employer *" placeholder="e.g. TechCorp" value={exp.company || ''} onChange={(e) => updateExperience(idx, 'company', e.currentTarget.value)} />
                  <TextInput label="City" placeholder="City" value={exp.city || ''} onChange={(e) => updateExperience(idx, 'city', e.currentTarget.value)} />
                  <TextInput label="State" placeholder="State" value={exp.state || ''} onChange={(e) => updateExperience(idx, 'state', e.currentTarget.value)} />
                  <TextInput label="Start Date" placeholder="e.g. Jan 2021" value={exp.startDate || ''} onChange={(e) => updateExperience(idx, 'startDate', e.currentTarget.value)} />
                  <TextInput label="End Date" placeholder="e.g. Dec 2023" value={exp.endDate || ''} onChange={(e) => updateExperience(idx, 'endDate', e.currentTarget.value)} disabled={exp.currentlyWorking} />
                </SimpleGrid>
                <Checkbox label="Currently working here" checked={exp.currentlyWorking || false} onChange={(e) => updateExperience(idx, 'currentlyWorking', e.currentTarget.checked)} mt="sm" />
                <Textarea label="Experience Description" placeholder="Describe your responsibilities and achievements..." minRows={4} mt="sm" value={exp.description || ''} onChange={(e) => updateExperience(idx, 'description', e.currentTarget.value)} />
                <Button
                  variant="light"
                  color="orange"
                  size="sm"
                  mt="sm"
                  disabled={aiStates[`exp-${idx}`] === 'checking'}
                  onClick={() => handleExperienceAI(idx)}
                >
                  {getAiButtonText(`exp-${idx}`, '\u2728 Check with AI')}
                </Button>
              </Paper>
            ))}
            <Button variant="light" color="gray" size="sm" onClick={() => updateData(prev => ({ ...prev, experiences: [...(prev.experiences || []), { jobTitle: '', company: '', city: '', state: '', startDate: '', endDate: '', currentlyWorking: false, description: '' }] }))}>
              + Add Work Experience
            </Button>
            <Text size="xs" c="dimmed">Preview tip: Bullet points render automatically. Start each line with a new achievement.</Text>
          </Stack>
        );

      case 5:
        return (
          <Stack gap="md">
            <h2 style={{ margin: 0 }}>Projects</h2>
            <Text size="sm" c="dimmed">Showcase your academic, personal, or professional projects that demonstrate your skills.</Text>
            {(rd.projects || []).map((proj, idx) => (
              <Paper key={idx} p="md" radius="md" withBorder>
                <SimpleGrid cols={2} spacing="md">
                  <TextInput label="Project Name *" placeholder="e.g. AI Resume Builder" value={proj.projectName || ''} onChange={(e) => updateProject(idx, 'projectName', e.currentTarget.value)} />
                  <TextInput label="Technologies" placeholder="e.g. React, Node.js, OpenAI" value={proj.technologies || ''} onChange={(e) => updateProject(idx, 'technologies', e.currentTarget.value)} />
                </SimpleGrid>
                <TextInput label="URL" placeholder="https://github.com/..." mt="sm" value={proj.url || proj.projectUrl || ''} onChange={(e) => updateProject(idx, 'url', e.currentTarget.value)} />
                <Textarea label="Description" placeholder="Describe the project, your role, and the impact..." minRows={8} mt="sm" value={proj.description || ''} onChange={(e) => updateProject(idx, 'description', e.currentTarget.value)} />
                <Button
                  variant="light"
                  color="orange"
                  size="sm"
                  mt="sm"
                  disabled={aiStates[`proj-${idx}`] === 'checking'}
                  onClick={() => handleProjectAI(idx)}
                >
                  {getAiButtonText(`proj-${idx}`, '\u2728 Check with AI')}
                </Button>
              </Paper>
            ))}
            <Button variant="light" color="gray" size="sm" onClick={() => updateData(prev => ({ ...prev, projects: [...(prev.projects || []), { projectName: '', technologies: '', url: '', description: '' }] }))}>
              + Add Another Project
            </Button>
          </Stack>
        );

      case 6:
        return (
          <Stack gap="md">
            <h2 style={{ margin: 0 }}>Education</h2>
            {(rd.education || []).map((edu, idx) => (
              <Paper key={idx} p="md" radius="md" withBorder>
                <SimpleGrid cols={2} spacing="md">
                  <Select label="Degree" placeholder="Select degree" data={DEGREE_OPTIONS} value={edu.degree || ''} onChange={(val) => updateEducation(idx, 'degree', val || '')} />
                  <TextInput label="School *" placeholder="e.g. UC Berkeley" value={edu.school || ''} onChange={(e) => updateEducation(idx, 'school', e.currentTarget.value)} />
                  <TextInput label="Field of Study" placeholder="e.g. Computer Science" value={edu.field || ''} onChange={(e) => updateEducation(idx, 'field', e.currentTarget.value)} />
                  <TextInput label="GPA" placeholder="e.g. 3.8" value={edu.gpa || ''} onChange={(e) => updateEducation(idx, 'gpa', e.currentTarget.value)} />
                  <TextInput label="Start Year" placeholder="e.g. 2014" value={edu.startYear || ''} onChange={(e) => updateEducation(idx, 'startYear', e.currentTarget.value)} />
                  <TextInput label="Grad Year" placeholder="e.g. 2018" value={edu.gradYear || ''} onChange={(e) => updateEducation(idx, 'gradYear', e.currentTarget.value)} />
                  <TextInput label="Location" placeholder="e.g. Berkeley, CA" value={edu.location || ''} onChange={(e) => updateEducation(idx, 'location', e.currentTarget.value)} />
                </SimpleGrid>
                <Textarea label="Honors" placeholder="e.g. Dean's List, Magna Cum Laude" minRows={2} mt="sm" value={edu.honors || ''} onChange={(e) => updateEducation(idx, 'honors', e.currentTarget.value)} />
              </Paper>
            ))}
            <Button variant="light" color="gray" size="sm" onClick={() => updateData(prev => ({ ...prev, education: [...(prev.education || []), { degree: '', school: '', field: '', gpa: '', startYear: '', gradYear: '', location: '', honors: '' }] }))}>
              + Add Education
            </Button>
          </Stack>
        );

      case 7:
        return (
          <Stack gap="md">
            <Text fw={600} size="sm">Skills (comma separated)</Text>
            <Button
              variant="light"
              color="orange"
              size="sm"
              disabled={aiStates['skills'] === 'checking'}
              onClick={handleSkillsAI}
            >
              {getAiButtonText('skills', 'Auto generate with AI')}
            </Button>
            <TextInput placeholder="e.g. JavaScript, React, Node.js..." value={rd.skills || ''} onChange={(e) => updateField('skills', e.currentTarget.value)} />
          </Stack>
        );

      case 8:
        return (
          <Stack gap="md">
            <h2 style={{ margin: 0 }}>Professional Summary</h2>
            <Textarea placeholder="Write a compelling summary of your career..." minRows={8} value={rd.summary || ''} onChange={(e) => updateField('summary', e.currentTarget.value)} />
            <Button
              variant="light"
              color="orange"
              size="sm"
              disabled={aiStates['summary'] === 'checking'}
              onClick={handleSummaryAI}
            >
              {getAiButtonText('summary', '\u2728 Check with AI')}
            </Button>
          </Stack>
        );

      case 9: {
        const jobs = [
          { title: 'Senior Software Engineer', company: 'TechCorp', location: 'San Francisco', match: 92 },
          { title: 'Full Stack Developer', company: 'StartupAI', location: 'Remote', match: 85 },
          { title: 'Backend Engineer', company: 'CloudScale', location: 'Seattle', match: 78 },
        ];
        return (
          <Stack gap="md">
            <h2 style={{ margin: 0 }}>Job Matches</h2>
            <Text size="sm" c="dimmed">Jobs that match your profile based on your skills and experience.</Text>
            {jobs.map((job, i) => (
              <Paper key={i} p="md" radius="md" withBorder>
                <Group justify="space-between" mb="xs">
                  <div>
                    <Text fw={600} size="sm">{job.title}</Text>
                    <Text size="xs" c="dimmed">{job.company} — {job.location}</Text>
                  </div>
                  <Badge color={job.match >= 90 ? 'green' : job.match >= 80 ? 'blue' : 'orange'} variant="light" size="lg">{job.match}% match</Badge>
                </Group>
                <Group gap="sm">
                  <Button variant="light" color="blue" size="xs">View Job</Button>
                  <Button variant="light" color="orange" size="xs">One-Click AI Resume</Button>
                </Group>
              </Paper>
            ))}
          </Stack>
        );
      }

      case 10:
        return (
          <Stack gap="md" align="center" style={{ textAlign: 'center', paddingTop: 40 }}>
            <Text size="xl">{'\uD83D\uDC51'}</Text>
            <h2 style={{ margin: 0 }}>Premium Feature</h2>
            <Text size="sm" c="dimmed">Cover letter generation is available for Premium and Ultimate plans.</Text>
            <Button variant="gradient" gradient={{ from: 'orange', to: 'red' }}>Upgrade to Premium</Button>
          </Stack>
        );

      case 11:
        return (
          <Stack gap="md">
            <h2 style={{ margin: 0 }}>Track Applications</h2>
            <Text size="sm" c="dimmed">Application tracking dashboard coming soon.</Text>
            <SimpleGrid cols={3} spacing="md">
              <Paper p="md" radius="md" withBorder style={{ textAlign: 'center' }}>
                <Text fw={700} size="xl" c="blue">2</Text>
                <Text size="sm" c="dimmed">Applied</Text>
              </Paper>
              <Paper p="md" radius="md" withBorder style={{ textAlign: 'center' }}>
                <Text fw={700} size="xl" c="orange">1</Text>
                <Text size="sm" c="dimmed">Interview</Text>
              </Paper>
              <Paper p="md" radius="md" withBorder style={{ textAlign: 'center' }}>
                <Text fw={700} size="xl" c="green">0</Text>
                <Text size="sm" c="dimmed">Offer</Text>
              </Paper>
            </SimpleGrid>
          </Stack>
        );

      default:
        return (
          <Stack gap="md">
            <h2 style={{ margin: 0 }}>{STEPS[activeStep]?.label}</h2>
            <Text size="sm" c="dimmed">{STEPS[activeStep]?.desc || 'This section is available in the full version of HiHired.'}</Text>
          </Stack>
        );
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* TOP BAR */}
      <div className={styles.topBar}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconSparkles size={24} color="#f97316" />
          <Text fw={700} size="lg" c="orange">HiHired</Text>
        </Link>
        <div className={styles.topBarCenter}>
          <Text size="xs" c="dimmed">Resume {progressPct}% complete — Step {activeStep + 1} of {STEPS.length}</Text>
          <Progress value={progressPct} color="orange" size="sm" style={{ width: '100%' }} />
        </div>
        <Button variant="light" color="orange" leftSection={<IconDeviceFloppy size={16} />}>
          Save Draft
        </Button>
      </div>

      {/* MAIN AREA */}
      <div className={styles.main}>
        {/* LEFT SIDEBAR */}
        <div className={styles.sidebar}>
          <Stepper
            active={activeStep}
            onStepClick={setActiveStep}
            orientation="vertical"
            color="orange"
            size="sm"
            iconSize={32}
          >
            {STEPS.map((step, idx) => (
              <Stepper.Step
                key={idx}
                label={step.label}
                icon={<step.icon size={16} />}
              />
            ))}
          </Stepper>
        </div>

        {/* CENTER FORM */}
        <div className={styles.formArea}>
          <div className={styles.formCard}>
            <Paper p="xl" radius="lg" withBorder bg="white">
              {renderStepContent()}
            </Paper>
          </div>
        </div>

        {/* RIGHT PREVIEW */}
        <div className={styles.previewPanel}>
          <div className={styles.previewLabel}>
            <Text fw={600} size="sm" c="white">Live Resume Preview</Text>
            <Group gap="sm">
              {user && <Text size="xs" c="blue">{user.name || user.email}</Text>}
              <Button size="xs" variant={user ? 'subtle' : 'light'} color={user ? 'gray' : 'orange'} onClick={handleAuthButton}>
                {user ? 'Sign Out' : 'Login / Signup'}
              </Button>
            </Group>
          </div>
          <div style={{ padding: '0 20px 8px 20px' }}>
            <Button fullWidth color="red" onClick={handleGenerateResume}>
              {'\uD83D\uDCC4'} Generate Resume
            </Button>
          </div>
          <div className={styles.previewContainer} ref={containerRef}>
            <div
              className={styles.resumeWrapper}
              style={{ transform: `scale(${scale})` }}
            >
              <div className={styles.resumePage}>
                <ResumePreview templateId={selectedTemplate} fontSizeMultiplier={selectedFontSize} data={rd} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AUTH MODAL */}
      <Modal
        opened={showAuthModal}
        onClose={handleAuthModalClose}
        centered
        size="sm"
        title={authMode === 'login' ? 'Login' : 'Sign Up'}
        closeOnClickOutside={!!user}
        closeOnEscape={!!user}
        withCloseButton={!!user}
      >
        <Text size="sm" c="dimmed" mb="md">Sign in to build your resume.</Text>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setAuthError('Google sign-in failed')}
            size="large"
            width="100%"
            text={authMode === 'login' ? 'signin_with' : 'signup_with'}
          />
        </div>

        <Divider label="or" labelPosition="center" mb="md" />

        <form onSubmit={handleEmailAuth}>
          <Stack gap="sm">
            <TextInput
              label="Email"
              placeholder="Enter your email"
              leftSection={<IconAt size={16} />}
              value={authEmail}
              onChange={(e) => setAuthEmail(e.currentTarget.value)}
            />
            <PasswordInput
              label="Password"
              placeholder="Enter your password"
              leftSection={<IconLock size={16} />}
              value={authPassword}
              onChange={(e) => setAuthPassword(e.currentTarget.value)}
            />
            {authError && <Text size="sm" c="red">{authError}</Text>}
            <Button type="submit" color="orange" fullWidth>
              {authMode === 'login' ? 'Login' : 'Sign Up'}
            </Button>
          </Stack>
        </form>

        <Text size="sm" ta="center" mt="md">
          {authMode === 'login' ? (
            <>Don&apos;t have an account?{' '}
              <Text component="span" c="blue" style={{ cursor: 'pointer' }} onClick={() => { setAuthMode('signup'); setAuthError(''); }}>
                Sign up
              </Text>
            </>
          ) : (
            <>Already have an account?{' '}
              <Text component="span" c="blue" style={{ cursor: 'pointer' }} onClick={() => { setAuthMode('login'); setAuthError(''); }}>
                Login
              </Text>
            </>
          )}
        </Text>
      </Modal>

      {/* BOTTOM BAR */}
      <div className={styles.bottomBar}>
        <Button
          variant="default"
          leftSection={<IconArrowLeft size={16} />}
          disabled={activeStep === 0}
          onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
        >
          Back
        </Button>
        <div className={styles.dotIndicators}>
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`${styles.dot} ${idx === activeStep ? styles.dotActive : ''}`}
              onClick={() => setActiveStep(idx)}
              style={{ cursor: 'pointer' }}
            />
          ))}
        </div>
        <Button
          color="orange"
          rightSection={<IconArrowRight size={16} />}
          onClick={() => setActiveStep(Math.min(STEPS.length - 1, activeStep + 1))}
        >
          {activeStep === STEPS.length - 1 ? 'Finish' : 'Next'}
        </Button>
      </div>
    </div>
  );
}
