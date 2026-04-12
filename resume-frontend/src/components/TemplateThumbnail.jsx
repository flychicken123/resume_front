import React from 'react';
import { TEMPLATE_SLUGS, normalizeTemplateId } from '../constants/templates';
import StepPreview from './StepPreview';
import './TemplateThumbnail.css';

const DPI = 96;
const PAGE_WIDTH_PX = 8.5 * DPI;

const buildClassicData = () => ({
  name: 'Classic Template · Jordan Rivera',
  email: 'jordan.rivera@email.com',
  phone: '(415) 555-0198',
  summary: 'Classic Professional template sample — product leader partnering with engineering and design to ship impactful SaaS experiences. Known for storytelling backed by data, rapid experimentation, and leading teams through ambiguity.',
  selectedFormat: TEMPLATE_SLUGS.CLASSIC_PROFESSIONAL,
  selectedFontSize: 'medium',
  experiences: [
    {
      jobTitle: 'Director of Product',
      company: 'Nova Apps',
      city: 'San Francisco',
      state: 'CA',
      startDate: '2019-01-01',
      currentlyWorking: true,
      description: [
        'Scaled AI roadmap to 5M monthly active users across three product lines.',
        'Partnered with RevOps to launch pricing experiment that lifted ARR by 18%.',
        'Mentored PM team of 9 with focus on discovery rituals and execution health.',
      ].map((line) => `• ${line}`).join('\n'),
    },
    {
      jobTitle: 'Senior Product Manager',
      company: 'Skyline Analytics',
      city: 'Austin',
      state: 'TX',
      startDate: '2016-04-01',
      endDate: '2019-03-01',
      description: [
        'Delivered real-time insights platform adopted by 140+ enterprise accounts.',
        'Reduced onboarding time by 42% by piloting progressive activation flows.',
      ].map((line) => `• ${line}`).join('\n'),
    },
  ],
  projects: [
    {
      projectName: 'LaunchPad AI Suite',
      technologies: 'React • Node.js • GraphQL • AWS',
      description: [
        'Designed experimentation framework that powers 120+ weekly tests.',
        'Built workflow builder enabling customers to configure automation in minutes.',
      ].map((line) => `• ${line}`).join('\n'),
    },
  ],
  education: [
    {
      degree: 'B.S.',
      field: 'Computer Science',
      school: 'University of California, Los Angeles',
      city: 'Los Angeles',
      state: 'CA',
      graduationYear: '2016',
      honors: 'Dean’s List',
    },
  ],
  skills: 'Product Strategy, Roadmapping, Experimentation, Analytics, UX Research, Storytelling, Stakeholder Alignment',
});

const buildModernData = () => ({
  name: 'Modern Template · Taylor Morgan',
  email: 'taylor.morgan@designlab.io',
  phone: '(206) 555-0124',
  summary: 'Modern Clean template sample — design-led product manager crafting human-centered experiences. Blends qualitative insight with quantitative rigor to launch beloved products in creative and tech-first environments.',
  selectedFormat: TEMPLATE_SLUGS.MODERN_CLEAN,
  selectedFontSize: 'medium',
  experiences: [
    {
      jobTitle: 'Lead Product Manager',
      company: 'Canvas Labs',
      city: 'Seattle',
      state: 'WA',
      startDate: '2020-02-01',
      currentlyWorking: true,
      description: [
        'Launched collaborative whiteboard that increased active teams by 62%.',
        'Introduced quarterly opportunity mapping, aligning 7 squads to shared vision.',
        'Championed accessibility roadmap achieving WCAG AA certification.',
      ].map((line) => `• ${line}`).join('\n'),
    },
    {
      jobTitle: 'Product Manager',
      company: 'Pixelrise Studios',
      city: 'Portland',
      state: 'OR',
      startDate: '2017-01-01',
      endDate: '2020-01-01',
      description: [
        'Built cross-platform editor powering 1.3M monthly creative projects.',
        'Partnered with marketing to launch templates marketplace growing ARR 24%.',
      ].map((line) => `• ${line}`).join('\n'),
    },
  ],
  projects: [
    {
      projectName: 'Creator Insights Dashboard',
      technologies: 'Vue • TypeScript • Firebase',
      description: [
        'Surfaced actionable engagement trends for creators and agencies.',
        'Drove 30% increase in template reuse through personalized recommendations.',
      ].map((line) => `• ${line}`).join('\n'),
    },
  ],
  education: [
    {
      degree: 'M.S.',
      field: 'Human-Centered Design',
      school: 'University of Washington',
      city: 'Seattle',
      state: 'WA',
      graduationYear: '2017',
    },
    {
      degree: 'B.A.',
      field: 'Visual Communication',
      school: 'Rhode Island School of Design',
      city: 'Providence',
      state: 'RI',
      graduationYear: '2013',
    },
  ],
  skills: 'Design Systems, Journey Mapping, Experiment Design, Design Sprints, Data Storytelling, React, Figma, Collaboration',
});

const buildExecutiveData = () => ({
  name: 'Executive Template · Alexandra Brooks',
  email: 'abrooks@strategicleadership.com',
  phone: '(917) 555-0452',
  summary: 'Executive Serif template sample — enterprise operator with a decade of scaling revenue-positive programs across SaaS, FinTech, and manufacturing. Expert at orchestrating cross-border teams, optimizing operating rhythms, and guiding boards through transformation.',
  selectedFormat: TEMPLATE_SLUGS.EXECUTIVE_SERIF,
  selectedFontSize: 'medium',
  experiences: [
    {
      jobTitle: 'Chief Operations Officer',
      company: 'Horizon Labs',
      city: 'New York',
      state: 'NY',
      startDate: '2018-01-01',
      currentlyWorking: true,
      description: [
        'Scaled global P&L from $180M to $410M while improving EBITDA 9 points.',
        'Built resiliency playbook reducing supply volatility by 37% across regions.',
        'Championed DEI council growing director-level diversity to 48%.',
      ].map((line) => `• ${line}`).join('\n'),
    },
    {
      jobTitle: 'Vice President, Operations',
      company: 'Vector Global',
      city: 'Boston',
      state: 'MA',
      startDate: '2014-01-01',
      endDate: '2018-01-01',
      description: [
        'Modernized vendor strategy saving $18M annually across EMEA + APAC.',
        'Led 9 enterprise integrations with unified change management framework.',
      ].map((line) => `• ${line}`).join('\n'),
    },
  ],
  projects: [
    {
      projectName: 'Global Supply Chain Transformation',
      technologies: '',
      description: [
        'Delivered $65M cost avoidance and 12-point NPS lift in customer promise.',
      ].map((line) => `• ${line}`).join('\n'),
    },
    {
      projectName: 'Customer Experience Labs',
      technologies: '',
      description: [
        'Built innovation portfolio delivering 3× net-new revenue streams.',
      ].map((line) => `• ${line}`).join('\n'),
    },
  ],
  education: [
    {
      degree: 'MBA',
      field: 'Finance & Strategy',
      school: 'Harvard Business School',
      city: 'Boston',
      state: 'MA',
      graduationYear: '2014',
    },
    {
      degree: 'B.S.',
      field: 'Industrial Engineering',
      school: 'Purdue University',
      city: 'West Lafayette',
      state: 'IN',
      graduationYear: '2008',
      honors: 'Leadership & Operations Honors',
    },
  ],
  skills: 'Strategic Planning, Global Operations, P&L Ownership, Risk Governance, Stakeholder Alignment, Leadership Development, Board Reporting',
  boardHighlights: [
    {
      name: 'Board Director · Atlas Robotics',
      details: 'Audit Committee Chair · 2021 – Present',
    },
    {
      name: 'Advisory Council · BlueRiver Capital',
      details: 'Operational Due Diligence · 2018 – Present',
    },
  ],
});

const buildAttorneyData = () => ({
  name: 'Attorney Template · Morgan Blake, Esq.',
  email: 'm.blake@blakeandrosslaw.com',
  phone: '(312) 555-0142',
  summary:
    'Trial-tested litigator with 12+ years of experience navigating complex commercial disputes, regulatory inquiries, and high-stakes negotiations. Trusted by general counsel to assess risk, craft winning case strategies, and deliver pragmatic business outcomes.',
  selectedFormat: TEMPLATE_SLUGS.ATTORNEY_TEMPLATE,
  selectedFontSize: 'medium',
  experiences: [
    {
      jobTitle: 'Senior Litigation Associate',
      company: 'Blake & Ross LLP',
      city: 'Chicago',
      state: 'IL',
      startDate: '2018-03-01',
      currentlyWorking: true,
      description: [
        'First-chaired 7 bench trials and second-chaired 3 federal jury trials with favorable verdicts exceeding $45M.',
        'Led multi-district litigation strategy that reduced class exposure by 62% while preserving supplier relationships.',
        'Built eDiscovery playbook that cut external vendor costs by 28% and accelerated production timelines.',
      ].map((line) => `• ${line}`).join('\n'),
    },
    {
      jobTitle: 'Litigation Associate',
      company: 'Northbridge Law Group',
      city: 'New York',
      state: 'NY',
      startDate: '2013-09-01',
      endDate: '2018-02-01',
      description: [
        'Managed class-action defense docket spanning securities, privacy, and consumer protection matters.',
        'Drafted dispositive motions and appellate briefs yielding five precedent-setting rulings for Fortune 500 clients.',
      ].map((line) => `• ${line}`).join('\n'),
    },
  ],
  education: [
    {
      degree: 'J.D.',
      field: 'Law',
      school: 'Northwestern Pritzker School of Law',
      city: 'Chicago',
      state: 'IL',
      graduationYear: '2013',
      honors: 'Cum Laude · Managing Editor, Law & Policy Journal',
    },
    {
      degree: 'B.A.',
      field: 'Political Science',
      school: 'Emory University',
      city: 'Atlanta',
      state: 'GA',
      graduationYear: '2009',
      honors: 'Phi Beta Kappa',
    },
  ],
  skills:
    'Litigation Strategy, Trial Advocacy, Regulatory Investigations, Appellate Briefing, Client Counseling, Legal Research & Writing',
});

const SAMPLE_DATA_FACTORIES = {
  [TEMPLATE_SLUGS.CLASSIC_PROFESSIONAL]: buildClassicData,
  [TEMPLATE_SLUGS.MODERN_CLEAN]: buildModernData,
  [TEMPLATE_SLUGS.EXECUTIVE_SERIF]: buildExecutiveData,
  [TEMPLATE_SLUGS.ATTORNEY_TEMPLATE]: buildAttorneyData,
};

const TemplateThumbnail = ({ templateId, width = 220 }) => {
  const normalizedTemplateId = normalizeTemplateId(templateId);

  const scale = width / PAGE_WIDTH_PX;

  // Use live preview for all templates (removed static images)
  const factory =
    SAMPLE_DATA_FACTORIES[normalizedTemplateId]
    || SAMPLE_DATA_FACTORIES[TEMPLATE_SLUGS.CLASSIC_PROFESSIONAL];
  const resumeData = factory();

  return (
    <div className="template-thumbnail-wrapper" style={{ width }}>
      <div
        className="template-thumbnail-inner"
        style={{ transform: `scale(${scale})` }}
      >
        <div className="template-thumbnail-canvas">
          <StepPreview
            key={normalizedTemplateId}
            hideActions
            dataOverride={resumeData}
          />
        </div>
      </div>
    </div>
  );
};

export default TemplateThumbnail;
