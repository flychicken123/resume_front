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

    it('should handle network errors', async () => {
      const mockData = { name: 'Test User' };
      
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(generateResume(mockData)).rejects.toThrow('Network error');
    });

    it('should handle JSON parsing errors', async () => {
      const mockData = { name: 'Test User' };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); },
      });

      await expect(generateResume(mockData)).rejects.toThrow('Invalid JSON');
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

    it('should handle empty experience and job description', async () => {
      const mockResponse = { optimizedExperience: '' };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateExperienceAI('', '');

      expect(result).toBe('');
    });

    it('should handle API errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'API Error' }),
      });

      await expect(generateExperienceAI('test', 'test')).rejects.toThrow('API Error');
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

    it('should handle missing auth token', async () => {
      localStorage.getItem.mockReturnValue(null);
      
      const mockResponse = { education: 'Enhanced education description' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateEducationAI('test education');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/ai/education',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toBe('Enhanced education description');
    });

    it('should handle API errors', async () => {
      localStorage.getItem.mockReturnValue('mock-token');
      
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Education API Error' }),
      });

      await expect(generateEducationAI('test')).rejects.toThrow('Education API Error');
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

    it('should handle empty data', async () => {
      const data = { experience: '', education: '', skills: '' };
      const mockResponse = { summary: '' };
      
      localStorage.getItem.mockReturnValue('mock-token');
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await generateSummaryAI(data);

      expect(result).toBe('');
    });

    it('should handle API errors', async () => {
      localStorage.getItem.mockReturnValue('mock-token');
      
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Summary API Error' }),
      });

      await expect(generateSummaryAI({})).rejects.toThrow('Summary API Error');
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

    it('should handle different file types', async () => {
      const mockFile = new File(['resume content'], 'resume.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const mockResponse = { parsed: true, data: {} };
      
      localStorage.getItem.mockReturnValue('mock-token');
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await parseResumeFile(mockFile);

      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const mockFile = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' });
      
      localStorage.getItem.mockReturnValue('mock-token');
      
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Parse API Error' }),
      });

      await expect(parseResumeFile(mockFile)).rejects.toThrow('Parse API Error');
    });

    it('should handle network errors', async () => {
      const mockFile = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' });
      
      localStorage.getItem.mockReturnValue('mock-token');
      
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(parseResumeFile(mockFile)).rejects.toThrow('Network error');
    });
  });
});
