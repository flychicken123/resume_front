export const createJobDescriptionEntry = (overrides = {}) => {
  const generatedId = `job-desc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const entry = {
    id: typeof overrides.id === 'string' && overrides.id.trim() ? overrides.id : generatedId,
    url: typeof overrides.url === 'string' ? overrides.url : '',
    text: typeof overrides.text === 'string' ? overrides.text : '',
  };
  return entry;
};

export const ensureJobDescriptionList = (list) => {
  if (!Array.isArray(list) || list.length === 0) {
    return [createJobDescriptionEntry()];
  }
  let changed = false;
  const normalized = list.map((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      changed = true;
      return createJobDescriptionEntry();
    }
    const id = typeof entry.id === 'string' && entry.id.trim() ? entry.id.trim() : null;
    const url = typeof entry.url === 'string' ? entry.url : '';
    const text = typeof entry.text === 'string' ? entry.text : '';

    const hasSameShape =
      id &&
      entry.id === id &&
      entry.url === url &&
      entry.text === text;

    if (hasSameShape) {
      return entry;
    }

    changed = true;
    return createJobDescriptionEntry({
      id: id || undefined,
      url,
      text,
    });
  });

  if (normalized.length === 0) {
    return [createJobDescriptionEntry()];
  }
  return changed ? normalized : list;
};

export const combineJobDescriptions = (list) => {
  if (!Array.isArray(list)) {
    return '';
  }
  return list
    .map((entry) => (typeof entry?.text === 'string' ? entry.text.trim() : ''))
    .filter(Boolean)
    .join('\n\n---\n\n');
};

export const prepareJobDescriptionsForStorage = (list) => {
  const ensured = ensureJobDescriptionList(list);
  const significant = ensured.filter((entry) => {
    const url = typeof entry.url === 'string' ? entry.url.trim() : '';
    const text = typeof entry.text === 'string' ? entry.text.trim() : '';
    return url || text;
  });
  return significant.map((entry) => ({
    id: entry.id,
    url: entry.url,
    text: entry.text,
  }));
};
