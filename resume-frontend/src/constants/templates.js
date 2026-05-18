export const TEMPLATE_SLUGS = {
  CLASSIC_PROFESSIONAL: 'classic-professional',
  MODERN_CLEAN: 'modern-clean',
  EXECUTIVE_SERIF: 'executive-serif',
  ATTORNEY_TEMPLATE: 'attorney-template',
  HARVARD_ATS: 'harvard-ats',
  TECH_MINIMAL: 'tech-minimal',
  CREATIVE_PORTFOLIO: 'creative-portfolio',
  ACADEMIC_CV: 'academic-cv',
};

export const DEFAULT_TEMPLATE_ID = TEMPLATE_SLUGS.CLASSIC_PROFESSIONAL;

export const LEGACY_TEMPLATE_ALIASES = {
  temp1: TEMPLATE_SLUGS.CLASSIC_PROFESSIONAL,
  modern: TEMPLATE_SLUGS.MODERN_CLEAN,
  'industry-manager': TEMPLATE_SLUGS.EXECUTIVE_SERIF,
};

export const normalizeTemplateId = (value) => {
  if (!value) {
    return DEFAULT_TEMPLATE_ID;
  }
  return LEGACY_TEMPLATE_ALIASES[value] || value;
};

export const TEMPLATE_OPTIONS = [
  {
    id: TEMPLATE_SLUGS.CLASSIC_PROFESSIONAL,
    name: 'Classic Professional',
    description: 'Traditional layout with clean typography, perfect for corporate environments',
    image: '/templates/classic.svg',
  },
  {
    id: TEMPLATE_SLUGS.MODERN_CLEAN,
    name: 'Modern Clean',
    description: 'Contemporary design with blue accents, ideal for tech and creative industries',
    image: '/templates/modern.svg',
  },
  {
    id: TEMPLATE_SLUGS.EXECUTIVE_SERIF,
    name: 'Executive Serif',
    description: 'Executive style with refined serif typography, great for leadership roles',
    image: '/templates/executive.svg',
  },
  {
    id: TEMPLATE_SLUGS.ATTORNEY_TEMPLATE,
    name: 'Attorney Professional',
    description: 'Polished legal layout showcasing case results, bar admissions, and courtroom expertise',
    image: '/templates/executive.png',
  },
  {
    id: TEMPLATE_SLUGS.HARVARD_ATS,
    name: 'Harvard ATS',
    description: 'Dense single-column format for finance, consulting, law, and early-career roles',
    image: '/templates/classic.png',
  },
  {
    id: TEMPLATE_SLUGS.TECH_MINIMAL,
    name: 'Tech Minimal',
    description: 'Clean engineering layout that emphasizes technical skills, projects, and measurable impact',
    image: '/templates/modern.png',
  },
  {
    id: TEMPLATE_SLUGS.CREATIVE_PORTFOLIO,
    name: 'Creative Portfolio',
    description: 'Subtle portfolio-style design for marketing, design, product, and content roles',
    image: '/templates/modern.png',
  },
  {
    id: TEMPLATE_SLUGS.ACADEMIC_CV,
    name: 'Academic CV',
    description: 'Serif research-focused layout for education, research, grants, and academic applications',
    image: '/templates/executive.png',
  },
];

export const getTemplateMetaById = (templateId) => {
  const normalized = normalizeTemplateId(templateId);
  return TEMPLATE_OPTIONS.find((template) => template.id === normalized)
    || TEMPLATE_OPTIONS[0];
};
