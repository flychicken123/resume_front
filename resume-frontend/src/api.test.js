import {
  generateResume,
  generateExperienceAI,
  generateEducationAI,
  generateSummaryAI,
  optimizeProjectAI,
  improveProjectGrammarAI,
  parseResumeFile
} from './api';

describe('API Functions', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should export all required functions', () => {
    expect(typeof generateResume).toBe('function');
    expect(typeof generateExperienceAI).toBe('function');
    expect(typeof generateEducationAI).toBe('function');
    expect(typeof generateSummaryAI).toBe('function');
    expect(typeof optimizeProjectAI).toBe('function');
    expect(typeof improveProjectGrammarAI).toBe('function');
    expect(typeof parseResumeFile).toBe('function');
  });

  it('should have generateResume function', () => {
    expect(generateResume).toBeDefined();
  });

  it('should have generateExperienceAI function', () => {
    expect(generateExperienceAI).toBeDefined();
  });

  it('should have generateEducationAI function', () => {
    expect(generateEducationAI).toBeDefined();
  });

  it('should have generateSummaryAI function', () => {
    expect(generateSummaryAI).toBeDefined();
  });

  it('should have parseResumeFile function', () => {
    expect(parseResumeFile).toBeDefined();
  });

  it('normalizes JSON array text from experience optimization', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          optimizedExperience: JSON.stringify([
            'Architected and launched an AI resume platform',
            'Developed evaluation workflows for recommendations',
          ]),
        },
      }),
    });

    const result = await generateExperienceAI('built resume app', 'backend job');

    expect(result).toBe(
      'Architected and launched an AI resume platform\n\nDeveloped evaluation workflows for recommendations'
    );
    expect(result).not.toContain('[');
    expect(result).not.toContain('"');
  });

  it('normalizes quoted JSON string text from experience optimization', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          optimizedExperience: JSON.stringify(
            'Architected and launched an AI resume platform.\nDeveloped evaluation workflows.'
          ),
        },
      }),
    });

    const result = await generateExperienceAI('built resume app', 'backend job');

    expect(result).toBe(
      'Architected and launched an AI resume platform.\nDeveloped evaluation workflows.'
    );
    expect(result).not.toContain('\\n');
    expect(result).not.toContain('"');
  });

  it('normalizes loose quoted multiline text from experience optimization', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          optimizedExperience:
            '"Architected and launched an AI resume platform.\nDeveloped evaluation workflows."',
        },
      }),
    });

    const result = await generateExperienceAI('built resume app', 'backend job');

    expect(result).toBe(
      'Architected and launched an AI resume platform.\nDeveloped evaluation workflows.'
    );
    expect(result).not.toContain('"');
  });

  it('normalizes JSON array text from project optimization', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          optimizedProject: JSON.stringify([
            'Built a React and Go job tracking dashboard',
            'Implemented PostgreSQL search and filtering',
          ]),
        },
      }),
    });

    const result = await optimizeProjectAI('built job tracker', 'backend job');

    expect(result).toBe(
      'Built a React and Go job tracking dashboard\n\nImplemented PostgreSQL search and filtering'
    );
    expect(result).not.toContain('[');
    expect(result).not.toContain('"');
  });

  it('normalizes loose quoted multiline text from project optimization', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          optimizedProject:
            '"Built a React and Go job tracking dashboard.\nImplemented PostgreSQL search and filtering."',
        },
      }),
    });

    const result = await optimizeProjectAI('built job tracker', 'backend job');

    expect(result).toBe(
      'Built a React and Go job tracking dashboard.\nImplemented PostgreSQL search and filtering.'
    );
    expect(result).not.toContain('"');
  });

  it('normalizes quoted JSON string text from project grammar improvement', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          improvedProject: JSON.stringify(
            'Built a React and Go job tracking dashboard.\nImproved deployment reliability.'
          ),
        },
      }),
    });

    const result = await improveProjectGrammarAI('built job tracker');

    expect(result).toBe(
      'Built a React and Go job tracking dashboard.\nImproved deployment reliability.'
    );
    expect(result).not.toContain('\\n');
    expect(result).not.toContain('"');
  });

  it('normalizes root-level project optimization responses', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        optimizedProject: JSON.stringify([
          'Built project APIs',
          'Improved search quality',
        ]),
      }),
    });

    const result = await optimizeProjectAI('built job tracker', 'backend job');

    expect(result).toBe('Built project APIs\n\nImproved search quality');
  });

  it('normalizes direct array values from project grammar improvement', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          improvedProject: [
            'Built project APIs',
            '',
            'Improved search quality',
          ],
        },
      }),
    });

    const result = await improveProjectGrammarAI('built job tracker');

    expect(result).toBe('Built project APIs\n\nImproved search quality');
  });

  it('normalizes fenced JSON array text from project optimization', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          optimizedProject: '```json\n["Built project APIs", "Improved search quality"]\n```',
        },
      }),
    });

    const result = await optimizeProjectAI('built job tracker', 'backend job');

    expect(result).toBe('Built project APIs\n\nImproved search quality');
    expect(result).not.toContain('```');
  });

  it('falls back to original project text when optimization result is missing', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: {},
      }),
    });

    const result = await optimizeProjectAI('original project text', 'backend job');

    expect(result).toBe('original project text');
  });

  it('falls back to original project text when grammar result is blank', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          improvedProject: '   ',
        },
      }),
    });

    const result = await improveProjectGrammarAI('original project text');

    expect(result).toBe('original project text');
  });

  it('sends existing project and skill context for project optimization', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          optimizedProject: 'Improved project text',
        },
      }),
    });

    await optimizeProjectAI(
      'project text',
      'job description',
      'existing project text',
      ['Go', 'React'],
      ['Kubernetes']
    );

    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);

    expect(body).toEqual({
      projectData: 'project text',
      jobDescription: 'job description',
      existingProject: 'existing project text',
      matchedSkills: ['Go', 'React'],
      missingSkills: ['Kubernetes'],
    });
  });

  it('omits blank existing project and empty skill context from project optimization request', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          optimizedProject: 'Improved project text',
        },
      }),
    });

    await optimizeProjectAI('project text', 'job description', '   ', [], []);

    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);

    expect(body).toEqual({
      projectData: 'project text',
      jobDescription: 'job description',
    });
  });

  it('throws project optimization error message from backend', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'Project AI unavailable',
      }),
    });

    await expect(optimizeProjectAI('project text', 'job description')).rejects.toThrow(
      'Project AI unavailable'
    );
  });

  it('throws project grammar error message from backend', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'Project grammar unavailable',
      }),
    });

    await expect(improveProjectGrammarAI('project text')).rejects.toThrow(
      'Project grammar unavailable'
    );
  });
});
