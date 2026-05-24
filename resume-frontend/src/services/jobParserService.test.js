import { jobParserService } from './jobParserService';

describe('jobParserService', () => {
  it('detects supported platforms on nested subdomains', () => {
    expect(
      jobParserService.detectPlatform('https://www.linkedin.com/jobs/view/123')
    ).toMatchObject({ name: 'LinkedIn' });
    expect(
      jobParserService.detectPlatform('https://acme.boards.greenhouse.io/jobs/123')
    ).toMatchObject({ name: 'Greenhouse' });
  });

  it('does not match unsupported lookalike domains', () => {
    expect(
      jobParserService.detectPlatform('https://linkedin.com.example.com/jobs/123')
    ).toBeNull();
  });
});
