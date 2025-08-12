import { 
  generateResume, 
  generateExperienceAI, 
  generateEducationAI, 
  generateSummaryAI, 
  parseResumeFile 
} from './api';

describe('API Functions', () => {
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
});
