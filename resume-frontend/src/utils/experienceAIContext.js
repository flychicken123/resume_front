export const normalizeSkillsForAIContext = (skills) => {
  if (Array.isArray(skills)) {
    return skills.map((skill) => String(skill || '').trim()).filter(Boolean);
  }

  if (typeof skills === 'string') {
    return skills
      .split(/[,\n;|]/)
      .map((skill) => skill.trim())
      .filter(Boolean);
  }

  return [];
};

const firstText = (...values) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
};

const compactContext = (context) => Object.fromEntries(
  Object.entries(context).filter(([, value]) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    return value !== null && value !== undefined && String(value).trim() !== '';
  })
);

export const buildExperienceAIContext = (experience = {}, resumeData = {}, overrides = {}) => {
  const city = firstText(experience.city);
  const state = firstText(experience.state);
  const location = firstText(experience.location, [city, state].filter(Boolean).join(', '));
  const resumeSkills = Array.isArray(overrides.resumeSkills)
    ? normalizeSkillsForAIContext(overrides.resumeSkills)
    : normalizeSkillsForAIContext(firstText(resumeData.skillsCategorized, resumeData.skills));

  return compactContext({
    jobTitle: firstText(experience.jobTitle, experience.job_title, experience.role, experience.title),
    company: firstText(experience.company, experience.employer),
    city,
    state,
    location,
    remote: Boolean(experience.remote),
    startDate: firstText(experience.startDate, experience.start_date),
    endDate: firstText(experience.endDate, experience.end_date),
    currentlyWorking: Boolean(experience.currentlyWorking),
    seniority: firstText(experience.seniority, experience.level, experience.roleLevel),
    resumeSkills,
    targetRole: firstText(
      overrides.targetRole,
      resumeData.position,
      resumeData.desiredRole,
      resumeData.role,
      resumeData.headline,
      resumeData.title
    ),
    targetCompany: firstText(overrides.targetCompany),
  });
};
