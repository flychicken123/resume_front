export const TEMPLATE_SLUGS = {
  CLASSIC_PROFESSIONAL: 'classic-professional',
  MODERN_CLEAN: 'modern-clean',
  EXECUTIVE_SERIF: 'executive-serif',
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
];

export const getTemplateMetaById = (templateId) => {
  const normalized = normalizeTemplateId(templateId);
  return TEMPLATE_OPTIONS.find((template) => template.id === normalized)
    || TEMPLATE_OPTIONS[0];
};
