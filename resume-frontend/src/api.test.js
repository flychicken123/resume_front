import { 
  generateResume, 
  generateExperienceAI, 
  generateEducationAI, 
  generateSummaryAI, 
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
});
