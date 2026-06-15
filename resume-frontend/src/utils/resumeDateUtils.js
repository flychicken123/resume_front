const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const MONTHS = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

const MONTH_PATTERN = Object.keys(MONTHS).join('|');
const MONTH_NAME_REGEX = new RegExp(`\\b(${MONTH_PATTERN})\\.?\\b`, 'i');
const PRESENT_REGEX = /\b(present|current|currently|now|today|ongoing)\b/i;

const firstText = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined) {
      continue;
    }
    const text = String(value).trim();
    if (text) {
      return text;
    }
  }
  return '';
};

const monthNumber = (value) => {
  const key = String(value || '').toLowerCase().replace(/\.$/, '');
  return MONTHS[key] || null;
};

const dateFromParts = (year, month = 1, day = 1) => {
  const numericYear = Number(year);
  const numericMonth = Number(month);
  const numericDay = Number(day);
  if (
    !Number.isInteger(numericYear) ||
    !Number.isInteger(numericMonth) ||
    !Number.isInteger(numericDay) ||
    numericYear < 1000 ||
    numericMonth < 1 ||
    numericMonth > 12 ||
    numericDay < 1 ||
    numericDay > 31
  ) {
    return null;
  }
  return new Date(Date.UTC(numericYear, numericMonth - 1, numericDay));
};

export const isPresentDateValue = (value) => {
  if (value === null || value === undefined) {
    return false;
  }
  return PRESENT_REGEX.test(String(value).trim());
};

export const coerceDate = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const timestampDate = new Date(value);
    return Number.isNaN(timestampDate.getTime()) ? null : timestampDate;
  }

  const str = String(value).trim();
  if (!str || isPresentDateValue(str)) {
    return null;
  }

  if (ISO_DATE_REGEX.test(str)) {
    const [year, month, day] = str.split('-');
    return dateFromParts(year, month, day);
  }

  const monthNameYear = str.match(
    new RegExp(`^(${MONTH_PATTERN})\\.?[,]?\\s+(\\d{4})$`, 'i')
  );
  if (monthNameYear) {
    return dateFromParts(monthNameYear[2], monthNumber(monthNameYear[1]), 1);
  }

  const yearMonthName = str.match(
    new RegExp(`^(\\d{4})\\s+(${MONTH_PATTERN})\\.?$`, 'i')
  );
  if (yearMonthName) {
    return dateFromParts(yearMonthName[1], monthNumber(yearMonthName[2]), 1);
  }

  if (/^\d{8}$/.test(str)) {
    return dateFromParts(str.slice(0, 4), str.slice(4, 6), str.slice(6, 8));
  }

  if (/^\d{6}$/.test(str)) {
    return dateFromParts(str.slice(0, 4), str.slice(4, 6), 1);
  }

  const normalized = str.replace(/[.]/g, '-').replace(/\//g, '-');

  let match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    return dateFromParts(match[1], match[2], match[3]);
  }

  match = normalized.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (match) {
    return dateFromParts(match[3], match[1], match[2]);
  }

  match = normalized.match(/^(\d{4})-(\d{1,2})$/);
  if (match) {
    return dateFromParts(match[1], match[2], 1);
  }

  match = normalized.match(/^(\d{1,2})-(\d{4})$/);
  if (match) {
    return dateFromParts(match[2], match[1], 1);
  }

  if (/^\d{4}$/.test(str)) {
    return dateFromParts(str, 1, 1);
  }

  if (/^(\d{10}|\d{13})$/.test(str)) {
    const unix = Number(str);
    const millis = str.length === 13 ? unix : unix * 1000;
    const numericDate = new Date(millis);
    if (!Number.isNaN(numericDate.getTime())) {
      return numericDate;
    }
  }

  let parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  if (str.includes(' ')) {
    parsed = new Date(str.replace(' ', 'T'));
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
};

export const normalizeDateValue = (value) => {
  const parsed = coerceDate(value);
  if (!parsed) {
    return '';
  }

  const year = parsed.getUTCFullYear();
  const month = `${parsed.getUTCMonth() + 1}`.padStart(2, '0');
  return `${year}-${month}`;
};

const cleanRangeSide = (value) =>
  String(value || '')
    .replace(/^\s*from\s+/i, '')
    .replace(/\s+$/g, '')
    .trim();

export const parseDateRange = (value) => {
  if (!value) {
    return null;
  }

  const text = String(value).trim();
  if (!text) {
    return null;
  }

  const rangeSeparators = [
    /\s+\bto\b\s+/i,
    /\s+\bthrough\b\s+/i,
    /\s+\bthru\b\s+/i,
    /\s+\buntil\b\s+/i,
    /\s+[–—]\s+/,
    /\s+-\s+/,
  ];

  for (const separator of rangeSeparators) {
    const parts = text.split(separator);
    if (parts.length >= 2) {
      return {
        start: cleanRangeSide(parts[0]),
        end: cleanRangeSide(parts.slice(1).join(' ')),
      };
    }
  }

  if (MONTH_NAME_REGEX.test(text) && !/^\d{4}-\d{1,2}(?:-\d{1,2})?$/.test(text)) {
    const compact = text.match(/^(.+?\d{4})\s*[-–—]\s*(.+)$/);
    if (compact) {
      return {
        start: cleanRangeSide(compact[1]),
        end: cleanRangeSide(compact[2]),
      };
    }
  }

  return null;
};

const normalizeStorageDate = (value) => {
  const raw = firstText(value);
  if (!raw || isPresentDateValue(raw)) {
    return '';
  }
  return normalizeDateValue(raw) || raw;
};

export const normalizeExperienceDates = (experience = {}) => {
  if (!experience || typeof experience !== 'object') {
    return experience;
  }

  const next = { ...experience };
  let startRaw = firstText(next.startDate, next.start_date, next.start, next.from);
  let endRaw = firstText(next.endDate, next.end_date, next.end, next.to);
  const rangeRaw = firstText(next.dateRange, next.date_range, next.dates, next.period, next.duration);

  const explicitRange = parseDateRange(rangeRaw);
  const startRange = parseDateRange(startRaw);
  const endRange = parseDateRange(endRaw);
  const range = explicitRange || startRange || endRange;

  if (range) {
    if (!startRaw || startRange || explicitRange) {
      startRaw = range.start;
    }
    if (!endRaw || startRange || endRange || explicitRange) {
      endRaw = range.end;
    }
  }

  const worksHere =
    next.currentlyWorking === true ||
    next.currently_working === true ||
    next.current === true ||
    isPresentDateValue(endRaw);

  const normalizedStartDate = normalizeStorageDate(startRaw);
  const normalizedEndDate = worksHere ? '' : normalizeStorageDate(endRaw);

  if (
    next.startDate === normalizedStartDate &&
    next.endDate === normalizedEndDate &&
    next.currentlyWorking === worksHere
  ) {
    return experience;
  }

  next.startDate = normalizedStartDate;
  next.endDate = normalizedEndDate;
  next.currentlyWorking = worksHere;

  return next;
};

export const formatMonthYear = (value) => {
  const raw = firstText(value);
  if (!raw) {
    return '';
  }
  if (isPresentDateValue(raw)) {
    return 'Present';
  }

  const parsed = coerceDate(raw);
  if (!parsed) {
    return raw;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
};
