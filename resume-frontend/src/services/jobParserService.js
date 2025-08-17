// Job Parser Service - Mock implementation for development
// In production, this would connect to a backend service that uses web scraping or APIs

const getAPIBaseURL = () => {
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'www.hihired.org' 
      ? 'https://hihired.org' 
      : window.location.origin;
  }
  return process.env.REACT_APP_API_URL || 'http://localhost:8081';
};

class JobParserService {
  constructor() {
    this.apiBaseUrl = getAPIBaseURL();
  }

  // Extract domain from URL
  extractDomain(url) {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain;
    } catch (error) {
      return null;
    }
  }

  // Detect job platform
  detectPlatform(url) {
    const domain = this.extractDomain(url);
    if (!domain) return null;

    const platforms = {
      'linkedin.com': { name: 'LinkedIn', type: 'social', icon: '💼' },
      'indeed.com': { name: 'Indeed', type: 'job_board', icon: '🔍' },
      'glassdoor.com': { name: 'Glassdoor', type: 'review_site', icon: '🏢' },
      'angel.co': { name: 'AngelList', type: 'startup', icon: '🚀' },
      'wellfound.com': { name: 'Wellfound', type: 'startup', icon: '🚀' },
      'workday.com': { name: 'Workday', type: 'ats', icon: '📊' },
      'greenhouse.io': { name: 'Greenhouse', type: 'ats', icon: '🌱' },
      'lever.co': { name: 'Lever', type: 'ats', icon: '⚡' },
      'jobs.lever.co': { name: 'Lever', type: 'ats', icon: '⚡' },
      'boards.greenhouse.io': { name: 'Greenhouse', type: 'ats', icon: '🌱' },
      'careers.google.com': { name: 'Google Careers', type: 'company', icon: '🔍' },
      'jobs.apple.com': { name: 'Apple Jobs', type: 'company', icon: '🍎' },
      'amazon.jobs': { name: 'Amazon Jobs', type: 'company', icon: '📦' },
      'careers.microsoft.com': { name: 'Microsoft Careers', type: 'company', icon: '🏢' }
    };

    return platforms[domain] || null;
  }

  // Mock job parser - in production this would use web scraping or APIs
  async parseJobFromURL(url, platform) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock job data based on platform
    const mockJobs = {
      'LinkedIn': {
        title: 'Senior Software Engineer',
        company: 'Tech Innovations Inc.',
        location: 'San Francisco, CA',
        type: 'Full-time',
        remote: true,
        salary: '$120,000 - $160,000',
        description: 'We are looking for a Senior Software Engineer to join our growing team...',
        requirements: [
          '5+ years of software development experience',
          'Proficiency in JavaScript, React, Node.js',
          'Experience with cloud platforms (AWS, Azure)',
          'Strong problem-solving skills',
          'Excellent communication skills'
        ],
        requiredSkills: ['JavaScript', 'React', 'Node.js', 'AWS', 'Python', 'SQL'],
        benefits: ['Health insurance', 'Remote work', '401k matching', 'Flexible PTO'],
        postedDate: new Date().toISOString(),
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      'Indeed': {
        title: 'Frontend Developer',
        company: 'StartupXYZ',
        location: 'New York, NY',
        type: 'Full-time',
        remote: false,
        salary: '$80,000 - $110,000',
        description: 'Join our dynamic team as a Frontend Developer...',
        requirements: [
          '3+ years of frontend development experience',
          'Expert knowledge of React and TypeScript',
          'Experience with modern CSS frameworks',
          'Understanding of responsive design principles'
        ],
        requiredSkills: ['React', 'TypeScript', 'CSS', 'HTML', 'JavaScript', 'Git'],
        benefits: ['Health insurance', 'Dental coverage', 'Stock options'],
        postedDate: new Date().toISOString(),
        applicationDeadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString()
      },
      'Glassdoor': {
        title: 'Full Stack Developer',
        company: 'Digital Solutions Corp',
        location: 'Austin, TX',
        type: 'Contract',
        remote: true,
        salary: '$95,000 - $125,000',
        description: 'We need a talented Full Stack Developer for our next project...',
        requirements: [
          '4+ years of full stack development experience',
          'Proficiency in both frontend and backend technologies',
          'Experience with databases and API development',
          'Knowledge of DevOps practices'
        ],
        requiredSkills: ['JavaScript', 'Python', 'React', 'Django', 'PostgreSQL', 'Docker'],
        benefits: ['Flexible hours', 'Remote work', 'Professional development budget'],
        postedDate: new Date().toISOString(),
        applicationDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      }
    };

    // Return mock data or generate based on URL
    const jobData = mockJobs[platform.name] || {
      title: 'Software Engineer',
      company: 'Technology Company',
      location: 'Remote',
      type: 'Full-time',
      remote: true,
      salary: 'Competitive',
      description: 'Exciting opportunity to work with cutting-edge technology...',
      requirements: [
        'Bachelor\'s degree in Computer Science or related field',
        'Strong programming skills',
        'Problem-solving abilities',
        'Team collaboration experience'
      ],
      requiredSkills: ['JavaScript', 'Python', 'React', 'SQL'],
      benefits: ['Health insurance', 'Retirement plan', 'Paid time off'],
      postedDate: new Date().toISOString(),
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    return {
      id: `job_${Date.now()}`,
      url: url,
      platform: platform.name,
      ...jobData,
      extractedAt: new Date().toISOString()
    };
  }

  // Main method to parse job from URL
  async parseJob(url) {
    try {
      // Validate URL
      new URL(url);
      
      // Detect platform
      const platform = this.detectPlatform(url);
      if (!platform) {
        throw new Error('Unsupported platform. We currently support LinkedIn, Indeed, Glassdoor, and other major job boards.');
      }

      // Parse job details
      const jobDetails = await this.parseJobFromURL(url, platform);
      
      return {
        success: true,
        jobDetails,
        platform
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        platform: this.detectPlatform(url)
      };
    }
  }

  // Method to submit job application (mock)
  async submitApplication(applicationData) {
    // Simulate submission delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Mock submission logic
    const success = Math.random() > 0.2; // 80% success rate for demo

    if (success) {
      return {
        success: true,
        applicationId: `app_${Date.now()}`,
        message: 'Application submitted successfully!',
        submittedAt: new Date().toISOString(),
        status: 'submitted',
        trackingUrl: `${applicationData.jobUrl}#application-${Date.now()}`
      };
    } else {
      return {
        success: false,
        error: 'Application submission failed. This may require manual submission.',
        reason: 'platform_restriction',
        fallbackAction: 'manual_application'
      };
    }
  }

  // Get supported platforms
  getSupportedPlatforms() {
    return [
      { name: 'LinkedIn', domain: 'linkedin.com', icon: '💼', automationLevel: 'partial' },
      { name: 'Indeed', domain: 'indeed.com', icon: '🔍', automationLevel: 'full' },
      { name: 'Glassdoor', domain: 'glassdoor.com', icon: '🏢', automationLevel: 'partial' },
      { name: 'AngelList', domain: 'angel.co', icon: '🚀', automationLevel: 'partial' },
      { name: 'Workday', domain: 'workday.com', icon: '📊', automationLevel: 'limited' },
      { name: 'Greenhouse', domain: 'greenhouse.io', icon: '🌱', automationLevel: 'limited' },
      { name: 'Lever', domain: 'lever.co', icon: '⚡', automationLevel: 'limited' }
    ];
  }
}

// Export singleton instance
export const jobParserService = new JobParserService();
export default jobParserService;