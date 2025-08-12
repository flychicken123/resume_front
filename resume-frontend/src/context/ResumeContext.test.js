import { ResumeProvider, useResume } from './ResumeContext';

describe('ResumeContext', () => {
  it('should export ResumeProvider', () => {
    expect(ResumeProvider).toBeDefined();
    expect(typeof ResumeProvider).toBe('function');
  });

  it('should export useResume hook', () => {
    expect(useResume).toBeDefined();
    expect(typeof useResume).toBe('function');
  });

  it('should have ResumeProvider as a React component', () => {
    expect(ResumeProvider).toBeDefined();
  });

  it('should have useResume as a function', () => {
    expect(useResume).toBeDefined();
  });
});
