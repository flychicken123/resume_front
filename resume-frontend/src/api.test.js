import {
  generateResume,
  generateExperienceAI,
  generateEducationAI,
  generateSummaryAI,
  parseResumeFile
} from './api';

// Mock fetch before each test
beforeEach(() => {
  fetch.mockClear();
});

describe('API Functions', () => {
  describe('generateResume', () => {
    it('should make a POST request to /api/resume/generate', async () => {
      const mockData = { name: 'Test User', email: 'test@example.com' };
      const mockResponse = { success: true, filePath: '/static/resume.pdf' };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateResume(mockData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/resume/generate',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(mockData),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when response is not ok', async () => {
      const mockData = { name: 'Test User' };
      
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Generation failed' }),
      });

      await expect(generateResume(mockData)).rejects.toThrow('Generation failed');
    });
  });

  describe('generateExperienceAI', () => {
    it('should make a POST request to /api/experience/optimize', async () => {
      const experience = 'Software Engineer at Google';
      const jobDescription = 'Looking for a senior developer';
      const mockResponse = { optimizedExperience: 'Enhanced experience description' };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateExperienceAI(experience, jobDescription);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/experience/optimize',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            userExperience: experience,
            jobDescription: jobDescription,
          }),
        })
      );
      expect(result).toBe('Enhanced experience description');
    });
  });

  describe('generateEducationAI', () => {
    it('should make a POST request to /api/ai/education with auth header', async () => {
      const education = 'Bachelor of Science';
      const mockResponse = { education: 'Enhanced education description' };
      
      // Mock localStorage
      localStorage.getItem.mockReturnValue('mock-token');
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateEducationAI(education);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/ai/education',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          }),
          body: JSON.stringify({ education }),
        })
      );
      expect(result).toBe('Enhanced education description');
    });
  });

  describe('generateSummaryAI', () => {
    it('should make a POST request to /api/ai/summary', async () => {
      const data = {
        experience: 'Software Engineer',
        education: 'Bachelor Degree',
        skills: 'JavaScript, React'
      };
      const mockResponse = { summary: 'Professional summary' };
      
      localStorage.getItem.mockReturnValue('mock-token');
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateSummaryAI(data);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/ai/summary',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          }),
          body: JSON.stringify(data),
        })
      );
      expect(result).toBe('Professional summary');
    });
  });

  describe('parseResumeFile', () => {
    it('should make a POST request to /api/resume/parse with FormData', async () => {
      const mockFile = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' });
      const mockResponse = { parsed: true, data: {} };
      
      localStorage.getItem.mockReturnValue('mock-token');
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await parseResumeFile(mockFile);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/resume/parse',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should not include Authorization header when no token', async () => {
      const mockFile = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' });
      const mockResponse = { parsed: true, data: {} };
      
      localStorage.getItem.mockReturnValue(null);
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await parseResumeFile(mockFile);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/resume/parse',
        expect.objectContaining({
          method: 'POST',
          headers: {},
        })
      );
    });
  });
});
