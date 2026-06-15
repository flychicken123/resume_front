import {
  formatMonthYear,
  normalizeDateValue,
  normalizeExperienceDates,
  parseDateRange,
} from './resumeDateUtils';

describe('resumeDateUtils', () => {
  it('normalizes common month-year values for month inputs', () => {
    expect(normalizeDateValue('Aug 2013')).toBe('2013-08');
    expect(normalizeDateValue('June 2015')).toBe('2015-06');
    expect(normalizeDateValue('08/2013')).toBe('2013-08');
    expect(normalizeDateValue('2018-07-01')).toBe('2018-07');
  });

  it('splits assistant date ranges into start and end dates', () => {
    expect(parseDateRange('Aug 2013 - June 2015')).toEqual({
      start: 'Aug 2013',
      end: 'June 2015',
    });
    expect(normalizeExperienceDates({
      startDate: 'Aug 2013 - June 2015',
      endDate: '',
      currentlyWorking: false,
    })).toMatchObject({
      startDate: '2013-08',
      endDate: '2015-06',
      currentlyWorking: false,
    });
  });

  it('treats now and present as currently working', () => {
    expect(normalizeExperienceDates({
      startDate: 'Aug 2025',
      endDate: 'now',
    })).toMatchObject({
      startDate: '2025-08',
      endDate: '',
      currentlyWorking: true,
    });
  });

  it('formats month-year values with raw fallback', () => {
    expect(formatMonthYear('2015-06')).toBe('Jun 2015');
    expect(formatMonthYear('unknown date')).toBe('unknown date');
  });
});
