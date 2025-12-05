import React, { useState, useEffect, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useResume } from '../context/ResumeContext';
import { useFeedback } from '../context/FeedbackContext';
import { setLastStep } from '../utils/exitTracking';
import { BUILDER_TARGET_STEP_KEY, BUILDER_TARGET_JOB_MATCHES, BUILDER_TARGET_TEMPLATE } from '../constants/builder';
import {
  createJobDescriptionEntry,
  ensureJobDescriptionList,
  combineJobDescriptions,
  prepareJobDescriptionsForStorage,
} from '../utils/jobDescriptions';
import { TEMPLATE_SLUGS, DEFAULT_TEMPLATE_ID, normalizeTemplateId } from '../constants/templates';
import Stepper from '../components/Stepper';
import StepPersonal from '../components/StepPersonal';
import StepImport from '../components/StepImport';
import StepExperience from '../components/StepExperience';
import StepEducation from '../components/StepEducation';
import StepProjects from '../components/StepProjects';
import StepSkills from '../components/StepSkills';
import StepJobDescription from '../components/StepJobDescription';
import StepFormat from '../components/StepFormat';
import StepSummary from '../components/StepSummary';
import StepCoverLetter from '../components/StepCoverLetter';
import LivePreview from '../components/LivePreview';
import AuthModal from '../components/auth/AuthModal';
import ImportResumeModal from '../components/ImportResumeModal';
import UpgradeModal from '../components/UpgradeModal';
import SubscriptionStatus from '../components/SubscriptionStatus';
import SEO from '../components/SEO';
import { trackResumeGeneration, trackBuilderLoaded, trackDownloadClicked } from '../components/Analytics';
import { computeJobMatches, getJobMatches, generateExperienceAI, optimizeProjectAI, generateSummaryAI } from '../api';
import './BuilderPage.css';

const getAPIBaseURL = () => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8081';
    }
    return window.location.hostname === 'www.hihired.org' ? 'https://hihired.org' : window.location.origin;
  }
  return process.env.REACT_APP_API_URL || 'http://localhost:8081';
};

const formatLocationParts = (parts) => {
  if (!Array.isArray(parts)) {
    return '';
  }
  return parts
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
    .join(', ');
};

const derivePrimaryLocation = (resumeData) => {
  if (!resumeData || typeof resumeData !== 'object') {
    return '';
  }

  const experiences = Array.isArray(resumeData.experiences) ? resumeData.experiences.filter(Boolean) : [];
  for (let i = experiences.length - 1; i >= 0; i -= 1) {
    const exp = experiences[i];
    if (!exp || typeof exp !== 'object') continue;
    if (exp.remote) {
      const countryHint = typeof exp.country === 'string' ? exp.country.toLowerCase() : '';
      if (countryHint.includes('canada')) {
        return 'Remote (Canada)';
      }
      if (countryHint.includes('kingdom') || countryHint.includes('uk')) {
        return 'Remote (UK)';
      }
      return 'Remote (US)';
    }
    const loc = formatLocationParts([exp.city, exp.state, exp.country]);
    if (loc) {
      return loc;
    }
    if (typeof exp.location === 'string' && exp.location.trim()) {
      return exp.location.trim();
    }
  }

  const education = Array.isArray(resumeData.education) ? resumeData.education.filter(Boolean) : [];
  for (let i = education.length - 1; i >= 0; i -= 1) {
    const edu = education[i];
    if (!edu || typeof edu !== 'object') continue;
    if (typeof edu.location === 'string' && edu.location.trim()) {
      return edu.location.trim();
    }
    const loc = formatLocationParts([edu.city, edu.state, edu.country]);
    if (loc) {
      return loc;
    }
  }

  if (typeof resumeData.location === 'string' && resumeData.location.trim()) {
    return resumeData.location.trim();
  }

  return '';
};

const extractResumeLocations = (resumeData) => {
  if (!resumeData || typeof resumeData !== 'object') {
    return [];
  }

  const seen = new Set();
  const ordered = [];
  const pushLocation = (value) => {
    if (!value || typeof value !== 'string') {
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    const normalized = trimmed.toLowerCase();
    if (seen.has(normalized)) {
      return;
    }
    seen.add(normalized);
    ordered.push(trimmed);
  };

  const experiences = Array.isArray(resumeData.experiences) ? resumeData.experiences.filter(Boolean) : [];
  for (let i = experiences.length - 1; i >= 0; i -= 1) {
    const exp = experiences[i];
    if (!exp || typeof exp !== 'object') {
      continue;
    }
    if (exp.remote) {
      const countryHint = typeof exp.country === 'string' ? exp.country.toLowerCase() : '';
      if (countryHint.includes('canada')) {
        pushLocation('Remote (Canada)');
      } else if (countryHint.includes('kingdom') || countryHint.includes('uk')) {
        pushLocation('Remote (UK)');
      } else {
        pushLocation('Remote (US)');
      }
    }
    const combined = formatLocationParts([exp.city, exp.state, exp.country]);
    if (combined) {
      pushLocation(combined);
    }
    if (typeof exp.location === 'string') {
      pushLocation(exp.location);
    }
  }

  const education = Array.isArray(resumeData.education) ? resumeData.education.filter(Boolean) : [];
  for (let i = education.length - 1; i >= 0; i -= 1) {
    const edu = education[i];
    if (!edu || typeof edu !== 'object') {
      continue;
    }
    const combined = formatLocationParts([edu.city, edu.state, edu.country]);
    if (combined) {
      pushLocation(combined);
    }
    if (typeof edu.location === 'string') {
      pushLocation(edu.location);
    }
  }

  if (typeof resumeData.location === 'string') {
    pushLocation(resumeData.location);
  }
  if (
    typeof resumeData.city === 'string' ||
    typeof resumeData.state === 'string' ||
    typeof resumeData.country === 'string'
  ) {
    const combined = formatLocationParts([resumeData.city, resumeData.state, resumeData.country]);
    if (combined) {
      pushLocation(combined);
    }
  }

  return ordered.slice(0, 8);
};

const decodeHtmlEntities = (value) => {
  if (typeof value !== 'string') {
    return '';
  }
  const htmlEntityMap = {
    '&nbsp;': ' ',
    '&#160;': ' ',
    '&amp;': '&',
    '&quot;': '"',
    '&#34;': '"',
    '&apos;': "'",
    '&#39;': "'",
    '&lt;': '<',
    '&#60;': '<',
    '&gt;': '>',
    '&#62;': '>',
  };
  let decoded = value.replace(/&[a-zA-Z#0-9]+;/g, (entity) => {
    const lower = entity.toLowerCase();
    if (htmlEntityMap[lower]) {
      return htmlEntityMap[lower];
    }
    if (/^&#x[0-9a-f]+;$/i.test(entity)) {
      const hex = entity.slice(3, -1);
      const codePoint = parseInt(hex, 16);
      if (!Number.isNaN(codePoint)) {
        return String.fromCharCode(codePoint);
      }
    }
    if (/^&#\d+;$/i.test(entity)) {
      const num = entity.slice(2, -1);
      const codePoint = parseInt(num, 10);
      if (!Number.isNaN(codePoint)) {
        return String.fromCharCode(codePoint);
      }
    }
    return entity;
  });
  return decoded;
};

const convertHTMLToPlainText = (value) => {
  if (typeof value !== 'string') {
    return '';
  }
  const decoded = decodeHtmlEntities(value);
  const blockTagPattern = /<\/?(p|div|section|article|li|ul|ol|br|h[1-6])[^>]*>/gi;
  let text = decoded.replace(blockTagPattern, '\n');
  text = text.replace(/<[^>]+>/g, ' ');
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
};

const extractJobDescriptionHighlight = (description) => {
  const plainText = convertHTMLToPlainText(description);
  if (!plainText) {
    return '';
  }
  const normalized = plainText.replace(/\r/g, ' ').replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return '';
  }
  const lineCandidates = plainText
    .split(/\r?\n+/)
    .map((line) => line.replace(/^[-*\u2022]\s*/, '').trim())
    .filter((line) => line.length >= 40 && line.length <= 220);
  if (lineCandidates.length > 0) {
    return lineCandidates[0];
  }
  const sentences = normalized.match(/[^.!?]+[.!?]?/g) || [];
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (trimmed.length >= 40 && trimmed.length <= 220) {
      return trimmed;
    }
  }
  if (normalized.length > 220) {
    return `${normalized.slice(0, 217).trim()}...`;
  }
  return normalized;
};

const humanizeKeyword = (keyword) => {
  if (typeof keyword !== 'string') {
    return '';
  }
  return keyword
    .split(/\s+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};

const parseDislikeKeywords = (raw) => {
  if (typeof raw !== 'string') {
    return [];
  }
  const seen = new Set();
  const keywords = [];
  raw
    .split(/[,;]+/)
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean)
    .forEach((token) => {
      if (token.length < 2 || seen.has(token)) {
        return;
      }
      seen.add(token);
      keywords.push(token);
    });
  return keywords.slice(0, 20);
};

const formatListForSentence = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return '';
  }
  if (items.length === 1) {
    return items[0];
  }
  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }
  const head = items.slice(0, -1).join(', ');
  return `${head}, and ${items[items.length - 1]}`;
};

const extractLatestExperienceInfo = (resumeData) => {
  if (!resumeData || typeof resumeData !== 'object') {
    return null;
  }
  const experiences = Array.isArray(resumeData.experiences) ? resumeData.experiences.filter(Boolean) : [];
  for (let i = experiences.length - 1; i >= 0; i -= 1) {
    const exp = experiences[i];
    if (!exp) {
      continue;
    }
    const title = typeof exp.jobTitle === 'string' ? exp.jobTitle.trim() : '';
    const company = typeof exp.company === 'string' ? exp.company.trim() : '';
    const summary = typeof exp.description === 'string' ? exp.description.trim() : '';
    if (title || company || summary) {
      return { title, company, summary };
    }
  }
  return null;
};

const extractQuantifiedSnippet = (text) => {
  if (typeof text !== 'string') {
    return '';
  }
  const normalized = text.replace(/\r/g, ' ').replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return '';
  }
  const sentences = normalized.match(/[^.!?]+[.!?]?/g) || [];
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (trimmed.length >= 40 && trimmed.length <= 200 && /\d/.test(trimmed)) {
      return trimmed;
    }
  }
  if (/\d/.test(normalized)) {
    const slice = normalized.slice(0, 200).trim();
    return slice.endsWith('.') ? slice : `${slice}...`;
  }
  return '';
};

const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE_ENDPOINT = 'https://nominatim.openstreetmap.org/reverse';
const NOMINATIM_MAX_RESULTS = 6;
const MIN_LOCATION_QUERY_LENGTH = 3;
const NOMINATIM_CONTACT_EMAIL = process.env.REACT_APP_NOMINATIM_EMAIL || 'support@hihired.org';

const normalizeGeocoderLocation = (item) => {
  if (!item || typeof item !== 'object') {
    return null;
  }
  const address = typeof item.address === 'object' && item.address ? item.address : {};
  const city = address.city
    || address.town
    || address.village
    || address.hamlet
    || address.municipality
    || address.locality
    || address.county;
  const state = address.state
    || address.state_district
    || address.region
    || address.province;
  const labelParts = [city, state].filter(Boolean);
  if (labelParts.length > 0) {
    return labelParts.join(', ');
  }
  if (typeof item.display_name === 'string' && item.display_name.trim()) {
    const slices = item.display_name.split(',').map((part) => part.trim()).filter(Boolean);
    if (slices.length >= 2) {
      return `${slices[0]}, ${slices[1]}`;
    }
    if (slices.length === 1) {
      return slices[0];
    }
  }
  return null;
};

const dedupeLocationList = (values) => {
  const seen = new Set();
  const result = [];
  values.forEach((value) => {
    if (!value || typeof value !== 'string') {
      return;
    }
    const normalized = value.trim();
    if (!normalized) {
      return;
    }
    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    result.push(normalized);
  });
  return result;
};

const reverseGeocodeCoordinates = async (latitude, longitude) => {
  if (typeof fetch !== 'function') {
    throw new Error('Geocoder unavailable in this environment.');
  }

  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(latitude),
    lon: String(longitude),
    addressdetails: '1',
  });
  if (NOMINATIM_CONTACT_EMAIL) {
    params.set('email', NOMINATIM_CONTACT_EMAIL);
  }

  const response = await fetch(`${NOMINATIM_REVERSE_ENDPOINT}?${params.toString()}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!response.ok) {
    throw new Error(`Geocoder reverse lookup failed with status ${response.status}`);
  }

  const payload = await response.json();
  return normalizeGeocoderLocation(payload);
};

const JOB_TITLE_KEYWORDS = [
  'engineer',
  'developer',
  'manager',
  'designer',
  'scientist',
  'analyst',
  'consultant',
  'architect',
  'specialist',
  'lead',
  'director',
  'strategist',
  'administrator',
  'coordinator',
  'marketer',
  'technician',
  'researcher',
  'product manager',
  'product designer',
  'product owner',
  'project manager',
  'program manager',
  'software',
  'frontend',
  'backend',
  'full stack',
  'devops',
  'security',
  'marketing manager',
  'sales manager',
  'recruiter',
  'data engineer',
  'data scientist',
  'data analyst',
  'operations manager',
];

const looksLikeJobTitle = (value) => {
  if (!value || typeof value !== 'string') {
    return false;
  }
  const lower = value.toLowerCase();
  return JOB_TITLE_KEYWORDS.some((keyword) => lower.includes(keyword));
};

const deriveTargetPosition = (resumeData, jobDescription = '') => {
  if (!resumeData || typeof resumeData !== 'object') {
    return '';
  }

  const directFields = ['position', 'desiredRole', 'role', 'headline', 'title'];
  for (const field of directFields) {
    const value = resumeData[field];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  const experiences = Array.isArray(resumeData.experiences) ? resumeData.experiences.filter(Boolean) : [];
  for (let i = experiences.length - 1; i >= 0; i -= 1) {
    const exp = experiences[i];
    if (exp && typeof exp.jobTitle === 'string' && exp.jobTitle.trim()) {
      return exp.jobTitle.trim();
    }
  }

  if (typeof resumeData.summary === 'string' && resumeData.summary.trim()) {
    const summary = resumeData.summary.trim();
    const summaryLower = summary.toLowerCase();
    const cleaned = summary.replace(/[|•·].*$/, '').replace(/-.*/, '').replace(/,.*/, '');
    if (looksLikeJobTitle(cleaned) && cleaned.split(/\s+/).length <= 6) {
      return cleaned;
    }
    const keywordMatch = JOB_TITLE_KEYWORDS
      .map((keyword) => ({ keyword, index: summaryLower.indexOf(keyword) }))
      .filter((entry) => entry.index >= 0)
      .sort((a, b) => a.index - b.index)[0];
    if (keywordMatch) {
      const { index, keyword } = keywordMatch;
      const sliceStart = summary.lastIndexOf(' ', Math.max(0, index - 35));
      const sliceEnd = summary.indexOf(' ', index + keyword.length);
      const candidate = summary
        .slice(sliceStart >= 0 ? sliceStart : 0, sliceEnd >= 0 ? sliceEnd : summary.length)
        .replace(/[|•·].*$/, '')
        .trim();
      if (looksLikeJobTitle(candidate) && candidate.split(/\s+/).length <= 6) {
        return candidate;
      }
    }
  }

  if (typeof jobDescription === 'string' && jobDescription.trim()) {
    const lines = jobDescription
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && line.length <= 60);
    for (const line of lines) {
      if (/^role:/i.test(line)) {
        const after = line.replace(/^role:\s*/i, '');
        if (after && looksLikeJobTitle(after)) {
          return after;
        }
      }
      const stripped = line.replace(/[:\-–].*$/, '').trim();
      if (looksLikeJobTitle(stripped) && stripped.split(/\s+/).length <= 6) {
        return stripped;
      }
    }
  }

  return '';
};

const summariseExperiences = (experiences) => {
  return (Array.isArray(experiences) ? experiences : [])
    .filter((exp) => exp && (exp.jobTitle || exp.company || exp.description))
    .map((exp) => {
      const header = [exp.jobTitle, exp.company].filter(Boolean).join(' at ');
      const desc = (exp.description || '').replace(/\s+/g, ' ').trim();
      if (header && desc) {
        return `${header}: ${desc}`;
      }
      return header || desc;
    })
    .filter(Boolean)
    .join('\n\n');
};

const summariseEducation = (education) => {
  return (Array.isArray(education) ? education : [])
    .filter((edu) => edu && (edu.school || edu.degree || edu.field || edu.graduationYear))
    .map((edu) => {
      const parts = [edu.degree, edu.field].filter(Boolean).join(' — ');
      const school = edu.school || '';
      const year = edu.graduationYear || '';
      return [parts, school, year].filter(Boolean).join(', ');
    })
    .filter(Boolean)
    .join('\n');
};

const normaliseSkillsForSummary = (skills) => {
  if (Array.isArray(skills)) {
    return skills.map((skill) => (skill || '').trim()).filter(Boolean);
  }
  if (typeof skills === 'string') {
    return skills
      .split(/[,\n;|]/)
      .map((skill) => skill.trim())
      .filter(Boolean);
  }
  return [];
};

const collectResumeSkills = (resumeData) => {
  if (!resumeData || typeof resumeData !== 'object') {
    return [];
  }

  const skillSet = new Set();
  normaliseSkillsForSummary(resumeData.skills).forEach((skill) => skillSet.add(skill));

  const projects = Array.isArray(resumeData.projects) ? resumeData.projects : [];
  projects.forEach((project) => {
    if (!project || typeof project !== 'object') {
      return;
    }
    if (typeof project.technologies === 'string' || Array.isArray(project.technologies)) {
      normaliseSkillsForSummary(project.technologies).forEach((skill) => skillSet.add(skill));
    }
    if (Array.isArray(project.skills) || typeof project.skills === 'string') {
      normaliseSkillsForSummary(project.skills).forEach((skill) => skillSet.add(skill));
    }
  });

  const experiencesCollection = Array.isArray(resumeData.experiences) ? resumeData.experiences : [];
  experiencesCollection.forEach((exp) => {
    if (!exp || typeof exp !== 'object') {
      return;
    }
    if (Array.isArray(exp.skills) || typeof exp.skills === 'string') {
      normaliseSkillsForSummary(exp.skills).forEach((skill) => skillSet.add(skill));
    }
    if (typeof exp.tools === 'string' || Array.isArray(exp.tools)) {
      normaliseSkillsForSummary(exp.tools).forEach((skill) => skillSet.add(skill));
    }
  });

  return Array.from(skillSet).slice(0, 60);
};

const getMatchKey = (match) => {
  if (!match) {
    return '';
  }
  if (match.job_posting_id) {
    return `posting-${match.job_posting_id}`;
  }
  if (match.id) {
    return `match-${match.id}`;
  }
  if (match.job_url) {
    return `url-${match.job_url}`;
  }
  if (match.job_title) {
    return `title-${match.job_title}`;
  }
  return 'job-match';
};

const US_STATE_ABBREVIATIONS = new Set([
  'al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'dc', 'fl', 'ga', 'hi', 'id', 'il', 'in', 'ia', 'ks', 'ky', 'la', 'me', 'md', 'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne', 'nv', 'nh', 'nj', 'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri', 'sc', 'sd', 'tn', 'tx', 'ut', 'vt', 'va', 'wa', 'wv', 'wi', 'wy',
]);

const US_STATE_NAMES = [
  'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut', 'delaware', 'district of columbia', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'new hampshire', 'new jersey', 'new mexico', 'new york', 'north carolina', 'north dakota', 'ohio', 'oklahoma', 'oregon', 'pennsylvania', 'rhode island', 'south carolina', 'south dakota', 'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 'west virginia', 'wisconsin', 'wyoming',
];

const US_KEYWORDS = ['united states', 'usa', 'u.s.', 'u.s.a', 'america', 'us-based'];
const NON_US_KEYWORDS = ['canada', 'ontario', 'quebec', 'british columbia', 'alberta', 'saskatchewan', 'manitoba', 'new brunswick', 'nova scotia', 'pei', 'prince edward island', 'toronto', 'vancouver', 'montreal', 'ottawa', 'calgary', 'europe', 'united kingdom', 'uk', 'germany', 'france', 'spain', 'italy', 'netherlands', 'belgium', 'sweden', 'norway', 'denmark', 'finland', 'switzerland', 'poland', 'india', 'australia', 'new zealand', 'mexico', 'brazil', 'singapore'];

const sanitizeLocationToken = (token) => token.replace(/[^a-z]/g, '');

const isLikelyUSLocation = (value) => {
  if (!value || typeof value !== 'string') {
    return false;
  }
  const normalized = value.toLowerCase();
  if (NON_US_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return false;
  }
  if (US_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return true;
  }
  if (US_STATE_NAMES.some((state) => normalized.includes(state))) {
    return true;
  }
  const tokens = normalized.split(/[,/\-\s]+/).filter(Boolean);
  for (const token of tokens) {
    if (US_STATE_ABBREVIATIONS.has(sanitizeLocationToken(token))) {
      return true;
    }
  }
  return false;
};

const POPULAR_LOCATION_GROUPS = [
  {
    label: 'United States',
    options: [
      'Remote (US)',
      'New York, NY',
      'San Francisco Bay Area, CA',
      'Los Angeles, CA',
      'Chicago, IL',
      'Boston, MA',
      'Seattle, WA',
      'Austin, TX',
      'Dallas, TX',
      'Houston, TX',
      'Denver, CO',
      'Phoenix, AZ',
      'Las Vegas, NV',
      'San Diego, CA',
      'Portland, OR',
      'Salt Lake City, UT',
      'Atlanta, GA',
      'Miami, FL',
      'Washington, DC',
      'Charlotte, NC',
      'Raleigh, NC',
      'Philadelphia, PA',
      'Minneapolis, MN',
      'Nashville, TN',
    ],
  },
];
const POPULAR_LOCATION_VALUES = POPULAR_LOCATION_GROUPS.flatMap((group) => group.options);

const TEMPLATE_SECTION_HASHES = new Set(['#template', '#format', '#template-format']);

const steps = [
  "Import Resume",
  "Template & Format",
  "Personal Details",
  "Job Description (Optional)",
  "Experience",
  "Projects",
  "Education",
  "Skills",
  "Summary",
  "Job Matches",
  "Cover Letter"
];
const STEP_IDS = {
  IMPORT: 1,
  FORMAT: 2,
  PERSONAL: 3,
  JOB_DESCRIPTION: 4,
  EXPERIENCE: 5,
  PROJECTS: 6,
  EDUCATION: 7,
  SKILLS: 8,
  SUMMARY: 9,
  JOB_MATCHES: 10,
  COVER_LETTER: 11,
};

const CHAT_STAGE_TO_STEP = {
  importChoice: STEP_IDS.IMPORT,
  template: STEP_IDS.FORMAT,
  personal: STEP_IDS.PERSONAL,
  jobDescription: STEP_IDS.JOB_DESCRIPTION,
  experience: STEP_IDS.EXPERIENCE,
  projects: STEP_IDS.PROJECTS,
  education: STEP_IDS.EDUCATION,
  skills: STEP_IDS.SKILLS,
  summary: STEP_IDS.SUMMARY,
};

function BuilderPage() {
  const [step, setStep] = useState(STEP_IDS.FORMAT);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [jobDescriptions, setJobDescriptions] = useState(() =>
    ensureJobDescriptionList([])
  );
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [downloadNotice, setDownloadNotice] = useState(null);
  const [userRequestedImport, setUserRequestedImport] = useState(false);
  const [jobMatches, setJobMatches] = useState([]);
  const [jobMatchesHash, setJobMatchesHash] = useState(null);
  const [jobMatchesLoading, setJobMatchesLoading] = useState(false);
  const [jobMatchesError, setJobMatchesError] = useState(null);
  const [jobMatchesLocation, setJobMatchesLocation] = useState('');
  const [jobDislikeInput, setJobDislikeInput] = useState('');
  const [geocodedLocationHints, setGeocodedLocationHints] = useState([]);
  const [isGeocodingLocation, setIsGeocodingLocation] = useState(false);
  const [isResolvingCurrentLocation, setIsResolvingCurrentLocation] = useState(false);
  const [geocoderError, setGeocoderError] = useState(null);
  const geocoderLastQueryRef = useRef('');
  const [isResumeGenerating, setIsResumeGenerating] = useState(false);
  const [navigateToJobMatchesPending, setNavigateToJobMatchesPending] = useState(false);
  const [tailorActiveJobId, setTailorActiveJobId] = useState(null);
  const [tailorNotice, setTailorNotice] = useState(null);
  const [tailorError, setTailorError] = useState(null);
  const [hoveredMatchKey, setHoveredMatchKey] = useState(null);
  const scrollBuilderIntoView = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.requestAnimationFrame(() => {
      const builderSection = document.querySelector('.builder-main-section');
      if (builderSection) {
        builderSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }, []);
  const focusTemplateStep = useCallback(() => {
    setUserRequestedImport(false);
    setStep(STEP_IDS.FORMAT);
    scrollBuilderIntoView();
  }, [scrollBuilderIntoView, setStep, setUserRequestedImport]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const currentUrl = new URL(window.location.href);
    const storedTarget = window.localStorage.getItem(BUILDER_TARGET_STEP_KEY);
    const hash = currentUrl.hash;
    const viewParam = currentUrl.searchParams.get('view');
    let shouldNavigateToJobs = false;
    let targetStep = null;
    let urlUpdated = false;

    if (storedTarget === BUILDER_TARGET_JOB_MATCHES) {
      shouldNavigateToJobs = true;
      window.localStorage.removeItem(BUILDER_TARGET_STEP_KEY);
    } else if (storedTarget === BUILDER_TARGET_TEMPLATE) {
      targetStep = STEP_IDS.FORMAT;
      window.localStorage.removeItem(BUILDER_TARGET_STEP_KEY);
    }

    if (hash === '#jobs' || hash === '#job-matches') {
      shouldNavigateToJobs = true;
      currentUrl.hash = '';
      urlUpdated = true;
    }

    if (TEMPLATE_SECTION_HASHES.has(hash)) {
      targetStep = STEP_IDS.FORMAT;
      currentUrl.hash = '';
      urlUpdated = true;
    }

    if (viewParam === 'jobs') {
      shouldNavigateToJobs = true;
      currentUrl.searchParams.delete('view');
      urlUpdated = true;
    }

    if (viewParam === 'template' || viewParam === 'format') {
      targetStep = STEP_IDS.FORMAT;
      currentUrl.searchParams.delete('view');
      urlUpdated = true;
    }

    if (shouldNavigateToJobs) {
      setNavigateToJobMatchesPending(true);
    }

    if (targetStep === STEP_IDS.FORMAT) {
      focusTemplateStep();
    } else if (targetStep) {
      setStep(targetStep);
    }

    if (urlUpdated) {
      const searchString = currentUrl.searchParams.toString();
      const cleanedUrl = `${currentUrl.pathname}${searchString ? `?${searchString}` : ''}${currentUrl.hash}`;
      window.history.replaceState({}, document.title, cleanedUrl);
    }
  }, [focusTemplateStep]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleHashChange = () => {
      const { hash } = window.location;
      if (TEMPLATE_SECTION_HASHES.has(hash.toLowerCase())) {
        focusTemplateStep();
        const cleaned = `${window.location.pathname}${window.location.search}`;
        window.history.replaceState({}, document.title, cleaned);
      }
    };

    const handleTemplateJump = () => {
      focusTemplateStep();
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('builder:jump-template', handleTemplateJump);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('builder:jump-template', handleTemplateJump);
    };
  }, [focusTemplateStep]);
  const { user, logout, loading } = useAuth();
  const { triggerFeedbackPrompt, scheduleFollowUp } = useFeedback();
  const { data, updateData } = useResume();
  const displayName = typeof user === 'string' ? user : (user?.name || user?.email || '');
  const selectedFormat = normalizeTemplateId(data?.selectedFormat);
  const autoLocation = useMemo(() => derivePrimaryLocation(data), [data]);
  const resumeLocationSuggestions = useMemo(() => {
    const suggestions = extractResumeLocations(data);
    if (!Array.isArray(suggestions)) {
      return [];
    }
    return suggestions
      .filter((loc) => {
        if (!loc) return false;
        if (!autoLocation) return true;
        return loc.toLowerCase() !== autoLocation.toLowerCase();
      })
      .slice(0, 6);
  }, [data, autoLocation]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const flag = window.localStorage.getItem('chatJobMatchesRedirect');
    if (flag === '1') {
      window.localStorage.removeItem('chatJobMatchesRedirect');
      setNavigateToJobMatchesPending(true);
    }
  }, []);

  const locationSuggestionOptions = useMemo(() => {
    const seen = new Set();
    const options = [];
    const addOption = (value) => {
      if (!value || typeof value !== 'string') {
        return;
      }
      const trimmed = value.trim();
      if (!trimmed) {
        return;
      }
      const key = trimmed.toLowerCase();
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      options.push(trimmed);
    };
    addOption(autoLocation);
    resumeLocationSuggestions.forEach(addOption);
    geocodedLocationHints.forEach(addOption);
    POPULAR_LOCATION_VALUES.forEach(addOption);
    return options;
  }, [autoLocation, resumeLocationSuggestions, geocodedLocationHints]);

  useEffect(() => {
    trackBuilderLoaded('builder_page');
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user) {
      setShowAuthModal(true);
    } else {
      setShowAuthModal(false);
    }
  }, [user, loading]);


  useEffect(() => {
    const query = (jobMatchesLocation || '').trim();
    if (!query || query.length < MIN_LOCATION_QUERY_LENGTH) {
      setGeocodedLocationHints([]);
      setGeocoderError(null);
      setIsGeocodingLocation(false);
      if (!query) {
        geocoderLastQueryRef.current = '';
      }
      return;
    }

    const normalizedQuery = query.toLowerCase();
    if (geocoderLastQueryRef.current === normalizedQuery) {
      return;
    }

    if (normalizedQuery.includes('remote')) {
      setGeocodedLocationHints([]);
      setGeocoderError(null);
      setIsGeocodingLocation(false);
      geocoderLastQueryRef.current = normalizedQuery;
      return;
    }

    const controller = new AbortController();
    setIsGeocodingLocation(true);
    setGeocoderError(null);

    const debounceId = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          format: 'jsonv2',
          addressdetails: '1',
          limit: String(NOMINATIM_MAX_RESULTS),
          countrycodes: 'us',
          q: query,
        });
        if (NOMINATIM_CONTACT_EMAIL) {
          params.set('email', NOMINATIM_CONTACT_EMAIL);
        }

        const response = await fetch(`${NOMINATIM_ENDPOINT}?${params.toString()}`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Geocoder request failed with status ${response.status}`);
        }

        const payload = await response.json();
        const normalized = Array.isArray(payload)
          ? dedupeLocationList(payload.map((item) => normalizeGeocoderLocation(item)).filter(Boolean)).slice(0, NOMINATIM_MAX_RESULTS)
          : [];

        setGeocodedLocationHints(normalized);
        geocoderLastQueryRef.current = normalizedQuery;
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }
        console.error('Location autocomplete lookup failed', error);
        setGeocodedLocationHints([]);
        setGeocoderError('Unable to load city suggestions right now.');
      } finally {
        setIsGeocodingLocation(false);
      }
    }, 350);

    return () => {
      clearTimeout(debounceId);
      controller.abort();
    };
  }, [jobMatchesLocation]);

  const hasExistingResumeData = useMemo(() => {
    if (!data) return false;
    const hasPersonal = Boolean(data.name || data.email || data.phone);
    const hasExperience = Array.isArray(data.experiences) && data.experiences.some((exp) => exp && (exp.jobTitle || exp.company || exp.description));
    const hasEducation = Array.isArray(data.education) && data.education.some((edu) => edu && (edu.degree || edu.school || edu.field || edu.graduationYear));
    const hasProjects = Array.isArray(data.projects) && data.projects.some((proj) => proj && (proj.projectName || proj.description || proj.technologies));
  const hasSummary = Boolean(data.summary);
  return hasPersonal || hasExperience || hasEducation || hasProjects || hasSummary;
  }, [data]);

  const combinedJobDescription = useMemo(
    () => combineJobDescriptions(jobDescriptions),
    [jobDescriptions]
  );

  const jobDislikeKeywords = useMemo(
    () => parseDislikeKeywords(jobDislikeInput),
    [jobDislikeInput]
  );

  const jobDislikeLabels = useMemo(
    () => jobDislikeKeywords.map((keyword) => humanizeKeyword(keyword)).filter(Boolean),
    [jobDislikeKeywords]
  );

  const targetPosition = useMemo(
    () => deriveTargetPosition(data, combinedJobDescription),
    [data, combinedJobDescription]
  );

  const resumeSkills = useMemo(() => collectResumeSkills(data), [data]);

  const latestRoleInfo = useMemo(() => extractLatestExperienceInfo(data), [data]);

  const quantifiedSummary = useMemo(() => {
    const summaryText = typeof data?.summary === 'string' ? data.summary : '';
    return extractQuantifiedSnippet(summaryText);
  }, [data]);

  const latestImpactSnippet = useMemo(
    () => extractQuantifiedSnippet((latestRoleInfo && latestRoleInfo.summary) || ''),
    [latestRoleInfo]
  );

  
  // Load job descriptions from localStorage on component mount
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const serializedList = window.localStorage.getItem('jobDescriptions');
      if (serializedList) {
        const parsed = JSON.parse(serializedList);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setJobDescriptions(ensureJobDescriptionList(parsed));
          return;
        }
      }
      const legacy = window.localStorage.getItem('jobDescription');
      if (legacy && legacy.trim()) {
        setJobDescriptions(
          ensureJobDescriptionList([createJobDescriptionEntry({ text: legacy.trim() })])
        );
      }
    } catch (err) {
      console.error('Failed to load stored job descriptions', err);
    }
  }, []);

  // Persist job descriptions and combined legacy string
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const prepared = prepareJobDescriptionsForStorage(jobDescriptions);
      if (prepared.length > 0) {
        window.localStorage.setItem('jobDescriptions', JSON.stringify(prepared));
      } else {
        window.localStorage.removeItem('jobDescriptions');
      }
      const legacyCombined = combinedJobDescription.trim();
      if (legacyCombined) {
        window.localStorage.setItem('jobDescription', legacyCombined);
      } else {
        window.localStorage.removeItem('jobDescription');
      }
    } catch (err) {
      console.error('Failed to persist job descriptions', err);
    }
  }, [jobDescriptions, combinedJobDescription]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const handleReloadJobDescriptions = () => {
      try {
        const serializedList = window.localStorage.getItem('jobDescriptions');
        if (serializedList) {
          const parsed = JSON.parse(serializedList);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setJobDescriptions(ensureJobDescriptionList(parsed));
            return;
          }
        }
      } catch (err) {
        console.error('Failed to reload job descriptions from event', err);
      }
    };
    window.addEventListener('builder:reload-job-descriptions', handleReloadJobDescriptions);
    return () => {
      window.removeEventListener('builder:reload-job-descriptions', handleReloadJobDescriptions);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setJobMatches([]);
      setJobMatchesHash(null);
      setJobMatchesError(null);
      setJobMatchesLocation('');
      return;
    }

    let cancelled = false;
    setJobMatchesLoading(true);
    getJobMatches({ limit: 20 })
      .then((response) => {
        if (cancelled) return;
        const matches = Array.isArray(response.matches) ? response.matches : [];
        setJobMatches(matches);
        setJobMatchesHash(response.resumeHash || null);
        setJobMatchesError(null);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Failed to load stored job matches', error);
        setJobMatchesError(error.message || 'Unable to load job matches.');
        setJobMatches([]);
        setJobMatchesHash(null);
      })
      .finally(() => {
        if (cancelled) return;
        setJobMatchesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, autoLocation]);

  const effectiveLocation = (jobMatchesLocation && jobMatchesLocation.trim()) || autoLocation || '';
  const buildJobFitReasons = useCallback(
    (match) => {
      if (!match || typeof match !== 'object') {
        return [];
      }
      const reasons = [];
      const score = typeof match.match_score === 'number' ? match.match_score : null;
      const jobDepartment = typeof match.job_department === 'string' ? match.job_department.trim() : '';
      const jobRemoteType = typeof match.job_remote_type === 'string' ? match.job_remote_type.trim() : '';
      const jobLocation = typeof match.job_location === 'string' ? match.job_location.trim() : '';
      const companyName = typeof match.company_name === 'string' ? match.company_name.trim() : '';
      const jobTitle = typeof match.job_title === 'string' ? match.job_title.trim() : '';
      const employmentType = typeof match.job_employment_type === 'string' ? match.job_employment_type.trim() : '';
      const jobHighlight = extractJobDescriptionHighlight(match.job_description);
      const jobTextLower = typeof match.job_description === 'string' ? match.job_description.toLowerCase() : '';
      const normalizedResumeSkills = Array.isArray(resumeSkills)
        ? resumeSkills
            .map((skill) => (typeof skill === 'string' ? skill.trim() : ''))
            .filter((skill) => Boolean(skill))
        : [];
      const skillHits = jobTextLower
        ? normalizedResumeSkills.filter((skill) => jobTextLower.includes(skill.toLowerCase())).slice(0, 3)
        : [];
      const fallbackSkills = normalizedResumeSkills.slice(0, 3);

      const formatLabel = (value) =>
        value
          .split(/[\s_]+/)
          .filter(Boolean)
          .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
          .join(' ');

      if (score !== null && score >= 0) {
        const qualifier = score >= 85 ? 'exceptional' : score >= 70 ? 'strong' : 'solid';
        reasons.push(
          `AI match score of ${score.toFixed(1)} is ${qualifier}, signaling recruiters will quickly see how your achievements map to this opening.`
        );
      }

      if (targetPosition) {
        const roleLabel = jobTitle || 'this role';
        reasons.push(
          `The ${roleLabel} brief keeps you squarely on the ${targetPosition} trajectory you called out, so your resume story stays perfectly aligned.`
        );
      }

      if (skillHits.length > 0) {
        reasons.push(
          `You already lead with ${formatListForSentence(skillHits)}, the exact stack cited in the description—zero retooling required.`
        );
      } else if (fallbackSkills.length > 0) {
        reasons.push(
          `Signature strengths like ${formatListForSentence(fallbackSkills)} give you punchy talking points for the hiring panel even before tailoring.`
        );
      }

      if (jobDepartment) {
        reasons.push(
          `You'll partner with the ${jobDepartment} org, which mirrors the environments you've highlighted across your recent experience.`
        );
      }

      if (jobRemoteType) {
        const remoteLower = jobRemoteType.toLowerCase();
        let remoteSentence = `Team supports a ${remoteLower} schedule`;
        if (remoteLower.includes('remote')) {
          remoteSentence = 'Team already operates fully remote, letting you contribute from wherever you are most effective';
        } else if (remoteLower.includes('hybrid')) {
          remoteSentence = 'Hybrid rhythm blends on-site collaboration with deep-focus remote days';
        } else if (remoteLower.includes('onsite') || remoteLower.includes('on-site')) {
          remoteSentence = 'On-site environment keeps you close to decision makers and speeds up feedback loops';
        }
        if (effectiveLocation) {
          remoteSentence = `${remoteSentence}, aligning with your preferred location (${effectiveLocation}).`;
        } else if (jobLocation) {
          remoteSentence = `${remoteSentence} while staying connected to the ${jobLocation} hub.`;
        } else {
          remoteSentence = `${remoteSentence}.`;
        }
        reasons.push(remoteSentence);
      }

      if (jobLocation && effectiveLocation) {
        reasons.push(`Located in ${jobLocation}, so you can chase the role without straying from ${effectiveLocation}.`);
      } else if (jobLocation) {
        reasons.push(`Located in ${jobLocation}, giving you immediate visibility with the hiring team.`);
      }

      if (employmentType) {
        const displayEmployment = formatLabel(employmentType);
        reasons.push(
          `${displayEmployment} arrangement keeps scope clear and signals the kind of stability recruiters value in senior candidates.`
        );
      }

      if (jobHighlight) {
        reasons.push(
          `The job description highlights "${jobHighlight}", echoing the impact stories you've already quantified in your resume.`
        );
      }

      if (companyName) {
        const roleLabel = jobTitle || 'this role';
        reasons.push(
          `${companyName} is actively scaling ${roleLabel}, so your application addresses a live, high-priority need instead of a passive talent pool.`
        );
      } else if (jobTitle) {
        reasons.push(
          `Hiring managers are prioritizing the ${jobTitle} seat right now, so your tailored resume lands while the opportunity is hot.`
        );
      }

      let impactSnippetUsed = false;
      if (latestRoleInfo && (latestRoleInfo.title || latestRoleInfo.company || latestRoleInfo.summary)) {
        const latestLabelParts = [latestRoleInfo.title, latestRoleInfo.company].filter(Boolean);
        const latestLabel = latestLabelParts.join(' at ');
        const experienceLead = latestLabel ? `${latestLabel} experience` : 'Your recent experience';
        let experienceSentence = `${experienceLead} mirrors the scope this team owns`;
        if (latestImpactSnippet) {
          experienceSentence = `${experienceSentence} — for example, ${latestImpactSnippet}`;
          impactSnippetUsed = true;
        }
        reasons.push(`${experienceSentence}.`);
      }

      if (!impactSnippetUsed && quantifiedSummary) {
        reasons.push(
          `Your resume already quantifies wins: "${quantifiedSummary}", which gives the recruiter a persuasive proof point before they even open your profile.`
        );
      }

      if (!reasons.length) {
        reasons.push('This role aligns with the experience and skills saved in your resume.');
      }

      return reasons;
    },
    [effectiveLocation, resumeSkills, targetPosition, latestRoleInfo, latestImpactSnippet, quantifiedSummary]
  );
  const MatchReasonPopover = ({ reasons }) => {
    const popoverRef = useRef(null);
    const [verticalOffset, setVerticalOffset] = useState(0);

    useLayoutEffect(() => {
      if (!Array.isArray(reasons) || reasons.length === 0) {
        setVerticalOffset(0);
        return undefined;
      }
      if (typeof window === 'undefined') {
        return undefined;
      }
      const reposition = () => {
        if (!popoverRef.current) {
          return;
        }
        const rect = popoverRef.current.getBoundingClientRect();
        const viewportBottom = window.innerHeight - 16;
        const overflow = rect.bottom - viewportBottom;
        const nextOffset = overflow > 0 ? -overflow : 0;
        setVerticalOffset((prev) => (prev === nextOffset ? prev : nextOffset));
      };

      reposition();
      window.addEventListener('scroll', reposition, true);
      window.addEventListener('resize', reposition);
      return () => {
        window.removeEventListener('scroll', reposition, true);
        window.removeEventListener('resize', reposition);
      };
    }, [reasons]);

    if (!Array.isArray(reasons) || reasons.length === 0) {
      return null;
    }

    return (
      <div
        ref={popoverRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 'calc(100% + 12px)',
          right: 'auto',
          width: '320px',
          maxWidth: 'min(320px, 60vw)',
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 15px 35px rgba(15, 23, 42, 0.25)',
          borderRadius: '14px',
          padding: '0.85rem 1rem',
          zIndex: 40,
          transform: verticalOffset ? `translateY(${verticalOffset}px)` : undefined,
          transition: 'transform 0.12s ease-out',
          willChange: 'transform',
        }}
      >
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
          Why it's a fit
        </div>
        <ul style={{ margin: 0, paddingLeft: '1rem', color: '#0f172a', fontSize: '0.85rem', lineHeight: 1.45 }}>
          {reasons.map((reason, idx) => (
            <li key={`reason-${idx}`} style={{ marginBottom: '0.25rem' }}>
              {reason}
            </li>
          ))}
        </ul>
      </div>
    );
  };
  const isUSPreferredLocation = useMemo(() => isLikelyUSLocation(effectiveLocation), [effectiveLocation]);
  const keywordFilteredMatches = useMemo(() => {
    if (!Array.isArray(jobMatches)) {
      return [];
    }
    if (!jobDislikeKeywords.length) {
      return jobMatches;
    }
    return jobMatches.filter((match) => {
      if (!match || typeof match !== 'object') {
        return true;
      }
      const haystack = [
        match.job_title,
        match.job_description,
        match.job_department,
        match.job_location,
        match.job_remote_type,
        match.job_employment_type,
        match.company_name,
      ]
        .map((value) => (typeof value === 'string' ? value.toLowerCase() : ''))
        .filter(Boolean)
        .join(' ');
      if (!haystack) {
        return true;
      }
      return !jobDislikeKeywords.some((keyword) => haystack.includes(keyword));
    });
  }, [jobMatches, jobDislikeKeywords]);

  const filteredJobMatches = useMemo(() => {
    if (!Array.isArray(keywordFilteredMatches)) {
      return [];
    }
    if (!isUSPreferredLocation) {
      return keywordFilteredMatches;
    }
    return keywordFilteredMatches.filter((match) => {
      if (!match) {
        return false;
      }
      const location = typeof match.job_location === 'string' ? match.job_location : '';
      const remoteType = typeof match.job_remote_type === 'string' ? match.job_remote_type.toLowerCase() : '';
      if (isLikelyUSLocation(location)) {
        return true;
      }
      if (remoteType.includes('us') || remoteType.includes('united states')) {
        return true;
      }
      return false;
    });
  }, [keywordFilteredMatches, isUSPreferredLocation]);

  const keywordFilteredCount = Math.max(jobMatches.length - keywordFilteredMatches.length, 0);
  const locationFilteredCount = Math.max(keywordFilteredMatches.length - filteredJobMatches.length, 0);
  const filterSummaryText = useMemo(() => {
    const parts = [];
    if (locationFilteredCount > 0) {
      parts.push(`${locationFilteredCount} non-US listing${locationFilteredCount === 1 ? '' : 's'}`);
    }
    if (keywordFilteredCount > 0) {
      parts.push(`${keywordFilteredCount} keyword match${keywordFilteredCount === 1 ? '' : 'es'}`);
    }
    if (!parts.length) {
      return '.';
    }
    return ` — filtered ${parts.join(' and ')}.`;
  }, [locationFilteredCount, keywordFilteredCount]);
  const topMatch = filteredJobMatches.length > 0 ? filteredJobMatches[0] : null;
  const secondaryMatches = filteredJobMatches.length > 1 ? filteredJobMatches.slice(1) : [];
  const topMatchKey = topMatch ? getMatchKey(topMatch) : '';
  const trimmedJobDescription = combinedJobDescription.trim();
  const topMatchHasDescription = topMatch
    ? Boolean(((topMatch.job_description || '').trim()) || trimmedJobDescription)
    : false;

  useEffect(() => {
    if (step !== STEP_IDS.IMPORT || userRequestedImport) {
      return;
    }
    const seenImport = typeof window !== 'undefined' && window.localStorage.getItem('resumeImportSeen') === 'true';
    if (seenImport || hasExistingResumeData) {
      if (!seenImport && typeof window !== 'undefined') {
        window.localStorage.setItem('resumeImportSeen', 'true');
      }
      setUserRequestedImport(false);
      setStep(STEP_IDS.PERSONAL);
    }
  }, [step, hasExistingResumeData, userRequestedImport]);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    const previewElement = document.getElementById('resume-preview-container');
    if (!previewElement) return;

    if (!isFullscreen) {
      if (previewElement.requestFullscreen) {
        previewElement.requestFullscreen();
      } else if (previewElement.webkitRequestFullscreen) {
        previewElement.webkitRequestFullscreen();
      } else if (previewElement.msRequestFullscreen) {
        previewElement.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };
  const handlePreferredLocationChange = (value) => {
    setJobMatchesLocation(value);
    setGeocoderError(null);
  };

  const handlePreferredLocationBlur = () => {
    const trimmed = (jobMatchesLocation || '').trim();
    if (trimmed !== jobMatchesLocation) {
      setJobMatchesLocation(trimmed);
    }
  };

  const handleUseRemoteLocation = () => {
    setJobMatchesLocation('Remote (US)');
    setGeocodedLocationHints([]);
    setGeocoderError(null);
    geocoderLastQueryRef.current = 'remote (us)';
  };

  const handleDislikeInputChange = (value) => {
    setJobDislikeInput(value);
  };

  const handleClearDislikeInput = () => {
    setJobDislikeInput('');
  };

  const handleSelectLocationSuggestion = (value) => {
    if (!value) {
      return;
    }
    setJobMatchesLocation(value);
    setGeocoderError(null);
    geocoderLastQueryRef.current = value.toLowerCase();
  };

  const handleClearPreferredLocation = () => {
    setJobMatchesLocation('');
    setGeocodedLocationHints([]);
    setGeocoderError(null);
    setIsGeocodingLocation(false);
    geocoderLastQueryRef.current = '';
  };

  const handleUseCurrentLocation = () => {
    if (isResolvingCurrentLocation) {
      return;
    }

    if (typeof window === 'undefined' || !navigator || !navigator.geolocation) {
      setGeocoderError('Geolocation is not supported in this browser.');
      return;
    }

    setIsResolvingCurrentLocation(true);
    setGeocoderError(null);

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords || {};
        const label = await reverseGeocodeCoordinates(latitude, longitude);
        if (!label) {
          throw new Error('No city returned from geocoder');
        }
        setJobMatchesLocation(label);
        setGeocodedLocationHints((prev) => dedupeLocationList([label, ...prev]).slice(0, NOMINATIM_MAX_RESULTS));
        geocoderLastQueryRef.current = label.toLowerCase();
      } catch (error) {
        console.error('Unable to resolve current location', error);
        setGeocoderError('Unable to detect current city. Please type it manually.');
      } finally {
        setIsResolvingCurrentLocation(false);
      }
    }, (error) => {
      let message = 'Unable to detect current city. Please type it manually.';
      if (error && typeof error.code === 'number') {
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Location permission denied. You can type your city instead.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = 'Location information is unavailable right now.';
        } else if (error.code === error.TIMEOUT) {
          message = 'Timed out trying to detect your location.';
        }
      }
      setGeocoderError(message);
      setIsResolvingCurrentLocation(false);
    }, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 5 * 60 * 1000,
    });
  };

  const buildMatchPayload = useCallback(() => {
    if (!data) {
      return null;
    }

    const preferredLocation = (jobMatchesLocation && jobMatchesLocation.trim()) || autoLocation || '';
    const experienceSummary = summariseExperiences(data.experiences);
    const educationSummary = summariseEducation(data.education);
    const summaryText = typeof data.summary === 'string' ? data.summary : '';
    const position = targetPosition;
    const skills = resumeSkills;
    const normalizedJobDescription = trimmedJobDescription;

    return {
      position,
      name: data.name || '',
      email: data.email || '',
      summary: summaryText,
      experience: experienceSummary,
      education: educationSummary,
      jobDescription: normalizedJobDescription,
      location: preferredLocation,
      skills,
      htmlContent: '',
      candidateJobLimit: 400,
      maxResults: 25,
    };
  }, [data, trimmedJobDescription, jobMatchesLocation, autoLocation, targetPosition, resumeSkills]);

  const fetchJobMatches = useCallback(async () => {
    if (!user) {
      setJobMatchesError('Log in to see matching jobs.');
      return;
    }

    const payload = buildMatchPayload();
    if (!payload) {
      setJobMatchesError('Add resume details to view matching jobs.');
      return;
    }

    setJobMatchesLoading(true);
    setJobMatchesError(null);

    try {
      const response = await computeJobMatches(payload);
      const matches = Array.isArray(response.matches) ? response.matches : [];
      setJobMatches(matches);
      setJobMatchesHash(response.resumeHash || null);
    } catch (error) {
      console.error('Failed to compute job matches', error);
      setJobMatchesError(error.message || 'Unable to compute job matches.');
    } finally {
      setJobMatchesLoading(false);
    }
  }, [user, buildMatchPayload]);

  const handleAuthModalClose = useCallback(() => {
    if (user) {
      setShowAuthModal(false);
    }
  }, [user]);

  const handleAutoTailorResume = useCallback(async (match) => {
    if (!match) {
      setTailorError('Unable to run One-Click AI Resume: job details are missing.');
      return;
    }
    if (!user) {
      setTailorError('Please sign in to use One-Click AI Resume.');
      return;
    }
    if (!data) {
      setTailorError('Resume data has not loaded yet. Please try again in a moment.');
      return;
    }

    const jobDescriptionSource = ((match.job_description || '').trim()) || trimmedJobDescription;
    if (!jobDescriptionSource) {
      setTailorError('This job does not include a description yet. Add a job description to use One-Click AI Resume.');
      return;
    }

    const jobKey = getMatchKey(match);
    setTailorActiveJobId(jobKey);
    setTailorError(null);
    setTailorNotice(null);

    try {
      const experiences = Array.isArray(data.experiences) ? data.experiences : [];
      const updatedExperiences = [];
      for (const exp of experiences) {
        if (exp && typeof exp.description === 'string' && exp.description.trim()) {
          try {
            const optimizedDescription = await generateExperienceAI(exp.description, jobDescriptionSource);
            const cleanedDescription = typeof optimizedDescription === 'string' ? optimizedDescription.trim() : '';
            if (cleanedDescription) {
              updatedExperiences.push({ ...exp, description: optimizedDescription });
            } else {
              updatedExperiences.push(exp);
            }
          } catch (experienceError) {
            console.warn('Experience optimization failed', experienceError);
            updatedExperiences.push(exp);
          }
        } else {
          updatedExperiences.push(exp);
        }
      }

      const projects = Array.isArray(data.projects) ? data.projects : [];
      const updatedProjects = [];
      for (const project of projects) {
        if (project && (project.description?.trim() || project.projectName)) {
          try {
            const optimizedProject = await optimizeProjectAI(project, jobDescriptionSource);
            if (optimizedProject && typeof optimizedProject === 'object') {
              const mergedProject = { ...project };
              Object.entries(optimizedProject).forEach(([key, value]) => {
                if (value === undefined || value === null) {
                  return;
                }
                if (typeof value === 'string') {
                  const trimmedValue = value.trim();
                  if (trimmedValue) {
                    mergedProject[key] = value;
                  }
                  return;
                }
                mergedProject[key] = value;
              });
              if (typeof mergedProject.description === 'string' && !mergedProject.description.trim() && project.description) {
                mergedProject.description = project.description;
              }
              updatedProjects.push(mergedProject);
            } else if (typeof optimizedProject === 'string') {
              const trimmedDescription = optimizedProject.trim();
              if (trimmedDescription) {
                updatedProjects.push({ ...project, description: optimizedProject });
              } else {
                updatedProjects.push(project);
              }
            } else {
              updatedProjects.push(project);
            }
          } catch (projectError) {
            console.warn('Project optimization failed', projectError);
            updatedProjects.push(project);
          }
        } else {
          updatedProjects.push(project);
        }
      }

      const education = Array.isArray(data.education) ? data.education : [];
      const skillsList = normaliseSkillsForSummary(data.skills);

      let updatedSummary = data.summary;
      try {
        const experienceSummaryText = summariseExperiences(updatedExperiences);
        const educationSummaryText = summariseEducation(education);
        const experiencePayload = [
          experienceSummaryText,
          jobDescriptionSource ? `Job Description:\n${jobDescriptionSource}` : ''
        ]
          .filter(Boolean)
          .join('\n\n');

        updatedSummary = await generateSummaryAI({
          experience: experiencePayload,
          education: educationSummaryText,
          skills: skillsList,
        });
      } catch (summaryError) {
        console.warn('Summary generation failed', summaryError);
      }

      updateData({
        ...data,
        experiences: updatedExperiences,
        projects: updatedProjects,
        summary: updatedSummary || data.summary,
      });

      setTailorNotice(`One-Click AI Resume generated for ${match.job_title || 'this job'}. Review and tweak before downloading.`);
    } catch (err) {
      console.error('Failed to run One-Click AI Resume', err);
      setTailorError(err.message || 'Failed to run One-Click AI Resume.');
    } finally {
      setTailorActiveJobId(null);
    }
  }, [data, combinedJobDescription, updateData, user]);
  useEffect(() => {
    if (step !== STEP_IDS.JOB_MATCHES) {
      return;
    }
    if (!user) {
      return;
    }
    if (jobMatchesLoading) {
      return;
    }
    if (jobMatchesError) {
      return;
    }
    if (jobMatchesHash) {
      return;
    }
    if (jobMatches.length > 0) {
      return;
    }
    fetchJobMatches().catch((error) => {
      console.error('Automatic job match fetch failed', error);
    });
  }, [step, user, jobMatches.length, jobMatchesLoading, jobMatchesError, jobMatchesHash, fetchJobMatches]);

  useEffect(() => {
    if (!navigateToJobMatchesPending) {
      return;
    }
    if (isResumeGenerating) {
      return;
    }
    if (jobMatchesLoading) {
      return;
    }
    if (step !== STEP_IDS.JOB_MATCHES) {
      setStep(STEP_IDS.JOB_MATCHES);
    }
    setNavigateToJobMatchesPending(false);
  }, [navigateToJobMatchesPending, isResumeGenerating, jobMatchesLoading, step]);

  const handleImportComplete = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('resumeImportSeen', 'true');
    }
    setUserRequestedImport(false);
    setStep(STEP_IDS.PERSONAL);
    scrollBuilderIntoView();
  };
  const handleStepChange = (nextStep) => {
    if (nextStep === STEP_IDS.IMPORT) {
      setUserRequestedImport(true);
    } else {
      setUserRequestedImport(false);
    }
    setStep(nextStep);
    scrollBuilderIntoView();
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const handleBuilderStageFocus = (event) => {
      const stageKey = event?.detail?.stage;
      if (!stageKey) {
        return;
      }
      const targetStep = CHAT_STAGE_TO_STEP[stageKey];
      if (!targetStep) {
        return;
      }
      if (targetStep === STEP_IDS.IMPORT) {
        setUserRequestedImport(true);
      } else {
        setUserRequestedImport(false);
      }
      setStep(targetStep);
      scrollBuilderIntoView();
    };
    window.addEventListener('builder:focus-stage', handleBuilderStageFocus);
    return () => {
      window.removeEventListener('builder:focus-stage', handleBuilderStageFocus);
    };
  }, [scrollBuilderIntoView, setStep, setUserRequestedImport]);

  const goToPreviousStep = () => {
    handleStepChange(Math.max(step - 1, STEP_IDS.IMPORT));
  };

  const goToNextStep = () => {
    if (step === STEP_IDS.IMPORT) {
      handleImportComplete();
      return;
    }
    handleStepChange(Math.min(step + 1, steps.length));
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (e) => {
      // F11 key for fullscreen
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
      // Esc key to exit fullscreen
      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  // Function to format date
  // API base URL function
  
  // Handler for view resume action
  const handleViewResume = async () => {
    let styleOverride = null;
    let fetchInFlight = false;
    try {
      // Check if user is authenticated
      if (!user) {
        alert('Please log in to view your resume.');
        setShowAuthModal(true);
        return;
      }

      const canProceed = await checkSubscriptionLimit();
      if (!canProceed) {
        if (styleOverride && styleOverride.parentNode) {
          styleOverride.parentNode.removeChild(styleOverride);
        }
        return;
      }

      trackDownloadClicked(selectedFormat || 'default', { page: window.location.pathname });
      setDownloadNotice(null);

      // Track resume generation
      trackResumeGeneration(selectedFormat || 'default');
      setIsResumeGenerating(true);
      setNavigateToJobMatchesPending(true);
      fetchJobMatches().catch((error) => {
        console.error('Job match computation during download failed', error);
      });

      // Update button state
      const viewButton = document.querySelector('button[onClick]');
      if (viewButton) {
        viewButton.textContent = 'Generating PDF...';
        viewButton.disabled = true;
      }

      // Capture the HTML content from the live preview
      // Force all pages to be visible for PDF generation
      // Remove height constraints for PDF generation
      styleOverride = document.createElement("style");
      styleOverride.innerHTML = `
        .page-wrapper {
          height: auto !important;
          max-height: none !important;
          overflow: visible !important;
        }
        .page-content {
          height: auto !important;
          max-height: none !important;
          overflow: visible !important;
        }
      `;
      document.head.appendChild(styleOverride);
      const allPageWrappers = document.querySelectorAll(".page-wrapper");
      allPageWrappers.forEach(wrapper => {
        wrapper.style.display = "block";
        wrapper.style.visibility = "visible";
        wrapper.style.opacity = "1";
      });
      const previewElement = document.querySelector('.live-preview-container');
      
      if (previewElement) {
        // Clone the preview element (no inline style expansion to keep HTML small)
        const clonedElement = previewElement.cloneNode(true);
        

        
        // Remove the download button from the cloned element
        const downloadBtns = clonedElement.querySelectorAll('button');
        downloadBtns.forEach(btn => btn.remove());
        
        // IMPORTANT: Remove the outer live-preview-container wrapper's extra spacing/padding
        // which might be causing phantom pages
        if (clonedElement.className === 'live-preview-container') {
          clonedElement.style.padding = '0';
          clonedElement.style.margin = '0';
          clonedElement.style.minHeight = 'auto';
          clonedElement.style.height = 'auto';
          clonedElement.style.background = '#ffffff';
          clonedElement.style.boxShadow = 'none';
          clonedElement.style.border = 'none';
        }
        // Remove any control panels or debug elements
        const controlPanels = clonedElement.querySelectorAll('.boundary-toggle, [style*="textAlign: center"], [style*="text-align: center"]');
        controlPanels.forEach(panel => {
          // Check if this panel contains a download button
          const hasButton = panel.querySelector('button') || panel.innerHTML.includes('Download PDF');
          if (hasButton) {
            panel.remove();
          }
        });
        
        // Remove the download button container specifically
        const downloadContainer = clonedElement.querySelector('div[style*="textAlign: center"]');
        if (downloadContainer && downloadContainer.innerHTML.includes('Download PDF')) {
          downloadContainer.remove();
        }
        
        const overlaySelectors = [
          '.page-header',
          '.page-number',
          '.page-break-indicator',
          '.page-boundary-line',
          '.page-size-indicator',
          '.page-corner-indicator',
          '.page-margin-guide',
          '.page-break-line',
          '.page-content-area',
          '.page-navigation',
          '.page-info'
        ];
        overlaySelectors.forEach((selector) => {
          clonedElement.querySelectorAll(selector).forEach((el) => el.remove());
        });
        
        // Debug: Log structure to identify empty page cause

        
        // Handle both single-page and multi-page content
        const singlePageContainer = clonedElement.querySelector('.single-page-container');
        const multiPageContainer = clonedElement.querySelector('.multi-page-container');

        const normalizeElementSizing = (element) => {
          if (!element || !element.style) return;
          element.style.setProperty('height', 'auto', 'important');
          element.style.setProperty('max-height', 'none', 'important');
          element.style.setProperty('min-height', '0', 'important');
          element.style.removeProperty('transform');
          element.style.removeProperty('-webkit-transform');
          Array.from(element.children || []).forEach(child => normalizeElementSizing(child));
        };

        let workingSinglePageContainer = singlePageContainer;

        if (singlePageContainer && (!multiPageContainer || multiPageContainer.childElementCount === 0)) {
          const containerClone = singlePageContainer.cloneNode(true);
          normalizeElementSizing(containerClone);
          containerClone.style.padding = '12px 20px 20px 20px';
          containerClone.style.margin = '0';
          containerClone.style.border = 'none';
          containerClone.style.boxShadow = 'none';
          containerClone.style.borderRadius = '0';
          containerClone.style.background = '#ffffff';

          const cleanRoot = document.createElement('div');
          cleanRoot.className = 'pdf-single-page-root';
          cleanRoot.style.cssText = 'background:#ffffff;color:#000;margin:0;padding:0;box-sizing:border-box;';
          cleanRoot.appendChild(containerClone);

          clonedElement.innerHTML = '';
          clonedElement.appendChild(cleanRoot);

          workingSinglePageContainer = containerClone;
        }

        if (multiPageContainer && !workingSinglePageContainer) {
          const pageWrappers = multiPageContainer.querySelectorAll('.page-wrapper');
          console.log("HTML before processing:", clonedElement.innerHTML.includes("EDUCATION") ? "Contains EDUCATION" : "Missing EDUCATION");
          console.log("Found", pageWrappers.length, "pages in multi-page container");

          const combinedContent = document.createElement('div');
          combinedContent.className = 'multi-page-pdf-container';
          combinedContent.style.cssText = 'background: white; color: black; padding: 0; margin: 0; box-sizing: border-box;';

          const measuredPages = Array.from(pageWrappers)
            .map(wrapper => ({
              wrapper,
              pageContent: wrapper.querySelector('.page-content') || wrapper
            }))
            .filter(item => !!item.pageContent);

          measuredPages.forEach((page, index) => {
            const pageContainer = document.createElement('div');
            pageContainer.className = `pdf-page-${index + 1}`;

            let paddingTop = '20px';
            let paddingRight = '20px';
            let paddingBottom = '20px';
            let paddingLeft = '20px';

            if (page.wrapper && window.getComputedStyle) {
              const computedPadding = window.getComputedStyle(page.wrapper);
              paddingTop = computedPadding.getPropertyValue('padding-top') || paddingTop;
              paddingRight = computedPadding.getPropertyValue('padding-right') || paddingRight;
              paddingBottom = computedPadding.getPropertyValue('padding-bottom') || paddingBottom;
              paddingLeft = computedPadding.getPropertyValue('padding-left') || paddingLeft;
            }

            const parsedTop = parseFloat(paddingTop);
            let normalizedTop = Number.isNaN(parsedTop) ? 18 : Math.min(parsedTop, 18);
            if (index === 0) {
              normalizedTop = 16;
            }
            paddingTop = `${normalizedTop}px`;

            pageContainer.style.cssText = `
              width: 100%;
              padding: ${paddingTop} ${paddingRight} ${paddingBottom} ${paddingLeft};
              margin: 0;
              box-sizing: border-box;
              background: white;
              color: black;
              border: none;
              box-shadow: none;
              border-radius: 0;
              page-break-inside: avoid;
            `;

            const contentClone = page.pageContent.cloneNode(true);
            normalizeElementSizing(contentClone);
            contentClone.style.background = 'white';
            contentClone.style.color = 'black';
            pageContainer.appendChild(contentClone);

            if (index < measuredPages.length - 1) {
              pageContainer.style.pageBreakAfter = 'always';
            }

            combinedContent.appendChild(pageContainer);
          });

          multiPageContainer.parentNode.replaceChild(combinedContent, multiPageContainer);
        } else if (!singlePageContainer && !multiPageContainer) {
          // No content containers found
        } else {
          // Using existing single-page container
        }

        if (workingSinglePageContainer) {
          workingSinglePageContainer.style.paddingTop = '12px';
          workingSinglePageContainer.style.boxShadow = 'none';
          workingSinglePageContainer.style.border = 'none';
          workingSinglePageContainer.style.borderRadius = '0';
          workingSinglePageContainer.style.background = '#ffffff';
        }

        // DIFFERENT APPROACH: Clean up the HTML to prevent phantom pages
        // Remove any empty divs that might cause page breaks
        const allDivs = clonedElement.querySelectorAll('div');
        const hasStructuralStyles = (element) => {
          if (!element) {
            return false;
          }
          const inlineStyle = (element.getAttribute('style') || '').toLowerCase();
          const inlineBorder = ['border-bottom', 'border-top', 'border-left', 'border-right', 'border-width'].some(prop => inlineStyle.includes(prop)) && !inlineStyle.includes('border: none');
          const inlineBackground = inlineStyle.includes('background') && !inlineStyle.includes('background: none') && !inlineStyle.includes('background: transparent');
          const inlineShadow = inlineStyle.includes('box-shadow') && !inlineStyle.includes('box-shadow: none');
          if (inlineBorder || inlineBackground || inlineShadow) {
            return true;
          }
          if (window.getComputedStyle) {
            try {
              const computed = window.getComputedStyle(element);
              const borderProps = ['borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth'];
              const hasBorder = borderProps.some(prop => {
                const value = parseFloat(computed[prop]);
                return !Number.isNaN(value) && value > 0;
              });
              const background = computed.backgroundColor;
              const hasBackground = background && background !== 'rgba(0, 0, 0, 0)' && background !== 'transparent';
              const hasBoxShadow = computed.boxShadow && computed.boxShadow !== 'none';
              if (hasBorder || hasBackground || hasBoxShadow) {
                return true;
              }
            } catch (err) {
              // Ignore errors from detached nodes
            }
          }
          return false;
        };
        allDivs.forEach(div => {
          if (!div) return;
          const className = div.className || '';
          if (className.includes('page-wrapper') || className.includes('page-content') || className.includes('pdf-page')) {
            return;
          }
          // Remove divs that are empty or only contain whitespace
          if (!div.textContent || div.textContent.trim() === '') {
            // Check if it has no visible children
            const hasVisibleChildren = Array.from(div.children).some(child =>
              child.offsetWidth > 0 || child.offsetHeight > 0 || child.textContent.trim() !== ''
            );
            if (
              !hasVisibleChildren &&
              !hasStructuralStyles(div) &&
              !div.querySelector('img') &&
              !div.querySelector('svg')
            ) {
              div.remove();
            }
          }
        });
        
        // Remove any elements with excessive height that might push content to next page
        const containerDivs = clonedElement.querySelectorAll('[style*="height"]');
        containerDivs.forEach(div => {
          if (!div) return;
          const className = div.className || '';
          if (className.includes('page-wrapper') || className.includes('page-content') || className.includes('pdf-page')) {
            return;
          }
          if (div.style.height && div.style.height !== 'auto') {
            div.style.height = 'auto';
          }
          if (div.style.minHeight) {
            div.style.minHeight = 'auto';
          }
        });
        
        // Collect essential CSS for PDF generation
        const stylesheets = Array.from(document.styleSheets);
        const cssRules = [];
        
        stylesheets.forEach(sheet => {
          try {
            const rules = Array.from(sheet.cssRules);
            const relevantRules = rules.filter(rule => {
              if (rule.type === CSSRule.STYLE_RULE) {
                const selector = rule.selectorText || '';
                return selector.includes('.live-preview-container') || 
                       selector.includes('.page-wrapper') || 
                       selector.includes('.single-page-container') ||
                       selector.includes('.page-content');
              }
              return false;
            });
            
            cssRules.push(...relevantRules.map(rule => rule.cssText));
          } catch (e) {
            // Skip inaccessible stylesheets
          }
        });
        
        const filteredCssText = cssRules.join('\n');

        // Remove screen-only visual effects that cause a visible edge in PDFs
        const cleanedCssText = filteredCssText
          .replace(/box-shadow\s*:[^;]+;?/gi, '')
          .replace(/-webkit-box-shadow\s*:[^;]+;?/gi, '')
          .replace(/border-radius\s*:[^;]+;?/gi, '');

        // CRITICAL FIX: Apply font size scaling to match preview
        const selectedFontSize = data.selectedFontSize || 'medium';
        
        // Font size multipliers (must match LivePreview.jsx)
        const fontSizeMultipliers = {
          'small': 1.0,
          'medium': 1.2,
          'large': 1.5,
          'extra-large': 1.8
        };
        
        // Base scale factor for preview (2x) - same as LivePreview
        const baseScaleFactor = 2;
        const fontScale = baseScaleFactor * (fontSizeMultipliers[selectedFontSize] || 1.0);

        const getTemplateFont = () => {
          switch (selectedFormat || DEFAULT_TEMPLATE_ID) {
            case TEMPLATE_SLUGS.CLASSIC_PROFESSIONAL:
              return "'Calibri', 'Arial', sans-serif";
            case TEMPLATE_SLUGS.EXECUTIVE_SERIF:
              return "'Georgia', serif";
            case TEMPLATE_SLUGS.MODERN_CLEAN:
              return "'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', sans-serif";
            case TEMPLATE_SLUGS.ATTORNEY_TEMPLATE:
              return "'Book Antiqua', 'Georgia', serif";
            default:
              return "'Calibri', 'Arial', sans-serif";
          }
        };
        const getTemplateLineHeight = () => {
          switch (selectedFormat || DEFAULT_TEMPLATE_ID) {
            case TEMPLATE_SLUGS.CLASSIC_PROFESSIONAL:
              return 1.15; // Match preview default for classic template
            case TEMPLATE_SLUGS.MODERN_CLEAN:
              return 1.2;
            case TEMPLATE_SLUGS.EXECUTIVE_SERIF:
              return 1.25;
            case TEMPLATE_SLUGS.ATTORNEY_TEMPLATE:
              return 1.3;
            default:
              return 1.2;
          }
        };
        const templateFont = getTemplateFont();
        const templateLineHeight = getTemplateLineHeight();

        normalizeElementSizing(clonedElement);

        // PDF-specific overrides to ensure consistent rendering (keep minimal)
        const pdfOverrides = `
          @page { 
            size: Letter; 
            margin: 0;
          }
          
          /* Allow natural page breaks for long content */
          body {
            orphans: 2;
            widows: 2;
            page-break-inside: auto;
            height: auto !important;
          }
          
          /* Ensure sections can break naturally if needed */
          .live-preview-container {
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
          }

          .pdf-single-page-root > :not(.single-page-container) {
            display: none !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .live-preview-container > div[style*='text-align: center'][style*='margin-bottom: 20px'] {
            display: none !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .pdf-single-page-root {
            margin: 0 !important;
            padding: 0 !important;
          }
          .single-page-container {
            page-break-inside: auto;
            break-inside: auto;
            height: auto !important;
            max-height: none !important;
            min-height: auto !important;
          }
          /* IMPORTANT: Preserve font sizes from inline styles */
          /* Do not override fontSize that's already set inline */
          div[style*="fontSize"], 
          div[style*="font-size"],
          span[style*="fontSize"],
          span[style*="font-size"] {
            /* Their inline font-size should be preserved, not overridden */
          }
          
          /* Ensure page break elements work correctly with multiple CSS approaches */
          div[style*="page-break-before: always"], div[style*="break-before: page"] {
                page-break-before: always !important;
                break-before: page !important;
            -webkit-break-before: page !important;
                margin-top: 0 !important;
            padding-top: 16px !important;
          }
          
          /* Multi-page PDF container handling */
          .multi-page-pdf-container {
            width: 100%;
            margin: 0;
            padding: 0;
          }
          
          /* Each PDF page should be exactly one page */
          .multi-page-pdf-container > div[class^="pdf-page-"] {
            page-break-after: always !important;
            page-break-inside: avoid !important;
            min-height: auto !important;
            max-height: none !important;
            padding-bottom: 12px !important;
            overflow: visible !important;
            box-sizing: border-box !important;
          }
          .multi-page-pdf-container > div[class^="pdf-page-"]:first-child {
            padding-top: 12px !important;
            margin-top: 0 !important;
          }

          .pdf-single-page-root > .single-page-container {
            padding-top: 12px !important;
            padding-bottom: 12px !important;
            min-height: auto !important;
          }

          .single-page-container {
            min-height: auto !important;
          }

          .multi-page-pdf-container,
          .multi-page-pdf-container * {
            font-family: ${templateFont} !important;
          }

          /* Last page shouldn't have page break after */
          .multi-page-pdf-container > div[class^="pdf-page-"]:last-child {
            page-break-after: avoid !important;
          }
          
          /* Additional page break support */
          .page-content {
            display: block !important;
            visibility: visible !important;
            height: auto !important;
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
          }
          
          html, body { 
            background: #ffffff !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            color: #000000 !important;
            width: 100% !important;
            max-width: none !important;
            min-width: 100% !important;
          }
          
          /* Ensure all containers are visible and match preview layout */
          .live-preview-container { 
            background: #ffffff !important; 
            color: #000000 !important;
            display: block !important;
            visibility: visible !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
            width: 100% !important;
            max-width: none !important;
            min-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          .single-page-container { 
            background: #ffffff !important; 
            color: #000000 !important;
            display: block !important;
            visibility: visible !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
            width: 100% !important;
            max-width: none !important;
            min-width: 100% !important;
            padding: 16px 16px 8px 16px !important;
            margin: 0 !important;
            box-sizing: border-box !important;
          }
          
          /* Hide multi-page containers since we convert to single-page */
          .multi-page-container, .page-wrapper {
            display: none !important;
          }
          
          /* Remove borders from containers only */
          .live-preview-container, .single-page-container {
            border: none !important;
            box-shadow: none !important;
            outline: none !important;
          }
          
          /* Remove 3D transform effects for straight PDF boundaries */
          .single-page-container {
            transform: none !important;
            -webkit-transform: none !important;
            -moz-transform: none !important;
            -ms-transform: none !important;
          }
          
          .single-page-container:hover {
            transform: none !important;
            -webkit-transform: none !important;
            -moz-transform: none !important;
            -ms-transform: none !important;
          }
          
          /* Force all elements to use available width and prevent cutoff */
          * {
            word-wrap: break-word !important;
            word-break: normal !important;
            max-width: none !important;
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
            box-sizing: border-box !important;
          }
          
          /* Only force black color on main containers, preserve template colors */
          body, .live-preview-container, .single-page-container {
            color: #000000 !important;
          }
          
          /* Ensure all text containers have full width and proper text handling */
          /* BUT DO NOT override font sizes */
          div, p, span {
            max-width: none !important;
            width: auto !important;
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
            /* Let most content wrap normally to avoid overflow */
            white-space: normal !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            hyphens: auto !important;
            /* Do NOT set font-size here - preserve inline styles */
          }

          /* But for the skills section we rely on explicit
             newlines for readability, so preserve them. */
          .skills-inline {
            white-space: pre-wrap !important;
          }
          
          /* Ensure experience and content sections don't get truncated */
          div[style*="marginBottom: 6px"], 
          div[style*="margin-bottom: 6px"],
          div[style*="lineHeight"],
          div[style*="line-height"] {
            width: 100% !important;
            max-width: none !important;
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
            word-wrap: break-word !important;
            white-space: normal !important;
          }
          
          /* Add section title borders for separators */
          div[style*="fontSize: 11px"][style*="fontWeight: bold"][style*="textTransform: uppercase"],
          div[style*="font-size: 11px"][style*="font-weight: bold"][style*="text-transform: uppercase"] {
            border-bottom: 1px solid #000000 !important;
            padding-bottom: 4px !important;
            margin-bottom: 8px !important;
            width: 100% !important;
          }
          
          /* Hide buttons only */
          button {
            display: none !important;
          }
        `;
        

 
        console.log("Current selectedFormat:", selectedFormat);
        console.log("Current data.template:", data.template);
        console.log("Using font for template", selectedFormat, ":", templateFont);
        console.log("Template (selectedFormat):", selectedFormat);
        console.log("Font selected:", templateFont);
        console.log("All data keys:", Object.keys(data));
        
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.name || 'Resume'}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    /* Fallback font for PDF generation - only apply if no font is specified */
    body {
      font-family: ${templateFont};
      line-height: ${templateLineHeight};
    }
    /* Let template-specific fonts take precedence */
  </style>
  <style>
    body { margin: 0; padding: 0; background-color: white; }
    ${cleanedCssText}
  </style>
  <style>
    /* PDF-specific overrides - MUST be in separate style tag to ensure they come last */
    ${pdfOverrides}
  </style>
  <style>
    /* CRITICAL: Remove any font-size overrides that might interfere with inline styles */
    /* Inline styles should always win for font sizes */
    * {
      /* Reset any font-size !important that might override inline styles */
    }
    
    /* Ensure font size scaling from selected size (${selectedFontSize}) is preserved */
    /* The preview scales fonts by ${fontScale}x which should be in inline styles */
  </style>
</head>
<body>
  ${clonedElement.outerHTML}
</body>
</html>`;

        // Minify HTML to keep payload small while preserving
        // meaningful newlines inside text (used with white-space: pre-wrap).
        const minifyHtml = (html) => html
          .replace(/>\s+</g, '><')
          .replace(/[ \t]{2,}/g, ' ');
        const minHtmlContent = minifyHtml(htmlContent);

        // Call the backend to generate PDF using multipart upload (smaller, proxy-friendly)
        const htmlBlob = new Blob([minHtmlContent], { type: 'text/html' });
        const formData = new FormData();
        formData.append('html', htmlBlob, 'resume.html');
        
        // Add contact info to save in database
        formData.append('name', data.name || '');
        formData.append('email', data.email || '');
        formData.append('phone', data.phone || '');
        
        // Force Chromium engine usage in backend
        formData.append('engine', 'chromium-strict');

        // Get token directly and only set Authorization header
        const token = localStorage.getItem('resumeToken');
        console.log('Token for PDF generation:', token); // Debug log
        
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        console.log('Headers being sent:', headers); // Debug log
        
        fetchInFlight = true;
        fetch(`${getAPIBaseURL()}/api/resume/generate-pdf-file`, {
          method: 'POST',
          headers,
          body: formData
        })
        .then(async (response) => {
          const text = await response.text();
          try {
            const json = JSON.parse(text);
            return { ok: response.ok, status: response.status, data: json, raw: text };
          } catch (e) {
            return { ok: response.ok, status: response.status, data: null, raw: text };
          }
        })
        .then(result => {
          if (result.status === 403) {
            console.log('403 detected - setting up modal');
            console.log('Result data:', result.data);

            const token = localStorage.getItem('resumeToken');
            let currentPlan = 'free';
            if (token) {
              try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                currentPlan = payload.plan || 'free';
              } catch (e) {
                console.log('Could not parse token for plan');
              }
            }

            const subscriptionInfo = {
              usage: {
                can_generate: false,
                remaining: 0,
                reset_date: result.data?.resetDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                limitReached: true
              },
              subscription: {
                plan_name: result.data?.plan?.toLowerCase() || currentPlan,
                display_name: result.data?.plan || currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1),
                resume_limit: result.data?.limit || (currentPlan === 'premium' ? 30 : currentPlan === 'ultimate' ? 200 : 1),
                resume_period: result.data?.period || (currentPlan === 'free' ? 'week' : 'month')
              }
            };

            setSubscriptionData(subscriptionInfo);
            console.log('Subscription data set:', subscriptionInfo);

            console.log('Current modal state before:', showUpgradeModal);
            setShowUpgradeModal(false);
            setTimeout(() => {
              console.log('Setting modal to true');
              setShowUpgradeModal(true);
            }, 10);

            setNavigateToJobMatchesPending(false);

            const buttons = document.querySelectorAll('button');
            buttons.forEach(btn => {
              if (btn.textContent.includes('Generating PDF')) {
                btn.textContent = '📄 Generate Resume';
                btn.disabled = false;
              }
            });
            return;
          }

          if (result.ok && result.data && result.data.downloadURL) {
            const downloadUrl = result.data.downloadURL;
            let popupWindow = null;
            let popupBlocked = false;
            try {
              popupWindow = window.open(downloadUrl, '_blank');
              if (popupWindow) {
                try {
                  popupWindow.opener = null;
                } catch (_) { /* noop */ }
                if (typeof popupWindow.focus === 'function') {
                  popupWindow.focus();
                }
              } else {
                popupBlocked = true;
              }
            } catch (popupError) {
              console.error('Unable to open resume in new tab automatically:', popupError);
              popupBlocked = true;
            }
            if (!popupBlocked && popupWindow && popupWindow.closed === true) {
              popupBlocked = true;
            }
            setDownloadNotice({
              message: popupBlocked
                ? 'Your browser blocked the download pop-up. Please allow pop-ups for HiHired or use the direct link below.'
                : 'We opened your resume in a new tab. If it did not appear, allow pop-ups for HiHired or use the direct link below.',
              link: downloadUrl,
              blocked: popupBlocked,
            });

            setLastStep('resume_download_success');
            triggerFeedbackPrompt({
              scenario: 'resume_download',
              metadata: { template: selectedFormat },
            });
            scheduleFollowUp({
              trigger: 'resume_download',
              metadata: { template: selectedFormat },
            });
          } else {
            setNavigateToJobMatchesPending(false);
            console.error('PDF generation failed response:', result);
            setLastStep('resume_download_error');
            triggerFeedbackPrompt({
              scenario: 'resume_download',
              metadata: { result: 'error', status: result.status || null },
              force: true,
            });
            if (result.status !== 403) {
              alert((result.data && (result.data.error || result.data.message)) || `Failed to generate PDF (status ${result.status})`);
            }
          }
        })
        .catch(error => {
          console.error('PDF generation error:', error);
          setNavigateToJobMatchesPending(false);
          setLastStep('resume_download_error');
          triggerFeedbackPrompt({
            scenario: 'resume_download',
            metadata: { result: 'error', message: error?.message || '' },
            force: true,
          });
          if (!error.message?.includes('limit')) {
            alert('Failed to generate PDF. Please try again.');
          }
        })
        .finally(() => {
          setIsResumeGenerating(false);
          const viewButton = document.querySelector('button[onClick]');
          if (viewButton) {
            viewButton.textContent = '📄 View Resume';
            viewButton.disabled = false;
          }
          if (styleOverride && styleOverride.parentNode) {
            styleOverride.parentNode.removeChild(styleOverride);
          }
        });

      } else {
        setIsResumeGenerating(false);
        setNavigateToJobMatchesPending(false);
        alert('Could not find resume preview. Please try again.');
      }

    } catch (error) {
      console.error('View resume error:', error);
      setIsResumeGenerating(false);
      setNavigateToJobMatchesPending(false);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      if (!fetchInFlight) {
        setIsResumeGenerating(false);
        setNavigateToJobMatchesPending(false);
        const viewButton = document.querySelector('button[onClick]');
        if (viewButton) {
          viewButton.textContent = '📄 View Resume';
          viewButton.disabled = false;
        }
        if (styleOverride && styleOverride.parentNode) {
          styleOverride.parentNode.removeChild(styleOverride);
        }
      }
    }
  };

  // Handler for auth button
  const handleAuthButton = () => {
    if (user) {
      // Immediately clear everything and redirect to home
      localStorage.removeItem('resumeUser');
      logout();
      // Navigate to home page to avoid any modal issues
      window.location.href = '/';
    } else {
      setShowAuthModal(true);
    }
  };

  // Handler for job description updates from steps
  const handleJobDescriptionsChange = useCallback((next) => {
    setJobDescriptions((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      const ensured = ensureJobDescriptionList(resolved);
      return ensured.length > 0 ? ensured : ensureJobDescriptionList([]);
    });
  }, []);

  const fetchCurrentSubscriptionSafe = async () => {
    try {
      const token = localStorage.getItem('resumeToken');
      if (!token) return null;
      const resp = await fetch(`${getAPIBaseURL()}/api/subscription/current`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resp.ok) return null;
      const data = await resp.json();
      return data && data.subscription ? data.subscription : null;
    } catch (_) { return null; }
  };

  const checkSubscriptionLimit = async () => {
    try {
      const token = localStorage.getItem('resumeToken');
      if (!token) return true; // Allow non-authenticated users (server will handle limits)

      const response = await fetch(`${getAPIBaseURL()}/api/subscription/check-limit`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Legacy: some versions might use 429 to indicate limit reached
      if (response.status === 429) {
        const data = await response.json().catch(() => ({}));
        const sub = await fetchCurrentSubscriptionSafe();
        const planKey = (sub?.plan_name || 'free').toLowerCase();
        const mapped = {
          usage: {
            can_generate: false,
            remaining: 0,
            reset_date: data.reset_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            limitReached: true
          },
          subscription: sub || {
            plan_name: planKey,
            display_name: planKey.charAt(0).toUpperCase() + planKey.slice(1),
            resume_limit: planKey === 'premium' ? 30 : planKey === 'ultimate' ? 200 : 1,
            resume_period: planKey === 'free' ? 'week' : 'month'
          }
        };
        setSubscriptionData(mapped);
        setShowUpgradeModal(true);
        return false;
      }

      // New behavior: API returns 200 with can_generate flag
      if (response.ok) {
        const data = await response.json().catch(() => null);
        if (data && data.can_generate === false) {
          const sub = await fetchCurrentSubscriptionSafe();
          const planKey = (sub?.plan_name || 'free').toLowerCase();
          const mapped = {
            usage: {
              can_generate: false,
              remaining: data.remaining ?? 0,
              reset_date: data.reset_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              limitReached: true
            },
            subscription: sub || {
              plan_name: planKey,
              display_name: planKey.charAt(0).toUpperCase() + planKey.slice(1),
              resume_limit: planKey === 'premium' ? 30 : planKey === 'ultimate' ? 200 : 1,
              resume_period: planKey === 'free' ? 'week' : 'month'
            }
          };
          setSubscriptionData(mapped);
          setShowUpgradeModal(true);
          return false;
        }
        return true;
      }

      // On other non-OK statuses, allow and let server enforce at generation
      return true;
    } catch (error) {
      console.error('Error checking subscription limit:', error);
      return true; // Allow on error
    }
  };

  // Removed unused AI handler stubs that referenced undefined variables

  return (
    <>
      <Helmet>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
        <style>{`
          .preview { font-family: 'Segoe UI', 'Tahoma', sans-serif; }
          .preview * { font-family: 'Segoe UI', 'Tahoma', sans-serif; }
        `}</style>
      </Helmet>
      <SEO 
        title="Build Your Resume - HiHired AI Resume Builder"
        description="Build your professional resume step by step with our AI-powered resume builder. Create ATS-friendly resumes with personalized templates and expert guidance."
        keywords="build resume, create resume, resume builder, AI resume builder, professional resume, resume maker, write resume, resume template"
        canonical="https://hihired.org/builder"
      />
      <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
        {/* Left Side - Resume Builder */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: '#f8fafc',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div className="site-header" style={{ width: '100%', paddingTop: '2.5rem', paddingBottom: '1.5rem', textAlign: 'center', background: 'transparent', position: 'relative' }}>
            <div className="back-home-wrapper">
              <Link to="/" className="back-home-link">
                <span aria-hidden="true">←</span>
                <span>Back to Home</span>
              </Link>
            </div>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#3b82f6',
              margin: 0,
              letterSpacing: '-1px'
            }}>
              HiHired - AI Resume Builder
            </h1>
            {user && (
              <div style={{ position: 'absolute', right: '20px', top: '80px' }}>
                <SubscriptionStatus
                  minimal={true}
                  onLimitReached={(usage, subscription) => {
                    setSubscriptionData({ usage, subscription });
                    setShowUpgradeModal(true);
                  }}
                />
              </div>
            )}
          </div>

          
          {/* Stepper and Content */}
          <div className="builder-main-section">
            <div className="stepper-container">
              <Stepper steps={steps} currentStep={step} setStep={handleStepChange} />
            </div>
            <div className="builder-content">
            {step === STEP_IDS.IMPORT && (
              <StepImport onSkip={handleImportComplete} />
            )}
            {step === STEP_IDS.PERSONAL && <StepPersonal />}
            {step === STEP_IDS.JOB_DESCRIPTION && (
              <StepJobDescription
                jobDescriptions={jobDescriptions}
                onJobDescriptionsChange={handleJobDescriptionsChange}
              />
            )}
            {step === STEP_IDS.EXPERIENCE && <StepExperience />}
            {step === STEP_IDS.PROJECTS && <StepProjects />}
            {step === STEP_IDS.EDUCATION && <StepEducation />}
            {step === STEP_IDS.SKILLS && <StepSkills />}
            {step === STEP_IDS.FORMAT && <StepFormat />}
            {step === STEP_IDS.SUMMARY && <StepSummary />}
            {step === STEP_IDS.JOB_MATCHES && (
              <section className="job-matches-wrapper" aria-live="polite">
                <div className="job-matches-panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1d4ed8' }}>Matching Jobs</h3>
                      {jobMatchesHash && (
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Snapshot: {jobMatchesHash.slice(0, 8)}</span>
                      )}
                      {isUSPreferredLocation && user && (
                        <span style={{ fontSize: '0.75rem', color: '#0f172a' }}>
                          Showing US-based roles only
                          {filterSummaryText}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {jobMatchesLoading && <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Updating...</span>}
                      <button
                        type="button"
                        onClick={() => fetchJobMatches()}
                        disabled={jobMatchesLoading || !user}
                        style={{
                          padding: '0.4rem 0.9rem',
                          borderRadius: '999px',
                          border: '1px solid #bfdbfe',
                          background: jobMatchesLoading || !user ? '#e2e8f0' : '#eff6ff',
                          color: jobMatchesLoading || !user ? '#94a3b8' : '#1d4ed8',
                          fontWeight: 600,
                          cursor: jobMatchesLoading || !user ? 'not-allowed' : 'pointer',
                          fontSize: '0.85rem',
                        }}
                      >
                        {jobMatchesLoading ? 'Refreshing...' : !user ? 'Login required' : 'Refresh'}
                      </button>
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>Preferred location</label>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>

                      <input

                        type="text"

                        value={jobMatchesLocation}

                        onChange={(e) => handlePreferredLocationChange(e.target.value)}

                        onBlur={handlePreferredLocationBlur}

                        placeholder={autoLocation ? `e.g., ${autoLocation}` : 'City, State or Remote'}

                        list="job-location-suggestions"

                        autoComplete="off"

                        style={{

                          flex: '1 1 220px',

                          minWidth: '180px',

                          padding: '0.5rem 0.75rem',

                          borderRadius: '8px',

                          border: '1px solid #cbd5f5',

                          fontSize: '0.9rem',

                        }}

                      />

                      <button

                        type="button"

                        onClick={handleUseRemoteLocation}

                        style={{

                          padding: '0.45rem 0.9rem',

                          borderRadius: '999px',

                          border: '1px solid #14b8a6',

                          background: '#ecfeff',

                          color: '#0f766e',

                          fontWeight: 600,

                          cursor: 'pointer',

                          fontSize: '0.8rem',

                        }}

                      >

                        Remote OK

                      </button>

                      <button

                        type="button"

                        onClick={handleUseCurrentLocation}

                        disabled={isResolvingCurrentLocation}

                        style={{

                          padding: '0.45rem 0.9rem',

                          borderRadius: '999px',

                          border: '1px solid #60a5fa',

                          background: isResolvingCurrentLocation ? '#dbeafe' : '#eff6ff',

                          color: '#1d4ed8',

                          fontWeight: 600,

                          cursor: isResolvingCurrentLocation ? 'wait' : 'pointer',

                          fontSize: '0.8rem',

                        }}

                      >

                        {isResolvingCurrentLocation ? 'Locating…' : 'Use Current Location'}

                      </button>

                      <button

                        type="button"

                        onClick={handleClearPreferredLocation}

                        style={{

                          padding: '0.45rem 0.9rem',

                          borderRadius: '999px',

                          border: '1px solid #e2e8f0',

                          background: '#f8fafc',

                          color: '#475569',

                          fontWeight: 600,

                          cursor: 'pointer',

                          fontSize: '0.8rem',

                        }}

                      >

                        Clear

                      </button>

                    </div>

                    {isGeocodingLocation && (
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Searching cities…</span>
                    )}
                    {geocoderError && (
                      <span style={{ fontSize: '0.75rem', color: '#f97316' }}>{geocoderError}</span>
                    )}
                    {!isGeocodingLocation && !geocoderError && geocodedLocationHints.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }} aria-live="polite">
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Matching cities</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {geocodedLocationHints.map((hint) => (
                            <button
                              key={`geo-hint-${hint}`}
                              type="button"
                              onClick={() => handleSelectLocationSuggestion(hint)}
                              style={{
                                padding: '0.35rem 0.75rem',
                                borderRadius: '999px',
                                border: '1px solid #bfdbfe',
                                background: '#ffffff',
                                color: '#1d4ed8',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                fontWeight: 600,
                              }}
                            >
                              {hint}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {locationSuggestionOptions.length > 0 && (

                      <datalist id="job-location-suggestions">

                        {locationSuggestionOptions.map((option) => (

                          <option key={option} value={option} />

                        ))}

                      </datalist>

                    )}

                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>We prioritize roles near this location or remote roles.</span>

                    {user && effectiveLocation && (

                      <span style={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: 500 }}>

                        Prioritizing roles near <span style={{ color: '#1d4ed8' }}>{effectiveLocation}</span>

                      </span>

                    )}

                    {(resumeLocationSuggestions.length > 0 || POPULAR_LOCATION_GROUPS.length > 0) && (

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>

                        {resumeLocationSuggestions.length > 0 && (

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>

                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>From your resume</span>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>

                              {resumeLocationSuggestions.map((loc) => (

                                <button

                                  key={`resume-loc-${loc}`}

                                  type="button"

                                  onClick={() => handleSelectLocationSuggestion(loc)}

                                  style={{

                                    padding: '0.35rem 0.75rem',

                                    borderRadius: '999px',

                                    border: '1px solid #bfdbfe',

                                    background: '#f1f5f9',

                                    color: '#0f172a',

                                    fontSize: '0.75rem',

                                    cursor: 'pointer',

                                    fontWeight: 600,

                                  }}

                                >

                                  {loc}

                                </button>

                              ))}

                            </div>

                          </div>

                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>

                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Popular picks</span>

                          {POPULAR_LOCATION_GROUPS.map((group) => (

                            <div key={group.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>

                              <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{group.label}</span>

                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>

                                {group.options.map((option) => (

                                  <button

                                    key={`${group.label}-${option}`}

                                    type="button"

                                    onClick={() => handleSelectLocationSuggestion(option)}

                                    style={{

                                      padding: '0.35rem 0.75rem',

                                      borderRadius: '999px',

                                      border: '1px solid #bfdbfe',

                                      background: '#ffffff',

                                      color: '#1d4ed8',

                                      fontSize: '0.75rem',

                                      cursor: 'pointer',

                                      fontWeight: 600,

                                    }}

                                  >

                                    {option}

                                  </button>

                                ))}

                              </div>

                            </div>

                          ))}

                        </div>

                      </div>

                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.75rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                        "I don't want" filters
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={jobDislikeInput}
                          onChange={(e) => handleDislikeInputChange(e.target.value)}
                          placeholder="e.g., SRE; Seattle; night shift"
                          style={{
                            flex: '1 1 260px',
                            minWidth: '200px',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            border: '1px solid #fbbf24',
                            fontSize: '0.9rem',
                            background: '#fffbea',
                          }}
                        />
                        {!!jobDislikeInput.trim() && (
                          <button
                            type="button"
                            onClick={handleClearDislikeInput}
                            style={{
                              padding: '0.4rem 0.85rem',
                              borderRadius: '999px',
                              border: '1px solid #fed7aa',
                              background: '#fff7ed',
                              color: '#9a3412',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                            }}
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#92400e' }}>
                        Separate multiple keywords with commas or semicolons. We'll hide jobs mentioning any of them.
                      </span>
                      {jobDislikeLabels.length > 0 && (
                        <div
                          style={{
                            background: '#fef9c3',
                            border: '1px solid #fde047',
                            borderRadius: '10px',
                            padding: '0.55rem 0.75rem',
                            color: '#854d0e',
                            fontSize: '0.78rem',
                            lineHeight: 1.4,
                          }}
                        >
                          Filtering out {formatListForSentence(jobDislikeLabels)}.
                          {keywordFilteredCount > 0 && jobMatches.length > 0 && (
                            <span style={{ marginLeft: '0.25rem' }}>
                              Hidden {keywordFilteredCount} listing{keywordFilteredCount === 1 ? '' : 's'} so far.
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                  </div>

                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {!user && (
                      <p style={{ color: '#475569', fontSize: '0.9rem', margin: 0 }}>Sign in to generate personalized job matches.</p>
                    )}

                  {user && jobMatchesError && (
                    <div style={{ color: '#b91c1c', fontSize: '0.9rem' }}>{jobMatchesError}</div>
                  )}

                  {tailorError && (
                    <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '0.75rem' }}>
                      {tailorError}
                    </div>
                  )}

                  {tailorNotice && (
                    <div style={{ background: '#ecfdf5', border: '1px solid #34d399', color: '#065f46', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '0.75rem' }}>
                      {tailorNotice}
                    </div>
                  )}

                  {user && !jobMatchesError && !jobMatchesLoading && filteredJobMatches.length === 0 && (
                    <p style={{ color: '#475569', fontSize: '0.9rem', margin: 0 }}>
                        {jobMatches.length > 0
                          ? 'No US-based matches found yet. Adjust your location or refresh to explore more roles.'
                          : 'Complete your profile or add experience, then refresh to see curated openings.'}
                      </p>
                    )}
                  </div>

                  {user && topMatch && (
                    <div
                      style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        background: '#f0f9ff',
                        border: '1px solid #bae6fd',
                        boxShadow: '0 6px 12px rgba(148, 163, 184, 0.15)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        position: 'relative',
                      }}
                      onMouseEnter={() => setHoveredMatchKey(topMatchKey)}
                      onMouseLeave={() => setHoveredMatchKey(null)}
                    >
                      {hoveredMatchKey === topMatchKey && (
                        <MatchReasonPopover reasons={buildJobFitReasons(topMatch)} />
                      )}
                      <span style={{ fontSize: '0.75rem', color: '#0ea5e9', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Top match</span>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>{topMatch.job_title || 'Role'}</h4>
                      <div style={{ color: '#1e293b', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span>{topMatch.company_name || 'Hiring company'}</span>
                        <span>{[topMatch.job_location, topMatch.job_remote_type].filter(Boolean).join(' • ')}</span>
                        {typeof topMatch.match_score === 'number' && (
                          <span style={{ fontWeight: 600, color: '#0284c7' }}>Match score: {topMatch.match_score.toFixed(1)}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {topMatch.job_url && (
                          <a
                            href={topMatch.job_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              padding: '0.45rem 0.9rem',
                              borderRadius: '999px',
                              background: '#2563eb',
                              color: '#ffffff',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              textDecoration: 'none',
                              width: 'fit-content',
                            }}
                          >
                            View job
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleAutoTailorResume(topMatch)}
                          disabled={tailorActiveJobId === topMatchKey || !topMatchHasDescription}
                          style={{
                            padding: '0.45rem 0.9rem',
                            borderRadius: '999px',
                            border: '1px solid #0ea5e9',
                            background: tailorActiveJobId === topMatchKey ? '#bae6fd' : '#e0f2fe',
                            color: '#0369a1',
                            fontWeight: 600,
                            cursor: tailorActiveJobId === topMatchKey || !topMatchHasDescription ? 'not-allowed' : 'pointer',
                            fontSize: '0.85rem',
                          }}
                        >
                          {tailorActiveJobId === topMatchKey ? 'Generating…' : 'One-Click AI Resume'}
                        </button>
                      </div>
                      {!topMatchHasDescription && (
                        <span style={{ fontSize: '0.75rem', color: '#f97316' }}>
                          Add a job description to enable One-Click AI Resume.
                        </span>
                      )}
                    </div>
                  )}

                  {user && secondaryMatches.length > 0 && (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
                      {secondaryMatches.map((match, index) => {
                        const matchKey = getMatchKey(match) || `match-${index}`;
                        const canTailorMatch = Boolean(((match.job_description || '').trim()) || trimmedJobDescription);
                        return (
                          <li
                            key={`${match.id || match.job_posting_id || index}`}
                            style={{
                              padding: '0.85rem',
                              borderRadius: '10px',
                              border: '1px solid #dbeafe',
                              background: '#ffffff',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.4rem',
                              position: 'relative',
                            }}
                            onMouseEnter={() => setHoveredMatchKey(matchKey)}
                            onMouseLeave={() => setHoveredMatchKey(null)}
                          >
                            {hoveredMatchKey === matchKey && (
                              <MatchReasonPopover reasons={buildJobFitReasons(match)} />
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
                              <strong style={{ color: '#1e293b', fontSize: '0.95rem' }}>{match.job_title || 'Role'}</strong>
                              {typeof match.match_score === 'number' && (
                                <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>{match.match_score.toFixed(1)}</span>
                              )}
                            </div>
                            <span style={{ color: '#334155', fontSize: '0.85rem' }}>
                              {[match.company_name, match.job_location].filter(Boolean).join(' — ')}
                            </span>
                            {match.job_department && (
                              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{match.job_department}</span>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                              {match.job_url ? (
                                <a
                                  href={match.job_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: '#2563eb', fontWeight: 600, fontSize: '0.85rem' }}
                                >
                                  View listing
                                </a>
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Listing link unavailable</span>
                              )}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {match.job_remote_type && (
                                  <span style={{ color: '#0ea5e9', fontSize: '0.75rem', fontWeight: 600 }}>{match.job_remote_type}</span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleAutoTailorResume(match)}
                                  disabled={tailorActiveJobId === matchKey || !canTailorMatch}
                                  style={{
                                    padding: '0.35rem 0.8rem',
                                    borderRadius: '999px',
                                    border: '1px solid #0ea5e9',
                                    background: tailorActiveJobId === matchKey ? '#bae6fd' : '#e0f2fe',
                                    color: '#0369a1',
                                    fontWeight: 600,
                                    cursor: tailorActiveJobId === matchKey || !canTailorMatch ? 'not-allowed' : 'pointer',
                                    fontSize: '0.8rem',
                                  }}
                                >
                                  {tailorActiveJobId === matchKey ? 'Generating…' : 'One-Click AI Resume'}
                                </button>
                              </div>
                            </div>
                            {!canTailorMatch && (
                              <span style={{ color: '#f97316', fontSize: '0.75rem' }}>Add a job description to enable One-Click AI Resume.</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </section>
            )}
            {step === STEP_IDS.COVER_LETTER && (
              <StepCoverLetter
                onGeneratePremiumFeature={() => setShowUpgradeModal(true)}
              />
            )}

            {/* Navigation Buttons */}
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                marginTop: '2rem',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
              }}
            >
              {step > 1 && (
                <button
                  onClick={goToPreviousStep}
                  style={{
                    padding: '1rem 2.5rem',
                    border: '2px solid #d1d5db',
                    borderRadius: '8px',
                    background: 'white',
                    color: '#374151',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '1rem',
                    transition: 'all 0.2s ease',
                    minWidth: '200px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f3f4f6';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'white';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  ← Previous
                </button>
              )}
              {step < steps.length && (
                <button
                  onClick={goToNextStep}
                  style={{
                    padding: '1rem 2.5rem',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#3b82f6',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '1rem',
                    transition: 'all 0.2s ease',
                    minWidth: '200px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 6px rgba(59, 130, 246, 0.25)',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#2563eb';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 12px rgba(59, 130, 246, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#3b82f6';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 6px rgba(59, 130, 246, 0.25)';
                  }}
                >
                  Next →
                </button>
              )}
              {step === steps.length && (
                <button
                  onClick={handleViewResume}
                  style={{
                    padding: '1rem 2.5rem',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#10b981',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '1rem',
                    boxShadow: '0 4px 6px rgba(16, 185, 129, 0.25)',
                    transition: 'all 0.2s ease',
                    minWidth: '200px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#059669';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 12px rgba(16, 185, 129, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#10b981';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 6px rgba(16, 185, 129, 0.25)';
                  }}
                >
                  📄 View Resume
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Live Resume Preview */}
      <div
        style={{
          flex: 1,
          background: 'white',
          borderLeft: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          overflow: 'auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid #e5e7eb',
          background: '#f9fafb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#374151' }}>Live Resume Preview</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {user ? (
              <span style={{ color: '#3b82f6', fontWeight: 500, fontSize: '0.9rem' }}>{displayName}</span>
            ) : null}
            <button
              onClick={handleAuthButton}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                background: 'white',
                color: '#3b82f6',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            >
              {user ? 'Logout' : 'Login / Signup'}
            </button>
            <button
              onClick={toggleFullscreen}
              className="fullscreen-button"
              title={`${isFullscreen ? 'Exit' : 'Enter'} fullscreen mode (F11)`}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                background: 'white',
                color: '#374151',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              {isFullscreen ? 'Exit Full Screen' : 'Open Full Screen'}
            </button>
          </div>
        </div>
        <div 
          id="resume-preview-container"
          style={{ 
            flex: 1, 
            overflow: 'visible', 
            padding: '1rem',
            background: 'white',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {step !== STEP_IDS.COVER_LETTER && (
            <LivePreview onDownload={handleViewResume} downloadNotice={downloadNotice} />
          )}
          {step === STEP_IDS.COVER_LETTER && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#6b7280',
              fontSize: '1.1rem'
            }}>
              Resume preview not available for Cover Letter
            </div>
          )}
        </div>
      </div>
      </div>

      {isResumeGenerating && (
        <div
          aria-live="polite"
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            background: '#1d4ed8',
            color: '#fff',
            textAlign: 'center',
            padding: '0.9rem 1rem',
            fontWeight: 600,
            fontSize: '0.95rem',
            letterSpacing: '0.01em',
            boxShadow: '0 -4px 12px rgba(30, 64, 175, 0.35)',
            zIndex: 2000,
          }}
        >
          Resume is generating… preparing matching jobs for you.
        </div>
      )}

             {/* Modals */}
      {showAuthModal && (
        <AuthModal
          onClose={handleAuthModalClose}
          contextMessage="Sign in to build your resume."
        />
      )}
       {showImportModal && <ImportResumeModal onClose={() => setShowImportModal(false)} />}
       {showUpgradeModal && (() => {
         console.log('Rendering UpgradeModal, showUpgradeModal=', showUpgradeModal, 'data=', subscriptionData);
         return (
           <UpgradeModal
             isOpen={true}
             onClose={() => setShowUpgradeModal(false)}
             currentPlan={(subscriptionData?.subscription?.plan_name || 'free').toLowerCase()}
             usage={subscriptionData?.usage || {}}
           />
         );
       })()}
      </>
  );
}

export default BuilderPage;

