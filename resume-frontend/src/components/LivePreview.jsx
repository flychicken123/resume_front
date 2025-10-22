import React, { useState, useEffect, useRef } from 'react';
import { useResume } from '../context/ResumeContext';
import { TEMPLATE_SLUGS, DEFAULT_TEMPLATE_ID, normalizeTemplateId } from '../constants/templates';
import './LivePreview.css';
const LivePreview = ({ isVisible = true, onToggle, onDownload, downloadNotice }) => {
  const isBrowser = typeof window !== 'undefined';
  const DEBUG_PAGINATION = isBrowser && (
    process.env.REACT_APP_DEBUG_PAGINATION === 'true' ||
    (window.localStorage && window.localStorage.getItem('DEBUG_PAGINATION') === 'true')
  );
  if (DEBUG_PAGINATION && isBrowser) {
    console.log('[Pagination] debug enabled');
  }
  const { data } = useResume();
  const selectedFormat = normalizeTemplateId(data.selectedFormat);
  const [pages, setPages] = useState([]);
  const [useConservativePaging, setUseConservativePaging] = useState(false);
  const isIndustryManagerFormat = (selectedFormat === TEMPLATE_SLUGS.EXECUTIVE_SERIF);
  const isAttorneyFormat = (selectedFormat === TEMPLATE_SLUGS.ATTORNEY_TEMPLATE);
  // Reset paging heuristics whenever template changes so new format starts fresh
  useEffect(() => {
    setUseConservativePaging(false);
  }, [selectedFormat]);
  // Normalize any value into safe display text
  const toText = (val) => {
    if (val == null) return '';
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) return val.filter(Boolean).join(', ');
    if (typeof val === 'object') {
      try {
        const values = Object.values(val);
        const flattened = values.every((v) => Array.isArray(v)) ? values.flat() : values;
        return flattened.filter(Boolean).join(', ');
      } catch (e) {
        return '';
      }
    }
    return String(val);
  };
  const contentRef = useRef(null);
  // Page dimensions in pixels (8.5" x 11" at 96 DPI)
  const PAGE_HEIGHT = 1056;
  const CONTENT_MARGIN = 20; // Matches 20px padding so page height stays aligned
  const AVAILABLE_HEIGHT = PAGE_HEIGHT - (CONTENT_MARGIN * 2);
  // Font size scale factors that match the rendering scale
  const getFontSizeScaleFactor = () => {
    const fontSizeMultipliers = {
      'small': 1.0,
      'medium': 1.2,
      'large': 1.5,
      'extra-large': 1.8
    };
    return fontSizeMultipliers[data.selectedFontSize || 'medium'] || 1.2;
  };
  // Estimate height for different content types (more realistic estimates)
  const estimateSectionHeight = (content, type) => {
    if (!content) return 0;
    // Get font size scale factor to adjust heights
    const fontScale = getFontSizeScaleFactor();
const applyFormatAdjustment = (value, sectionKey = type) => {
  if (!isIndustryManagerFormat && !isAttorneyFormat) {
    return value;
  }
  if (isAttorneyFormat) {
    const attorneyAdjustments = {
      aggressive: {
        header: { multiplier: 1.04, floor: 34 },
        summary: { multiplier: 1.12, floor: 38 },
        experience: { multiplier: 1.18, floor: 132 },
        education: { multiplier: 1.1, floor: 44 },
        projects: { multiplier: 1.18, floor: 92 },
        skills: { multiplier: 1.12, floor: 48 },
        default: { multiplier: 1.1, floor: 42 }
      },
      conservative: {
        header: { multiplier: 1.1, floor: 40 },
        summary: { multiplier: 1.22, floor: 44 },
        experience: { multiplier: 1.32, floor: 158 },
        education: { multiplier: 1.18, floor: 52 },
        projects: { multiplier: 1.28, floor: 108 },
        skills: { multiplier: 1.2, floor: 56 },
        default: { multiplier: 1.18, floor: 50 }
      }
    };
    const mode = useConservativePaging ? 'conservative' : 'aggressive';
    const { multiplier, floor } = attorneyAdjustments[mode][sectionKey] || attorneyAdjustments[mode].default;
    return Math.max(floor, value * multiplier);
  }
  const adjustmentSets = {
    // Keep aggressive mode close to measured height
    aggressive: {
      header: { multiplier: 1.00, floor: 24 },
      summary: { multiplier: 1.01, floor: 30 },
      experience: { multiplier: 1.04, floor: 92 },
      education: { multiplier: 1.01, floor: 28 },
      projects: { multiplier: 1.04, floor: 64 },
      skills: { multiplier: 1.03, floor: 34 },
      default: { multiplier: 1.01, floor: 30 }
    },
    conservative: {
      header: { multiplier: 1.06, floor: 28 },
      summary: { multiplier: 1.1, floor: 34 },
      experience: { multiplier: 1.12, floor: 110 },
      education: { multiplier: 1.06, floor: 34 },
      projects: { multiplier: 1.12, floor: 74 },
      skills: { multiplier: 1.08, floor: 38 },
      default: { multiplier: 1.08, floor: 34 }
    }
  };
  const mode = useConservativePaging ? 'conservative' : 'aggressive';
  const selected = adjustmentSets[mode];
  const { multiplier, floor } = selected[sectionKey] || selected.default;
  const adjusted = Math.max(floor, value * multiplier);
  // Allow increasing estimates to prevent overflow/cutoff
  return adjusted;
};
    switch (type) {
      case 'header': {
        const baseHeight = Math.round(35 * fontScale); // Reduced from 40
        return applyFormatAdjustment(baseHeight, 'header');
      }
      case 'summary': {
        // Much more conservative estimation
        const contentText = toText(content);
        const charsPerLine = Math.round(120 / fontScale); // Increased from 100
        const lines = Math.ceil(contentText.length / charsPerLine);
        const lineHeight = Math.round(14 * fontScale); // Reduced from 16
        const summaryHeight = Math.max(18 * fontScale, lines * lineHeight);
        return applyFormatAdjustment(summaryHeight, 'summary');
      }
      case 'experience': {
        if (Array.isArray(content)) {
          const totalHeight = content.reduce((total, exp) => {
            let height = Math.round(28 * fontScale); // Reduced from 35
            if (exp.description) {
              const rawLines = String(exp.description).split(/\n+/).filter((line) => line.trim());
              const descCharsPerLine = Math.round(140 / fontScale);
              const lineHeightPx = Math.round(13 * fontScale);
              let descLines = 0;
              for (const rawLine of rawLines.length ? rawLines : [String(exp.description)]) {
                const cleanLine = rawLine.replace(/[•\u2022-]+/g, '').trim();
                const effectiveLength = cleanLine.length || rawLine.trim().length || 1;
                descLines += Math.max(1, Math.ceil(effectiveLength / Math.max(1, descCharsPerLine)));
              }
              height += descLines * lineHeightPx;
              if (rawLines.length > 1) {
                height += Math.round(Math.min(6, 2 * fontScale));
              }
            }
            return total + height + Math.round(6 * fontScale); // Reduced from 8
          }, 0);
          return applyFormatAdjustment(totalHeight, 'experience');
        }
        return applyFormatAdjustment(Math.round(35 * fontScale), 'experience');
      }
      case 'education': {
        if (Array.isArray(content)) {
          const eduHeight = content.length * Math.round(18 * fontScale);
          return applyFormatAdjustment(eduHeight, 'education');
        }
        return applyFormatAdjustment(Math.round(18 * fontScale), 'education');
      }
      case 'projects': {
        if (Array.isArray(content)) {
          // Projects usually take more space due to descriptions
          const projectHeight = content.reduce((total, project) => {
            let height = Math.round(18 * fontScale); // Base height for title (reduced)
            if (project.description) {
              // Count actual lines including bullet points
              const lines = project.description.split('\n').filter(l => l.trim());
              // Most bullet points fit on one line at preview scale
              let totalLines = lines.length;
              const descCharsPerLine = Math.round(140 / fontScale); // Increased - more chars fit per line
              // Only count extra lines for very long bullet points
              for (const line of lines) {
                const cleanLine = line.replace('•', '').trim();
                if (cleanLine.length > descCharsPerLine) {
                  totalLines += Math.floor(cleanLine.length / descCharsPerLine);
                }
              }
              height += totalLines * Math.round(12 * fontScale); // Reduced line height
            }
            if (project.technologies) {
              // Technologies usually fit on one line
              height += Math.round(12 * fontScale);
            }
            if (project.projectUrl) height += Math.round(12 * fontScale);
            return total + height + Math.round(5 * fontScale); // Reduced spacing
          }, 0);
          return applyFormatAdjustment(projectHeight, 'projects');
        }
        return applyFormatAdjustment(Math.round(60 * fontScale), 'projects');
      }
      case 'skills': {
        const skillsArray = parseSkills(content);
        const lineHeight = Math.round(13 * fontScale);
        const baseHeight = Math.max(lineHeight, Math.round(17 * fontScale));
        const itemGap = Math.max(2, Math.round(2 * fontScale));

        if (!skillsArray || skillsArray.length === 0) {
          return applyFormatAdjustment(baseHeight, 'skills');
        }

        if (isIndustryManagerFormat) {
          const columnCount = 2;
          const perLineChars = Math.max(8, Math.round(70 / fontScale));
          const columnHeights = new Array(columnCount).fill(0);

          skillsArray.forEach((skill) => {
            const clean = String(skill || '').trim();
            const lines = Math.max(1, Math.ceil(clean.length / perLineChars));
            const blockHeight = lines * lineHeight + itemGap;

            let targetIndex = 0;
            for (let i = 1; i < columnCount; i += 1) {
              if (columnHeights[i] < columnHeights[targetIndex]) {
                targetIndex = i;
              }
            }

            columnHeights[targetIndex] += blockHeight;
          });

          const estimated = Math.max(...columnHeights);
          return applyFormatAdjustment(Math.max(baseHeight, estimated), 'skills');
        }

        const perLineChars = Math.max(20, Math.round(140 / fontScale));
        let currentLineChars = 0;
        let lineCount = 1;

        skillsArray.forEach((skill, index) => {
          const value = String(skill || '');
          const lengthWithSeparator = value.length + (index === skillsArray.length - 1 ? 0 : 2);

          if (currentLineChars > 0 && (currentLineChars + lengthWithSeparator) > perLineChars) {
            lineCount += 1;
            currentLineChars = lengthWithSeparator;
          } else {
            currentLineChars += lengthWithSeparator;
          }
        });

        const estimated = (lineCount * lineHeight) + ((lineCount - 1) * itemGap);
        return applyFormatAdjustment(Math.max(baseHeight, estimated), 'skills');
      }
      default:
        return applyFormatAdjustment(20, 'default');
    }
  };
  const adjustSkillContentEstimate = (contentHeight, { includeHeader = false } = {}) => {
    const fontScale = getFontSizeScaleFactor();
    if (!isIndustryManagerFormat) {
      return includeHeader ? contentHeight + Math.round(18 * fontScale) : contentHeight;
    }
    const headerAllowance = includeHeader ? Math.round(18 * fontScale) : 0;
    const base = contentHeight + headerAllowance;
    const multiplier = includeHeader ? 1.12 : 1.06;
    const extra = includeHeader ? 12 : 6;
    return Math.round(base * multiplier + extra);
  };
  // Split content into pages based on estimated heights
  const splitContentIntoPages = () => {
    const newPages = [];
    let currentPage = [];
    let currentHeight = 0;
    // Get font scale factor to adjust page capacity
    const fontScale = getFontSizeScaleFactor();
    // Adjust available height based on font size - keep conservative so we split earlier
    const baseUtilization = fontScale <= 1.0 ? 0.96  :   // Small
                           fontScale <= 1.2 ? 0.94  :   // Medium (default)
                           fontScale <= 1.5 ? 0.92  :   // Large
                           0.90;                        // Extra-large
    const pageUtilization = useConservativePaging
      ? Math.min(baseUtilization + 0.03, 0.97)
      : baseUtilization;
    let effectiveAvailableHeight = AVAILABLE_HEIGHT * pageUtilization;
    if (isIndustryManagerFormat && !useConservativePaging) {
      if (fontScale >= 1.5 && fontScale < 1.8) {
        effectiveAvailableHeight = Math.min(effectiveAvailableHeight, AVAILABLE_HEIGHT * 0.9);
      } else if (fontScale >= 1.8) {
        effectiveAvailableHeight = Math.min(effectiveAvailableHeight, AVAILABLE_HEIGHT * 0.88);
      }
    }
    if (useConservativePaging) {
      const conservativeLimit = AVAILABLE_HEIGHT - (isIndustryManagerFormat ? 28 : 72);
      effectiveAvailableHeight = Math.min(effectiveAvailableHeight, conservativeLimit);
    }
    if (isIndustryManagerFormat) {
      const marginByMode = useConservativePaging ? 20 : 12;
      const marginLimit = AVAILABLE_HEIGHT - marginByMode;
      const hardLimit = AVAILABLE_HEIGHT - Math.max(16, Math.floor(marginByMode * 0.75));
      effectiveAvailableHeight = Math.min(effectiveAvailableHeight, marginLimit, hardLimit);
    }
    const basePageBuffer = useConservativePaging ? 14 : 20;
    const bufferedLimit = AVAILABLE_HEIGHT - basePageBuffer;
    effectiveAvailableHeight = Math.min(effectiveAvailableHeight, bufferedLimit);
    const hardPageLimit = AVAILABLE_HEIGHT - (useConservativePaging ? 40 : 34);
    effectiveAvailableHeight = Math.min(effectiveAvailableHeight, hardPageLimit);
    const sectionPadding = {
      header: useConservativePaging ? 12 : 16,
      summary: useConservativePaging ? 16 : 22,
      experience: useConservativePaging ? 18 : 26,
      projects: useConservativePaging ? 18 : 24,
      education: useConservativePaging ? 16 : 22,
      skills: useConservativePaging ? 14 : 22,
      default: useConservativePaging ? 12 : 18
    };
    const getSectionPadding = (type) => sectionPadding[type] ?? sectionPadding.default;
    const addBuffer = (height, type) => {
      const safeHeight = Math.max(0, height || 0);
      return safeHeight + getSectionPadding(type);
    };
    const sumEstimatedHeight = (sections) =>
      sections.reduce((total, item) => total + addBuffer(item?.estimatedHeight || 0, item?.type), 0);
    // Helper function to add section to current page
    const addToCurrentPage = (section) => {
      currentPage.push(section);
      currentHeight += addBuffer(section.estimatedHeight, section.type);
    };
    // Helper function to start new page
    const startNewPage = () => {
      if (currentPage.length > 0) {
        newPages.push([...currentPage]);
      }
      currentPage = [];
      currentHeight = 0;
    };
    // Helper function to check if content can fit on current page
    const canFitOnCurrentPage = (contentHeight, sectionType) => {
      return (currentHeight + addBuffer(contentHeight, sectionType)) <= effectiveAvailableHeight;
    };
    // Helper function to split long content across pages
    const splitLongContent = (content, type, maxHeight) => {
      const fontScale = getFontSizeScaleFactor();
      const aggressiveIndustry = isIndustryManagerFormat && !useConservativePaging;
      
      if (type === 'skills') {
        // Split skills list across pages. Executive Serif uses 2-column grid,
        // so height is the tallest column. We simulate packing items into
        // columns and stop before exceeding maxHeight.
        const items = parseSkills(content);
        if (!items || items.length === 0) return [content];
        const columnCount = isIndustryManagerFormat ? 2 : 1;
        const perLine = Math.max(10, Math.round((isIndustryManagerFormat ? 64 : 120) / fontScale));
        const lineHeight = Math.round(12 * fontScale);
        const itemGap = Math.max(2, Math.round(2 * fontScale));
        const rowGap = Math.max(4, Math.round(4 * fontScale));
        const heightAllowance = Math.max(0, maxHeight - rowGap);
        // Estimate height for a set of items laid out in columns
        const estimateSetHeight = (arr) => {
          if (arr.length === 0) return 0;
          const colHeights = new Array(columnCount).fill(0);
          for (const skill of arr) {
            const clean = String(skill).trim();
            const lines = Math.max(1, Math.ceil(clean.length / perLine));
            const h = (lines * lineHeight) + itemGap;
            // Greedy: place into shortest column
            let idx = 0;
            for (let i = 1; i < columnCount; i++) {
              if (colHeights[i] < colHeights[idx]) idx = i;
            }
            if (colHeights[idx] > 0) {
              colHeights[idx] += rowGap;
            }
            colHeights[idx] += h;
          }
          return Math.max(...colHeights);
        };
        const fitsWithinLimit = (arr) => estimateSetHeight(arr) <= heightAllowance;
        const parts = [];
        let current = [];
        for (let i = 0; i < items.length; i++) {
          const next = [...current, items[i]];
          const heightWithNext = estimateSetHeight(next);
          if (heightWithNext <= heightAllowance || current.length === 0) {
            current = next;
          } else {
            parts.push(current);
            current = [items[i]];
          }
        }
        if (current.length) parts.push(current);
        // Ensure each chunk stays within height limit by shifting overflow forward
        for (let i = 0; i < parts.length; i++) {
          while (!fitsWithinLimit(parts[i]) && parts[i].length > 1) {
            const spill = parts[i].pop();
            if (!parts[i + 1]) {
              parts[i + 1] = [];
            }
            parts[i + 1].unshift(spill);
          }
        }
        // Balance items between adjacent parts to reduce large gaps
        if (parts.length > 1) {
          for (let idx = parts.length - 1; idx > 0; idx--) {
            const prev = parts[idx - 1];
            const curr = parts[idx];
            let moved = false;
            while (curr.length > 0) {
              const candidate = [...prev, curr[0]];
              if (fitsWithinLimit(candidate)) {
                prev.push(curr.shift());
                moved = true;
              } else {
                break;
              }
            }
            if (curr.length === 0) {
              parts.splice(idx, 1);
            } else if (!moved && prev.length > 1) {
              // Try moving last item from prev to current if prev still too short
              if (estimateSetHeight(prev) <= heightAllowance * 0.85) {
                curr.unshift(prev.pop());
                if (!fitsWithinLimit(curr)) {
                  prev.push(curr.shift());
                }
              }
            }
          }
        }
        // Final safety pass in case balancing reintroduced overflow
        for (let i = 0; i < parts.length; i++) {
          while (!fitsWithinLimit(parts[i]) && parts[i].length > 1) {
            const spill = parts[i].pop();
            if (!parts[i + 1]) {
              parts[i + 1] = [];
            }
            parts[i + 1].unshift(spill);
          }
        }
        // Convert parts back to strings so downstream parsing still works
        return parts.map(p => p.join(', '));
      }
      
      if (type === 'summary') {
        // Split summary more aggressively - try sentences first, then words if needed
        let sentences = content.split('. ');
        
        // If there are very few sentences, split on other punctuation too
        if (sentences.length <= 2) {
          sentences = content.split(/[.!?;]\s+/);
        }
        
        // If still very few parts, split on commas or by word count
        if (sentences.length <= 2) {
          const words = content.split(' ');
          const wordsPerPart = Math.ceil(words.length / 3); // Force at least 3 parts
          sentences = [];
          for (let i = 0; i < words.length; i += wordsPerPart) {
            sentences.push(words.slice(i, i + wordsPerPart).join(' '));
          }
        }
        
        const parts = [];
        let currentPart = '';
        
        for (let i = 0; i < sentences.length; i++) {
          const sentence = sentences[i];
          const connector = currentPart ? '. ' : '';
          const testPart = currentPart + connector + sentence;
          const testHeight = estimateSectionHeight(testPart, type);
          
          // Very aggressive - allow up to 95% of max height before splitting
          if (testHeight > maxHeight * 0.95 && currentPart) {
            // Current part is full, start new part
            parts.push(currentPart);
            currentPart = sentence;
          } else {
            currentPart = testPart;
          }
        }
        
        if (currentPart) {
          parts.push(currentPart);
        }
        
        // Force at least 2 parts if content is long enough
        if (parts.length === 1 && content.length > 200) {
          const midPoint = Math.floor(content.length / 2);
          const splitPoint = content.lastIndexOf(' ', midPoint);
          if (splitPoint > 0) {
            return [content.substring(0, splitPoint), content.substring(splitPoint + 1)];
          }
        }
        
        return parts;
      }
      
      if (type === 'experience' && Array.isArray(content)) {
        // Split experience array by individual jobs
        const parts = [];
        let currentPart = [];
        let currentHeight = 0;
        
        for (const exp of content) {
          const expHeight = estimateSectionHeight([exp], 'experience');
          
          // Check if adding this experience would exceed max height
          // Use higher threshold to maximize space usage
          const threshold = aggressiveIndustry ? 1.0 : 1.0; // Allow packing until hard limit
          if (currentHeight + expHeight > maxHeight * threshold && currentPart.length > 0) {
            // Current part is full, start new part
            parts.push([...currentPart]);
            currentPart = [exp];
            currentHeight = expHeight;
          } else {
            // Add to current part
            currentPart.push(exp);
            currentHeight += expHeight;
          }
        }
        
        if (currentPart.length > 0) {
          parts.push(currentPart);
        }
        
        return parts.length > 1 ? parts : [content];
      }
      
      if (type === 'projects' && Array.isArray(content)) {
        // If we have very little space, don't try to split
        const minProjectSpace = aggressiveIndustry ? 160 : 100;
        if (maxHeight < minProjectSpace) {
          return [content];
        }
        
        // For a single large project with many bullet points, try to split the description
        if (content.length === 1 && content[0].description) {
          const project = content[0];
          const lines = project.description.split('\n').filter(l => l.trim());
          
          // If we have many bullet points, try to split them
          if (lines.length > 4) {
            // Calculate how many bullet points might fit
            const lineHeight = Math.round(aggressiveIndustry ? 10 * fontScale : 13 * fontScale); // Slightly more conservative
            const titleHeight = Math.round(16 * fontScale);
            const sectionTitleHeight = Math.round(24 * fontScale); // "PROJECTS" title
            const techHeight = project.technologies ? Math.round(12 * fontScale) : 0;
            const urlHeight = project.projectUrl ? Math.round(12 * fontScale) : 0;
            const baseHeight = titleHeight + sectionTitleHeight + techHeight + urlHeight + (aggressiveIndustry ? 14 : 30); // Padding for safety
            
            const availableForBullets = maxHeight - baseHeight;
            // Be more conservative - leave some buffer
            const bulletsPerPage = Math.max(2, Math.floor(availableForBullets / lineHeight) - (aggressiveIndustry ? 0 : 2));
            
            if (bulletsPerPage >= 2 && bulletsPerPage < lines.length) {
              // Split the bullet points
              const firstPart = lines.slice(0, bulletsPerPage).join('\n');
              const secondPart = lines.slice(bulletsPerPage).join('\n');
              
              return [
                [{
                  ...project,
                  description: firstPart,
                  // Keep tech and URL on first page
                  _isSplit: true,
                  _isFirstPart: true
                }],
                [{
                  ...project,
                  description: secondPart,
                  projectName: null, // Don't show title on continuation
                  // Don't repeat tech and URL on second page
                  technologies: null,
                  projectUrl: null,
                  _isContinuation: true
                }]
              ];
            }
          }
        }
        
        // Original splitting logic for multiple projects
        const parts = [];
        let currentPart = [];
        let currentHeight = 0;
        
        // First check if even one project can fit
        const firstProject = content[0];
        let firstProjectHeight = Math.round(16 * fontScale);
        
        if (firstProject.description) {
          const lines = firstProject.description.split('\n').filter(l => l.trim());
          let totalLines = 0;
          const descCharsPerLine = Math.round(150 / fontScale);
          
          for (const line of lines) {
            const cleanLine = line.replace('•', '').trim();
            const lineCount = Math.max(1, Math.ceil(cleanLine.length / descCharsPerLine));
            totalLines += lineCount;
          }
          
          firstProjectHeight += totalLines * Math.round(11 * fontScale);
        }
        if (firstProject.technologies) {
          firstProjectHeight += Math.round(11 * fontScale);
        }
        if (firstProject.projectUrl) {
          firstProjectHeight += Math.round(11 * fontScale);
        }
        
        if (firstProjectHeight > maxHeight) {
          // No projects can fit, don't split
          return [content];
        }
        
        for (const project of content) {
          // Calculate individual project height
          let projectHeight = Math.round(16 * fontScale); // Title (reduced)
          if (project.description) {
            const lines = project.description.split('\n').filter(l => l.trim());
            let totalLines = lines.length;
            const descCharsPerLine = Math.round(150 / fontScale); // More chars per line
            for (const line of lines) {
              const cleanLine = line.replace('•', '').trim();
              if (cleanLine.length > descCharsPerLine) {
                totalLines += Math.floor(cleanLine.length / descCharsPerLine);
              }
            }
            projectHeight += totalLines * Math.round(11 * fontScale); // Reduced line height
          }
          if (project.technologies) {
            projectHeight += Math.round(11 * fontScale);
          }
          if (project.projectUrl) {
            projectHeight += Math.round(11 * fontScale);
          }
          
          
          // Check if adding this project would exceed max height
          // Don't use threshold here - use actual maxHeight
          if (currentHeight + projectHeight > maxHeight && currentPart.length > 0) {
            // Current part is full, start new part
            parts.push([...currentPart]);
            currentPart = [project];
            currentHeight = projectHeight;
          } else if (currentHeight + projectHeight <= maxHeight) {
            // Add to current part only if it actually fits
            currentPart.push(project);
            currentHeight += projectHeight;
          } else if (currentPart.length === 0) {
            // This project is too big to fit even alone, skip splitting
            console.log(`Project too large to fit (${projectHeight}px > ${maxHeight}px)`);
            return [content];
          }
        }
        
        if (currentPart.length > 0) {
          parts.push(currentPart);
        }
        
        // Only return parts if we actually managed to split something
        return parts.length > 0 ? parts : [content];
      }
      
      // For other types, return as is
      return [content];
    };
    // Create all sections first
    const allSections = [];
    
    // Header section
    if (data.name || data.email || data.phone) {
      const headerHeight = estimateSectionHeight(data.name, 'header');
      allSections.push({
        type: 'header',
        content: { name: data.name, email: data.email, phone: data.phone },
        estimatedHeight: headerHeight,
        priority: 1 // Must be on first page
      });
    }
    // Summary section
    if (data.summary) {
      const summaryText = toText(data.summary);
      const sectionTitleHeight = Math.round(24 * fontScale);
      const summaryHeight = estimateSectionHeight(summaryText, 'summary') + sectionTitleHeight;
      allSections.push({
        type: 'summary',
        content: summaryText,
        estimatedHeight: summaryHeight,
        priority: 2,
        canSplit: true
      });
    }
    // Experience section
    if (data.experiences && data.experiences.length > 0) {
      const sectionTitleHeight = Math.round(24 * fontScale); // Add height for section title
      const totalExpHeight = estimateSectionHeight(data.experiences, 'experience') + sectionTitleHeight;
      allSections.push({
        type: 'experience',
        content: data.experiences,
        estimatedHeight: totalExpHeight,
        priority: 3,
        canSplit: true  // Allow experience section to be split across pages
      });
    }
    // Projects section (comes before education for students)
    if (data.projects && data.projects.length > 0) {
      if (!isAttorneyFormat) {
        const sectionTitleHeight = Math.round(24 * fontScale); // Add height for section title
        const projectsHeight = estimateSectionHeight(data.projects, 'projects') + sectionTitleHeight;
        allSections.push({
          type: 'projects',
          content: data.projects,
          estimatedHeight: projectsHeight,
          priority: 4,
          canSplit: true  // Allow projects section to be split across pages
        });
      }
    }
    // Education section
    if (data.education) {
      const sectionTitleHeight = Math.round(24 * fontScale); // Add height for section title
      const eduHeight = estimateSectionHeight(data.education, 'education') + sectionTitleHeight;
      allSections.push({
        type: 'education',
        content: data.education,
        estimatedHeight: eduHeight,
        priority: 5
      });
    }
    // Skills section
    if (data.skills) {
      const skillsText = toText(data.skills);
      if (skillsText) {
        const rawSkillsHeight = estimateSectionHeight(skillsText, 'skills');
        const skillsHeight = adjustSkillContentEstimate(rawSkillsHeight, { includeHeader: true });
        allSections.push({
          type: 'skills',
          content: skillsText,
          estimatedHeight: skillsHeight,
          priority: 6,
          canSplit: true
        });
      }
    }
    // Now pack sections into pages aggressively
    let sectionIndex = 0;
    
    
    while (sectionIndex < allSections.length) {
      const section = allSections[sectionIndex];
      // Soft-fit allowance to avoid pushing small sections (like Education)
      // to the next page when there is clearly visible space left.
      const softAllowance = (() => {
        // Be a bit more permissive for Executive Serif
        if (isIndustryManagerFormat) {
          return {
            education: 48,
            summary: 24,
            experience: 16,
            projects: 16,
            skills: 24,
            default: 12,
          };
        }
        return { education: 32, default: 8 };
      })();
      const requiredWithPadding = currentHeight + addBuffer(section.estimatedHeight, section.type);
      const fitsNow = requiredWithPadding <= effectiveAvailableHeight;
      const fitsWithSlack = !fitsNow && (requiredWithPadding <= (effectiveAvailableHeight + (softAllowance[section.type] ?? softAllowance.default ?? 0)));
      if (fitsNow || (!section.canSplit && fitsWithSlack)) {
        // Section fits completely on current page
        addToCurrentPage(section);
        sectionIndex++;
      } else if (section.canSplit) {
        // Section doesn't fit completely. Try to split to use remaining space
        const remainingHeight = Math.max(0, effectiveAvailableHeight - currentHeight);
        
        
        // Require at least 100px for any meaningful content
        const minSpaceToSplit = isIndustryManagerFormat ? (useConservativePaging ? 85 : 65) : 100;
        
        const rawRemainingHeight = Math.max(0, remainingHeight - getSectionPadding(section.type));
        const computePartHeight = (partContent, includeHeader = false) => {
          let height = estimateSectionHeight(partContent, section.type);
          if (section.type === 'skills') {
            height = adjustSkillContentEstimate(height, { includeHeader });
          }
          return height;
        };
        if (rawRemainingHeight > minSpaceToSplit) {
          const parts = splitLongContent(section.content, section.type, rawRemainingHeight);
          
          // Check if we actually got a meaningful split
          // For projects, parts[0] should be an array of projects, not the full content
          const gotMeaningfulSplit = parts.length > 1 || 
            (section.type === 'projects' && Array.isArray(parts[0]) && parts[0].length < section.content.length);
          
          if (gotMeaningfulSplit) {
            // We got split parts - add them even if just one part fits
            
            // Add first part to current page
            const firstPartHeight = computePartHeight(parts[0], true);
            addToCurrentPage({
              ...section,
              content: parts[0],
              estimatedHeight: firstPartHeight,
              isContinued: parts.length > 1
            });
            
            // If there are more parts, add them to new pages
            if (parts.length > 1) {
              // Start new page for remaining parts
              startNewPage();
              
              // Add remaining parts
              for (let i = 1; i < parts.length; i++) {
                const partHeight = computePartHeight(parts[i], false);
                const isLast = i === parts.length - 1;
                
                if (canFitOnCurrentPage(partHeight, section.type)) {
                  addToCurrentPage({
                    ...section,
                    content: parts[i],
                    estimatedHeight: partHeight,
                    isContinuation: true,
                    isContinued: !isLast
                  });
                } else {
                  startNewPage();
                  addToCurrentPage({
                    ...section,
                    content: parts[i],
                    estimatedHeight: partHeight,
                    isContinuation: true,
                    isContinued: !isLast
                  });
                }
              }
            }
            
            sectionIndex++;
          } else {
            // Can't split effectively on this page; try on a fresh page
              startNewPage();
              const fullPageAvailable = Math.max(0, effectiveAvailableHeight - getSectionPadding(section.type));
              if (fullPageAvailable > minSpaceToSplit) {
                const partsOnNew = splitLongContent(section.content, section.type, fullPageAvailable);
                if (partsOnNew.length > 1) {
                  const firstPartHeight = computePartHeight(partsOnNew[0], true);
                  addToCurrentPage({ ...section, content: partsOnNew[0], estimatedHeight: firstPartHeight, isContinued: true });
                  for (let i = 1; i < partsOnNew.length; i++) {
                    const partHeight = computePartHeight(partsOnNew[i], false);
                    if (!canFitOnCurrentPage(partHeight, section.type)) startNewPage();
                    addToCurrentPage({ ...section, content: partsOnNew[i], estimatedHeight: partHeight, isContinuation: i > 0, isContinued: i < partsOnNew.length - 1 });
                  }
                  sectionIndex++;
                } else {
                addToCurrentPage(section);
                sectionIndex++;
              }
            } else {
              addToCurrentPage(section);
              sectionIndex++;
            }
          }
        } else {
          // Not enough space to split meaningfully, move to new page
          startNewPage();
          const fullPageAvailable = Math.max(0, effectiveAvailableHeight - getSectionPadding(section.type));
          if (fullPageAvailable > minSpaceToSplit) {
            const partsOnNew = splitLongContent(section.content, section.type, fullPageAvailable);
            if (partsOnNew.length > 1) {
              const firstPartHeight = computePartHeight(partsOnNew[0], true);
              addToCurrentPage({ ...section, content: partsOnNew[0], estimatedHeight: firstPartHeight, isContinued: true });
              for (let i = 1; i < partsOnNew.length; i++) {
                const partHeight = computePartHeight(partsOnNew[i], false);
                if (!canFitOnCurrentPage(partHeight, section.type)) startNewPage();
                addToCurrentPage({ ...section, content: partsOnNew[i], estimatedHeight: partHeight, isContinuation: i > 0, isContinued: i < partsOnNew.length - 1 });
              }
              sectionIndex++;
            } else {
              addToCurrentPage(section);
              sectionIndex++;
            }
          } else {
            addToCurrentPage(section);
            sectionIndex++;
          }
        }
      } else {
        // Section doesn't fit, start new page
        startNewPage();
        
        // Try to fit it on the new page
        if (canFitOnCurrentPage(section.estimatedHeight, section.type)) {
          addToCurrentPage(section);
          sectionIndex++;
        } else {
          // Section is too large even for a new page, add it anyway
          addToCurrentPage(section);
          sectionIndex++;
        }
      }
    }
    // Add the last page if it has content
    if (currentPage.length > 0) {
      newPages.push([...currentPage]);
    }
    if (isAttorneyFormat) {
      const getOrCreateContinuationPage = () => {
        if (newPages.length >= 2) {
          if (!Array.isArray(newPages[1])) {
            newPages[1] = [];
          }
          return newPages[1];
        }
        const newPage = [];
        newPages.push(newPage);
        return newPage;
      };
      if (newPages.length) {
        const firstPage = newPages[0];
        const attorneyBuffer = useConservativePaging ? 132 : 156;
        const attorneyLimit = Math.max(0, effectiveAvailableHeight - attorneyBuffer);
        let firstHeight = sumEstimatedHeight(firstPage);
        let guard = 0;
        while (firstPage.length > 1 && firstHeight > attorneyLimit && guard < 20) {
          guard += 1;
          let candidateIndex = -1;
          for (let idx = firstPage.length - 1; idx >= 1; idx -= 1) {
            const section = firstPage[idx];
            if (!section) continue;
            const sectionType = section.type;
            if (!sectionType || sectionType === 'header') {
              continue;
            }
            if (sectionType === 'education' || sectionType === 'skills') {
              continue;
            }
            candidateIndex = idx;
            break;
          }
          if (candidateIndex === -1) {
            candidateIndex = firstPage.length - 1;
            if (candidateIndex <= 0) {
              break;
            }
          }
          const [moved] = firstPage.splice(candidateIndex, 1);
          if (!moved) {
            break;
          }
          const remainingCapacity = Math.max(0, attorneyLimit - sumEstimatedHeight(firstPage));
          if (moved.canSplit) {
            const splitAllowance = Math.max(0, remainingCapacity - getSectionPadding(moved.type));
            if (splitAllowance > 60) {
              const parts = splitLongContent(moved.content, moved.type, splitAllowance);
              if (parts.length > 1) {
                const firstPartHeight = estimateSectionHeight(parts[0], moved.type);
                const previousSection = firstPage[candidateIndex - 1];
                const suppressTitle = previousSection && previousSection.type === moved.type;
                const firstPart = {
                  ...moved,
                  content: parts[0],
                  estimatedHeight: firstPartHeight,
                  isContinued: true,
                  _suppressTitle: suppressTitle
                };
                firstPage.splice(candidateIndex, 0, firstPart);
                const targetPage = getOrCreateContinuationPage();
                for (let partIdx = parts.length - 1; partIdx >= 1; partIdx -= 1) {
                  const remainderContent = parts[partIdx];
                  const partHeight = estimateSectionHeight(remainderContent, moved.type);
                  const isLast = partIdx === parts.length - 1;
                  targetPage.unshift({
                    ...moved,
                    content: remainderContent,
                    estimatedHeight: partHeight,
                    isContinuation: true,
                    isContinued: !isLast,
                    _suppressTitle: false
                  });
                }
                firstHeight = sumEstimatedHeight(firstPage);
                continue;
              }
            }
          }
          const targetPage = getOrCreateContinuationPage();
          targetPage.unshift(moved);
          firstHeight = sumEstimatedHeight(firstPage);
        }
      }
      for (let i = newPages.length - 1; i >= 0; i -= 1) {
        if (!newPages[i] || newPages[i].length === 0) {
          newPages.splice(i, 1);
        }
      }
      if (newPages.length > 1 && newPages[0].length === 1 && newPages[0][0]?.type === 'header') {
        newPages[1].unshift(newPages[0][0]);
        newPages.shift();
      }
      if (DEBUG_PAGINATION) {
        console.log('[Pagination] attorney page structure', newPages.map((pageSections, pageIdx) => ({
          page: pageIdx + 1,
          types: pageSections.map((section) => section.type),
          totalEstimated: pageSections.reduce((acc, section) => acc + (section?.estimatedHeight || 0), 0),
        })));
      }
      return newPages;
    }
    if (newPages.length > 1) {
      const minUsefulHeight = effectiveAvailableHeight * (useConservativePaging ? 0.42 : 0.38);
      const mergeAllowance = Math.max(12, effectiveAvailableHeight * (useConservativePaging ? 0.2 : 0.25));
      const lastIndex = newPages.length - 1;
      const lastPage = newPages[lastIndex];
      const prevPage = newPages[lastIndex - 1];
      const lastHeight = sumEstimatedHeight(lastPage);
      const prevHeight = sumEstimatedHeight(prevPage);
      if (lastHeight > 0 && lastHeight < minUsefulHeight && (prevHeight + lastHeight) <= (effectiveAvailableHeight + mergeAllowance)) {
        const cleanedSections = lastPage.map((section) => ({
          ...section,
          isContinuation: false,
          isContinued: false
        }));
        newPages[lastIndex - 1] = [...prevPage, ...cleanedSections];
        newPages.pop();
      }
      // Rebalance: try to reclaim unused space by pulling the next page's leading
      // section forward when it fits. This keeps ordering intact but avoids leaving
      // small blocks (like SKILLS) stranded on a new page.
      for (let i = 0; i < newPages.length - 1; i++) {
        const page = newPages[i];
        const next = newPages[i + 1];
        if (!page || !next || next.length === 0) {
          if (DEBUG_PAGINATION) {
            console.log('[Pagination] skip iteration ? missing next page', { pageIndex: i, hasPage: Boolean(page), hasNext: Boolean(next), nextLength: next ? next.length : 0 });
          }
          continue;
        }

        const nextFirst = next[0];
        if (!nextFirst) {
          if (DEBUG_PAGINATION) console.log('[Pagination] skip iteration ? no leading section', { pageIndex: i });
          continue;
        }

        const pageHeight = sumEstimatedHeight(page);
        const trailingPadding = page.length ? getSectionPadding(page[page.length - 1].type) : 0;
        const adjustedPageHeight = Math.max(0, pageHeight - trailingPadding);
        const available = effectiveAvailableHeight - adjustedPageHeight;
        if (DEBUG_PAGINATION) {
          console.log('[Pagination] available space check', { pageIndex: i, pageHeight, trailingPadding, adjustedPageHeight, available, effectiveAvailableHeight });
        }
        if (available < 8) {
          if (DEBUG_PAGINATION) console.log('[Pagination] skip iteration ? not enough space', { pageIndex: i, available });
          continue;
        }

        const lastType = page.length ? page[page.length - 1].type : null;
        const sameTypeContinuation = Boolean(lastType && nextFirst.type === lastType);
        const sectionTitleHeightPx = Math.round(24 * getFontSizeScaleFactor());
        const baseEstimate = nextFirst.estimatedHeight;
        const adjustedEstimate = sameTypeContinuation ? Math.max(0, baseEstimate - sectionTitleHeightPx) : baseEstimate;
        const requiredHeight = addBuffer(adjustedEstimate, nextFirst.type);

        const softAllowance = nextFirst.type === 'education' ? (isIndustryManagerFormat ? 64 : 42)
          : nextFirst.type === 'summary' ? 28
          : nextFirst.type === 'skills' ? 40
          : 24;

        const fits = requiredHeight <= (available + softAllowance);

        if (DEBUG_PAGINATION) {
          console.log('[Pagination] considering pull-forward', { pageIndex: i, nextType: nextFirst.type, availableSpace: available, requiredHeight, softAllowance, sameTypeContinuation, canSplit: nextFirst.canSplit, effectiveAvailableHeight, adjustedPageHeight, currentPageHeight: sumEstimatedHeight(page) });
        }

        if (fits) {
          page.push({ ...nextFirst, estimatedHeight: adjustedEstimate, _suppressTitle: sameTypeContinuation });
          next.shift();
          if (!sameTypeContinuation) {
            page[page.length - 1]._suppressTitle = false;
          }
          if (next.length === 0) {
            newPages.splice(i + 1, 1);
          } else {
            i = Math.max(-1, i - 2);
          }
          continue;
        }

        if (sameTypeContinuation && nextFirst.canSplit) {
          const allowance = Math.max(0, available - getSectionPadding(nextFirst.type));
          if (DEBUG_PAGINATION) {
            console.log('[Pagination] considering split', { pageIndex: i, allowance, nextType: nextFirst.type });
          }
          if (allowance > 60) {
            const parts = splitLongContent(nextFirst.content, nextFirst.type, allowance);
            if (parts.length > 1) {
              const firstPartHeight = estimateSectionHeight(parts[0], nextFirst.type);
              page.push({ ...nextFirst, content: parts[0], estimatedHeight: firstPartHeight, isContinued: true, _suppressTitle: true });
              const remainder = parts.slice(1);
              next.shift();
              for (let r = remainder.length - 1; r >= 0; r--) {
                const partHeight = estimateSectionHeight(remainder[r], nextFirst.type);
                const needsTitle = (r === 0);
                const adjPartHeight = needsTitle ? (partHeight + sectionTitleHeightPx) : partHeight;
                next.unshift({ ...nextFirst, content: remainder[r], estimatedHeight: adjPartHeight, isContinuation: true, isContinued: r < remainder.length - 1 });
              }
            }
          }
        }

        if (next.length === 0) {
          if (DEBUG_PAGINATION) console.log('[Pagination] removed empty trailing page', { removedIndex: i + 1 });
          newPages.splice(i + 1, 1);
        }
      }
    }
    // If the last page only contains skills and would fit on the previous page, pull it back.
    for (let i = 0; i < newPages.length - 1; i += 1) {
      const page = newPages[i];
      const next = newPages[i + 1];
      if (!page || !next || next.length !== 1) continue;
      const section = next[0];
      if (!section || section.type !== 'skills' || section.isContinuation) continue;
      const pageHeight = sumEstimatedHeight(page);
      const sectionHeight = addBuffer(section.estimatedHeight, section.type);
      const tolerance = Math.max(32, getSectionPadding(section.type));
      if ((pageHeight + sectionHeight) <= (effectiveAvailableHeight + tolerance)) {
        if (DEBUG_PAGINATION) {
          console.log('[Pagination] pulling skills forward', { pageIndex: i, nextLength: next.length, pageHeight, sectionHeight, tolerance, effectiveAvailableHeight });
        }
        page.push(section);
        newPages.splice(i + 1, 1);
        i = Math.max(-1, i - 2);
      }
    }
    // Pull education forward when whitespace remains on the current page.
    for (let i = 0; i < newPages.length - 1; i += 1) {
      const page = newPages[i];
      const next = newPages[i + 1];
      if (!page || !next || next.length === 0) continue;
      const section = next[0];
      if (!section || section.type !== 'education' || section.isContinuation) continue;
      const pageHeight = sumEstimatedHeight(page);
      const sectionHeight = addBuffer(section.estimatedHeight, section.type);
      const trailingPadding = page.length ? getSectionPadding(page[page.length - 1].type) : 0;
      const adjustedPageHeight = Math.max(0, pageHeight - trailingPadding);
      const tolerance = Math.max(24, getSectionPadding(section.type));
      if ((adjustedPageHeight + sectionHeight) <= (effectiveAvailableHeight + tolerance)) {
        if (DEBUG_PAGINATION) {
          console.log('[Pagination] pulling education forward', { pageIndex: i, nextLength: next.length, adjustedPageHeight, sectionHeight, tolerance, effectiveAvailableHeight, trailingPadding });
        }
        page.push({ ...section, _suppressTitle: false });
        next.shift();
        if (next.length === 0) {
          newPages.splice(i + 1, 1);
        }
        i = Math.max(-1, i - 2);
      }
    }
    // Generic pull forward: try to reclaim space across page boundaries for any section.
    for (let i = 0; i < newPages.length - 1; i += 1) {
      const page = newPages[i];
      const next = newPages[i + 1];
      if (!page || !next || next.length === 0) {
        continue;
      }
      const section = next[0];
      if (!section || section.isContinuation) {
        continue;
      }
      const pageHeight = sumEstimatedHeight(page);
      const trailingPadding = page.length ? getSectionPadding(page[page.length - 1].type) : 0;
      const adjustedPageHeight = Math.max(0, pageHeight - trailingPadding);
      const sectionHeight = addBuffer(section.estimatedHeight, section.type);
      const tolerance = Math.max(24, getSectionPadding(section.type));
      if ((adjustedPageHeight + sectionHeight) <= (effectiveAvailableHeight + tolerance)) {
        if (DEBUG_PAGINATION) {
          console.log('[Pagination] general pull-forward', {
            pageIndex: i,
            sectionType: section.type,
            adjustedPageHeight,
            sectionHeight,
            tolerance,
            effectiveAvailableHeight,
          });
        }
        page.push({ ...section, _suppressTitle: false });
        next.shift();
        if (next.length === 0) {
          newPages.splice(i + 1, 1);
        }
        i = Math.max(-1, i - 2);
      }
    }
    // Ensure header pages are not left empty
    for (let i = 0; i < newPages.length - 1; i += 1) {
      const page = newPages[i];
      const next = newPages[i + 1];
      if (!page || page.length !== 1 || page[0].type !== 'header' || !next || next.length === 0) {
        continue;
      }
      const candidate = next[0];
      const pageHeight = sumEstimatedHeight(page);
      const candidateHeight = addBuffer(candidate.estimatedHeight, candidate.type);
      if ((pageHeight + candidateHeight) <= (effectiveAvailableHeight + getSectionPadding(candidate.type))) {
        if (DEBUG_PAGINATION) {
          console.log('[Pagination] header-only page fix, pulling section forward', {
            sectionType: candidate.type,
            pageIndex: i,
            pageHeight,
            candidateHeight,
            effectiveAvailableHeight,
          });
        }
        page.push({ ...candidate, _suppressTitle: false });
        next.shift();
        if (next.length === 0) {
          newPages.splice(i + 1, 1);
        }
      }
    }
    // Final safety pass: ensure no page exceeds available height.
    // If a page still overflows due to estimation error, move/split the
    // last section forward until it fits.
    for (let i = 0; i < newPages.length; i++) {
      let safetyGuard = 0;
      while (safetyGuard < 20) {
        const pageEstimate = sumEstimatedHeight(newPages[i]);
        if (pageEstimate <= (effectiveAvailableHeight - 4)) {
          break;
        }
        const page = newPages[i];
        if (!page || page.length === 0) {
          break;
        }
        const last = page[page.length - 1];
        if (last && !last.isContinuation && last.type === 'skills') {
          const slackAllowance = effectiveAvailableHeight + 60;
          if (pageEstimate <= slackAllowance) {
            break;
          }
        }
        safetyGuard++;
        const popped = page.pop();
        const current = sumEstimatedHeight(page);
        const allowance = Math.max(0, effectiveAvailableHeight - current - getSectionPadding(popped.type));
        if (popped && popped.canSplit && allowance > 40) {
          const parts = splitLongContent(popped.content, popped.type, allowance);
          if (parts.length > 1) {
            const firstPartHeight = estimateSectionHeight(parts[0], popped.type);
            page.push({ ...popped, content: parts[0], estimatedHeight: firstPartHeight, isContinued: true });
            if (i + 1 >= newPages.length) newPages.push([]);
            const remainder = parts.slice(1);
            for (let k = 0; k < remainder.length; k++) {
              const partHeight = estimateSectionHeight(remainder[k], popped.type);
              newPages[i + 1].unshift({ ...popped, content: remainder[k], estimatedHeight: partHeight, isContinuation: true, isContinued: k < remainder.length - 1 });
            }
            continue;
          }
        }
        if (i + 1 >= newPages.length) newPages.push([]);
        newPages[i + 1].unshift(popped);
      }
    }
    if (newPages.length === 2) {
      const firstPage = newPages[0];
      const secondPage = newPages[1];
      const firstPageTotal = firstPage.reduce((acc, section) => acc + (section?.estimatedHeight || 0), 0);
      const secondTotal = secondPage.reduce((acc, section) => acc + (section?.estimatedHeight || 0), 0);
      const trailingAllowance = Math.max(32, getSectionPadding(firstPage[firstPage.length - 1]?.type || 'default')) +
        Math.max(16, getSectionPadding(secondPage[0]?.type || 'default'));
      const fitsOnOnePage = false;
      const secondTypes = secondPage.map((section) => section.type);
      const canMergeTypes = secondTypes.length > 0 && secondTypes.every((type) => type === 'skills');
      const safeToMerge = false;
      if (DEBUG_PAGINATION) {
        console.log('[Pagination] post-pass merge evaluation', {
          firstPageTypes: firstPage.map((section) => section.type),
          secondTypes,
          firstPageTotal,
          secondTotal,
          effectiveAvailableHeight,
          trailingAllowance,
          fitsOnOnePage,
          canMergeTypes,
          safeToMerge,
        });
      }
      if (fitsOnOnePage && safeToMerge) {
        if (DEBUG_PAGINATION) {
          console.log('[Pagination] force-merging trailing sections onto page 1');
        }
        secondPage.forEach((section) => {
          firstPage.push({ ...section, _suppressTitle: false });
        });
        newPages.splice(1, 1);
      }
    }
    if (DEBUG_PAGINATION) {
      console.log('[Pagination] final page structure', newPages.map((pageSections, pageIdx) => ({
        page: pageIdx + 1,
        types: pageSections.map((section) => section.type),
        heights: pageSections.map((section) => section.estimatedHeight),
        totalEstimated: pageSections.reduce((acc, section) => acc + (section?.estimatedHeight || 0), 0),
      })));
    }
    if (selectedFormat === TEMPLATE_SLUGS.ATTORNEY_TEMPLATE && newPages.length) {
      const firstPage = newPages[0];
      let firstHeight = sumEstimatedHeight(firstPage);
      if (firstHeight > (effectiveAvailableHeight - 12)) {
        if (DEBUG_PAGINATION) {
          console.log('[Pagination] attorney template overflow detected, forcing additional page', {
            firstHeight,
            effectiveAvailableHeight,
          });
        }
        if (newPages.length === 1) {
          newPages.push([]);
        }
        while (firstPage.length > 1 && firstHeight > (effectiveAvailableHeight - 12)) {
          const moved = firstPage.pop();
          if (moved) {
            newPages[1].unshift(moved);
          }
          firstHeight = sumEstimatedHeight(firstPage);
        }
      }
    }
    // Safety: avoid header-only leading page
    if (newPages.length > 1 && newPages[0].length === 1 && newPages[0][0]?.type === 'header') {
      if (DEBUG_PAGINATION) {
        console.log('[Pagination] collapsing header-only first page');
      }
      const headerSection = newPages[0][0];
      newPages[1].unshift(headerSection);
      newPages.shift();
    }
    if (newPages.length > 1) {
      for (let i = 1; i < newPages.length; i++) {
        const prevPage = newPages[i - 1];
        const currentPageSections = newPages[i];
        if (!prevPage || !currentPageSections || currentPageSections.length === 0) {
          continue;
        }
        let slackIterations = 0;
        while (currentPageSections.length > 0 && slackIterations < 5) {
          const prevHeight = sumEstimatedHeight(prevPage);
          const availableSpace = effectiveAvailableHeight - prevHeight;
          if (availableSpace <= 28) {
            break;
          }
          const candidate = currentPageSections[0];
          if (!candidate) {
            break;
          }
          const requiredSpace = addBuffer(candidate.estimatedHeight, candidate.type);
          const maxSectionHeight = Math.max(48, effectiveAvailableHeight * (useConservativePaging ? 0.28 : 0.35));
          if (requiredSpace <= availableSpace - 8 && candidate.estimatedHeight <= maxSectionHeight) {
            if (DEBUG_PAGINATION) {
              console.log('[Pagination] pulling section forward to reduce slack', {
                fromPage: i + 1,
                sectionType: candidate.type,
                requiredSpace,
                availableSpace,
                effectiveAvailableHeight,
              });
            }
            prevPage.push({ ...candidate, _suppressTitle: false });
            currentPageSections.shift();
            slackIterations++;
            continue;
          }
          break;
        }
      }
      for (let i = newPages.length - 1; i >= 0; i--) {
        if (newPages[i] && newPages[i].length === 0) {
          newPages.splice(i, 1);
        }
      }
    }
    if (newPages.length === 1) {
      const firstPage = newPages[0];
      const baseLimit = effectiveAvailableHeight - 2;
      const aggressiveLimit = effectiveAvailableHeight + (effectiveAvailableHeight * 0.35);
      let totalEstimate = sumEstimatedHeight(firstPage);
      if (firstPage && firstPage.length > 1 && totalEstimate > aggressiveLimit) {
        const fallbackPage = [];
        while (firstPage.length > 1 && totalEstimate > baseLimit) {
          const moved = firstPage.pop();
          if (!moved) {
            break;
          }
          fallbackPage.unshift(moved);
          totalEstimate = sumEstimatedHeight(firstPage);
        }
        if (fallbackPage.length > 0) {
          newPages.push(fallbackPage);
          if (DEBUG_PAGINATION) {
            console.log('[Pagination] fallback split triggered due to estimated overflow', {
              totalEstimate,
              baseLimit,
              fallbackLength: fallbackPage.length,
            });
          }
        }
      }
    }
    return newPages;
  };
  // Recalculate pages when data changes
  useEffect(() => {
    const newPages = splitContentIntoPages();
    setPages(newPages);
  }, [data, useConservativePaging]);

  useEffect(() => {
    if (DEBUG_PAGINATION) {
      console.log('[Pagination] pages state updated', pages.map((pageSections, pageIdx) => ({
        page: pageIdx + 1,
        types: pageSections.map((section) => section.type),
        totalEstimated: pageSections.reduce((acc, section) => acc + (section?.estimatedHeight || 0), 0),
      })));
    }
  }, [pages, DEBUG_PAGINATION]);
  useEffect(() => {
    const node = contentRef.current;
    if (!node) {
      return;
    }
    if (pages.length > 1) {
      return;
    }
    const enableThreshold = AVAILABLE_HEIGHT + 12;
    const disableThreshold = Math.round(AVAILABLE_HEIGHT * 0.92);
    const checkOverflow = () => {
      if (!node.isConnected) {
        return;
      }
      const actualHeight = node.scrollHeight;
      if (!useConservativePaging && actualHeight > enableThreshold) {
        setUseConservativePaging(true);
      } else if (useConservativePaging && actualHeight < disableThreshold) {
        setUseConservativePaging(false);
      }
    };
    const raf = requestAnimationFrame(checkOverflow);
    return () => cancelAnimationFrame(raf);
  }, [pages, data, useConservativePaging]);
  if (!isVisible) {
    return null;
  }
  // Format styles copied exactly from StepFormat.jsx templates - scaled up for live preview
  const getFormatStyles = (format, fontSize = 'medium') => {
    // Base scale factor for preview (2x for readability)
    const baseScaleFactor = 2;
    
    // Font size multipliers (visible size increase)
    const fontSizeMultipliers = {
      'small': 1.0,
      'medium': 1.2,
      'large': 1.5,
      'extra-large': 1.8
    };
    
    // Combined scale factor
    const scaleFactor = baseScaleFactor * (fontSizeMultipliers[fontSize] || fontSizeMultipliers['medium'])
    
    switch (format) {
      case TEMPLATE_SLUGS.CLASSIC_PROFESSIONAL:
        // Classic Professional - exactly like StepFormat classic-professional
        return {
          container: { 
            fontFamily: 'Calibri, Arial, sans-serif', 
            // Normalize base body size across templates to keep preview consistent
            fontSize: `${6 * scaleFactor}px`, 
            lineHeight: '1.2',
            padding: '16px 16px 0 16px',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            overflow: 'visible' // Changed from 'hidden' for full preview
          },
          header: { 
            textAlign: 'center', 
            fontWeight: 'bold', 
            fontSize: `${10 * scaleFactor}px`, 
            marginBottom: `${3 * scaleFactor}px`, 
            color: '#1f2937'
          },
          contact: { 
            textAlign: 'center', 
            color: '#6b7280', 
            fontSize: `${6 * scaleFactor}px`, 
            marginBottom: `${6 * scaleFactor}px`
          },
          sectionTitle: { 
            color: '#1f2937', 
            fontWeight: 'bold', 
            fontSize: `${8.4 * scaleFactor}px`,  // More prominent section headings
            marginBottom: `${2.5 * scaleFactor}px`, 
            borderBottom: '1px solid #000', 
            paddingBottom: `${1.5 * scaleFactor}px`, 
            textAlign: 'left'
          },
          company: { 
            color: '#374151', 
            fontWeight: 'bold', 
            fontSize: `${6 * scaleFactor}px`
          },
          bullet: { 
            color: '#374151', 
            fontSize: `${6 * scaleFactor}px`, 
            marginLeft: `${4 * scaleFactor}px`, 
            marginBottom: `${2 * scaleFactor}px`
          },
          summary: { 
            color: '#374151', 
            fontSize: `${6 * scaleFactor}px`, 
            marginBottom: `${4 * scaleFactor}px`
          },
          skills: {
            color: '#374151',
            fontSize: `${5.5 * scaleFactor}px`
          },
          item: { marginTop: `${3 * scaleFactor}px` }
        };
      case TEMPLATE_SLUGS.EXECUTIVE_SERIF: {
        const markerWidth = 9 * scaleFactor;
        const gapWidth = 3.5 * scaleFactor;
        const indent = markerWidth + gapWidth;
        // Normalize typography to match the other templates
        const sectionTitleFont = 8.2 * scaleFactor;
        const headerLineFont = 6.0 * scaleFactor;
        const bodyFont = 6.0 * scaleFactor;
        const bulletFont = 6.0 * scaleFactor;
        return {
          // Expose indent so other renderers (e.g., PDF transformer) have the exact value
          indentPx: indent,
          container: {
            fontFamily: "'Noto Serif', Georgia, serif",
            fontSize: `${bodyFont}px`,
            lineHeight: '1.2',
            padding: '16px 16px 18px 16px',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            overflow: 'visible'
          },
          header: {
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: `${10 * scaleFactor}px`,
            marginBottom: `${4 * scaleFactor}px`,
            color: '#2A7B88'
          },
          contact: {
            textAlign: 'center',
            color: '#7f8c8d',
            fontSize: `${6 * scaleFactor}px`,
            marginBottom: `${6 * scaleFactor}px`
          },
          sectionTitleBullet: '●',
          sectionTitle: {
            color: '#2A7B88',
            fontWeight: 'bold',
            fontSize: `${sectionTitleFont}px`,
            marginBottom: `${2 * scaleFactor}px`,
            textTransform: 'capitalize',
            paddingLeft: `${indent}px`,
            textIndent: `-${indent}px`,
            letterSpacing: '0.3px'
          },
          sectionContent: {
            marginBottom: `${2 * scaleFactor}px`
          },
          headerBulletChar: '●',
          company: {
            fontWeight: 'bold',
            fontSize: `${headerLineFont}px`,
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
            paddingLeft: `${indent}px`,
            textIndent: `-${indent}px`,
            color: '#2c3e50'
          },
          bullet: {
            display: 'flex',
            alignItems: 'flex-start',
            marginBottom: `${1.5 * scaleFactor}px`
          },
          bulletMarker: {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: `${markerWidth}px`,
            minWidth: `${markerWidth}px`,
            fontSize: `${bulletFont}px`,
            color: '#39A5B7',
            lineHeight: '1.2',
            // Use same horizontal gap as section title so text aligns
            marginRight: `${gapWidth}px`
          },
          bulletText: {
            flex: 1,
            fontSize: `${bodyFont}px`,
            color: '#374151',
            lineHeight: '1.3'
          },
          bulletMarkerChar: '▪',
          summary: {
            color: '#374151',
            fontSize: `${bodyFont}px`,
            marginBottom: `${4 * scaleFactor}px`
          },
          skills: {
            color: '#374151',
            fontSize: `${bodyFont}px`
          },
          skillsGrid: {
            display: 'block',
            width: '100%',
            marginTop: `${2 * scaleFactor}px`
          },
          skillsColumn: {
            display: 'inline-block',
            verticalAlign: 'top',
            listStyle: 'none',
            padding: 0,
            margin: 0,
            width: '50%',
            boxSizing: 'border-box',
            wordBreak: 'break-word',
            overflowWrap: 'anywhere'
          },
          skillsColumnSpacing: `${8 * scaleFactor}px`,
          skillItem: {
            display: 'flex',
            alignItems: 'flex-start',
            marginBottom: `${2 * scaleFactor}px`
          },
          skillMarker: {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: `${markerWidth}px`,
            minWidth: `${markerWidth}px`,
            fontSize: `${bulletFont}px`,
            color: '#39A5B7',
            lineHeight: '1.2',
            // Keep skills alignment consistent with section/bullet text
            marginRight: `${gapWidth}px`
          },
          skillText: {
            flex: 1,
            fontSize: `${bodyFont}px`,
            color: '#374151',
            lineHeight: '1.3',
            wordBreak: 'break-word',
            overflowWrap: 'anywhere'
          },
          skillMarkerChar: '•',
          item: { marginTop: `${3 * scaleFactor}px` }
        };
      }
      case TEMPLATE_SLUGS.ATTORNEY_TEMPLATE: {
        const palette = {
          headerBg: '#DCC3AE',
          sidebarBg: 'transparent',
          accent: '#3C2E27',
          body: '#443730',
          highlight: '#B68A65',
          divider: '#E5D1C0'
        };
        const contentGap = 4 * scaleFactor;
        const headingGap = 5 * scaleFactor;
        const contentIndent = 0;
        return {
          container: {
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: `${5.4 * scaleFactor}px`,
            lineHeight: '1.35',
            padding: 0,
            background: '#ffffff',
            border: `1px solid ${palette.divider}`,
            borderRadius: '6px',
            overflow: 'visible',
            color: palette.body
          },
          headerArea: {
            background: palette.headerBg,
            padding: `${12 * scaleFactor}px ${18 * scaleFactor}px`,
            borderBottom: `5px solid ${palette.highlight}`
          },
          headerName: {
            fontSize: `${11 * scaleFactor}px`,
            fontWeight: 700,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: palette.accent
          },
          headerTitle: {
            marginTop: `${3 * scaleFactor}px`,
            fontSize: `${7.2 * scaleFactor}px`,
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            color: palette.accent
          },
          columns: {
            display: 'grid',
            gridTemplateColumns: '35% 65%',
            width: '100%',
            minHeight: `${320 * scaleFactor}px`,
            boxSizing: 'border-box'
          },
          sidebar: {
            background: 'transparent',
            color: palette.body,
            padding: `${16 * scaleFactor}px ${14 * scaleFactor}px`,
            display: 'flex',
            flexDirection: 'column',
            gap: `${12 * scaleFactor}px`,
            boxSizing: 'border-box',
            minWidth: 0,
            borderRight: `1px solid ${palette.divider}`
          },
          sidebarSection: {
            display: 'flex',
            flexDirection: 'column',
            gap: `${4 * scaleFactor}px`
          },
          sidebarHeading: {
            display: 'flex',
            alignItems: 'center',
            gap: `${headingGap}px`,
            fontSize: `${6 * scaleFactor}px`,
            fontWeight: 700,
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            color: palette.accent
          },
          sidebarHeadingBullet: {
            color: palette.highlight,
            fontWeight: 700,
            fontSize: `${6 * scaleFactor}px`,
            lineHeight: 1
          },
          sidebarHeadingText: {
            flex: 1
          },
          sidebarContent: {
            paddingLeft: `${contentIndent}px`,
            display: 'flex',
            flexDirection: 'column',
            gap: `${4 * scaleFactor}px`
          },
          sidebarBody: {
            fontSize: `${5.2 * scaleFactor}px`,
            lineHeight: 1.6,
            color: palette.body,
            whiteSpace: 'pre-line',
            wordBreak: 'break-word',
            overflowWrap: 'anywhere'
          },
          sidebarList: {
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'grid',
            gap: `${4 * scaleFactor}px`
          },
          sidebarListItem: {
            display: 'flex',
            alignItems: 'flex-start',
            gap: `${6 * scaleFactor}px`,
            fontSize: `${5.2 * scaleFactor}px`,
            color: palette.body,
            lineHeight: 1.5
          },
          contactIcon: {
            color: palette.highlight,
            fontWeight: 700,
            fontSize: `${5.2 * scaleFactor}px`,
            marginTop: `${0.4 * scaleFactor}px`
          },
          contactText: {
            flex: 1,
            wordBreak: 'break-word',
            minWidth: 0
          },
          sidebarBullet: {
            color: palette.highlight,
            marginRight: `${3 * scaleFactor}px`,
            fontWeight: 700
          },
          main: {
            flex: 1,
            padding: `${18 * scaleFactor}px ${20 * scaleFactor}px`,
            display: 'flex',
            flexDirection: 'column',
            gap: `${14 * scaleFactor}px`,
            boxSizing: 'border-box',
            minWidth: 0
          },
          mainSection: {
            display: 'flex',
            flexDirection: 'column',
            gap: `${4 * scaleFactor}px`
          },
          mainHeading: {
            display: 'flex',
            alignItems: 'center',
            gap: `${headingGap}px`,
            borderBottom: `1px solid ${palette.divider}`,
            paddingBottom: `${4 * scaleFactor}px`
          },
          mainHeadingBullet: {
            color: palette.highlight,
            fontWeight: 700,
            fontSize: `${7.4 * scaleFactor}px`,
            lineHeight: 1
          },
          mainHeadingText: {
            fontSize: `${7.4 * scaleFactor}px`,
            fontWeight: 700,
            letterSpacing: '1.6px',
            textTransform: 'uppercase',
            color: palette.accent
          },
          mainContent: {
            paddingLeft: `${contentIndent}px`,
            display: 'flex',
            flexDirection: 'column',
            gap: `${contentGap}px`
          },
          company: {
            fontSize: `${5.6 * scaleFactor}px`,
            fontWeight: 600,
            color: palette.accent,
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
            marginBottom: `${1 * scaleFactor}px`
          },
          date: {
            fontSize: `${5 * scaleFactor}px`,
            color: palette.body,
            fontStyle: 'italic',
            marginBottom: `${1 * scaleFactor}px`
          },
          bullet: {
            fontSize: `${5.2 * scaleFactor}px`,
            color: palette.body,
            marginLeft: 0,
            marginBottom: `${contentGap}px`,
            lineHeight: 1.5
          },
          item: {
            marginTop: `${contentGap}px`
          },
          summary: {
            fontSize: `${5.2 * scaleFactor}px`,
            color: palette.body,
            lineHeight: 1.6
          },
          skills: {
            fontSize: `${5.2 * scaleFactor}px`,
            color: palette.body,
            lineHeight: 1.5
          },
          sectionTitle: {
            fontSize: `${7.4 * scaleFactor}px`,
            fontWeight: 700,
            letterSpacing: '1.6px',
            color: palette.accent,
            borderBottom: `1px solid ${palette.divider}`,
            paddingBottom: `${4 * scaleFactor}px`,
            textTransform: 'uppercase'
          },
          skillMarkerChar: '•',
          skillMarker: {
            color: palette.highlight,
            fontWeight: 700,
            width: `${8 * scaleFactor}px`,
            display: 'inline-flex',
            justifyContent: 'center'
          },
          skillText: {
            color: palette.body
          },
          skillsColumnSpacing: `${10 * scaleFactor}px`,
          accentColor: palette.accent,
          accentSecondary: palette.highlight
        };
      }
      case TEMPLATE_SLUGS.MODERN_CLEAN:
        // Contemporary Tech - exactly like StepFormat modern
        return {
          container: { 
            fontFamily: 'Segoe UI, sans-serif', 
            // Normalize body size to align with other templates
            fontSize: `${6 * scaleFactor}px`, 
            lineHeight: '1.15',
            padding: '16px 16px 0 16px',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            overflow: 'visible'
          },
          headerContainer: {
            borderBottom: '3px solid #3498db', 
            paddingBottom: `${4 * scaleFactor}px`, 
            marginBottom: `${4 * scaleFactor}px`
          },
          header: { 
            fontWeight: '600', 
            fontSize: `${10 * scaleFactor}px`, 
            marginBottom: `${2 * scaleFactor}px`, 
            color: '#2c3e50',
            textAlign: 'center'
          },
          contact: { 
            color: '#7f8c8d', 
            fontSize: `${6 * scaleFactor}px`,
            textAlign: 'center'
          },
          sectionTitle: { 
            color: '#3498db', 
            fontWeight: '600', 
            fontSize: `${8.6 * scaleFactor}px`,  // Larger section headings
            marginBottom: `${2.5 * scaleFactor}px`, 
            textTransform: 'uppercase', 
            letterSpacing: '1px', 
            borderBottom: '1px solid #000', 
            paddingBottom: `${1.5 * scaleFactor}px`, 
            textAlign: 'left'
          },
          company: { 
            color: '#2c3e50', 
            fontWeight: '600', 
            fontSize: `${6 * scaleFactor}px`
          },
          bullet: { 
            color: '#374151', 
            fontSize: `${6 * scaleFactor}px`, 
            marginLeft: `${3.5 * scaleFactor}px`, 
            marginBottom: `${Math.max(2, 1.3 * scaleFactor)}px`
          },
          summary: { 
            color: '#374151', 
            fontSize: `${6 * scaleFactor}px`, 
            marginBottom: `${3 * scaleFactor}px`
          },
          skills: { 
            color: '#374151', 
            fontSize: `${6 * scaleFactor}px`,
            lineHeight: '1.35'
          },
          item: { marginTop: `${Math.max(2, 2.4 * scaleFactor)}px` }
        };
      
             default:
         // Default to Classic Professional
         return getFormatStyles(DEFAULT_TEMPLATE_ID, fontSize);
    }
  };
  const renderBulletLine = (line, key, styles) => {
    if (!line || !line.trim()) return null;
    const cleaned = line.trim().replace(/^[\u2022\u25AA-]+\s*/, '');
    if (!cleaned) return null;
    if (selectedFormat === TEMPLATE_SLUGS.EXECUTIVE_SERIF) {
      // Revert: render marker + text using flex, same as preview
      const containerStyle = styles.bullet || {
        display: 'flex',
        alignItems: 'flex-start',
        marginBottom: '6px'
      };
      const markerStyle = styles.bulletMarker || {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '18px',
        minWidth: '18px',
        fontSize: '11px',
        color: '#39A5B7',
        lineHeight: '1.2',
        marginRight: '8px'
      };
      const textStyle = styles.bulletText || {
        flex: 1,
        fontSize: '11px',
        color: '#374151',
        lineHeight: '1.3'
      };
      const markerChar = styles.bulletMarkerChar || '▪';
      // Include the computed indent as a data attribute so PDF transformer
      // can align text precisely without depending on computed widths.
      const indentAttr = (styles.indentPx != null) ? String(styles.indentPx) : undefined;
      return (
        <div key={key} style={containerStyle} className="es-bullet" data-es-indent={indentAttr}>
          <span style={markerStyle} className="es-bullet-marker">{markerChar}</span>
          <span style={textStyle} className="es-bullet-text">{cleaned}</span>
        </div>
      );
    }
    return (
      <div key={key} style={styles.bullet}>
        • {cleaned}
      </div>
    );
  };
const parseSkills = (value) => {
  const toArray = (input) =>
    input
      .replace(/\r?\n/g, ',')
      .split(/[,;]+/)
      .map((skill) => skill.trim())
      .filter(Boolean);

  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        if (typeof item === "string") return toArray(item);
        return toArray(toText(item));
      });
  }
  return toArray(String(value));
};
  const renderSkillsSection = (skills, styles) => {
    if (!skills || skills.length === 0) return null;
    const isIndustryManager = selectedFormat === TEMPLATE_SLUGS.EXECUTIVE_SERIF;
    if (isIndustryManager) {
      const columnCount = 2;
      const itemsPerColumn = Math.ceil(skills.length / columnCount);
      const columns = Array.from({ length: columnCount }, (_, columnIndex) =>
        skills.slice(columnIndex * itemsPerColumn, (columnIndex + 1) * itemsPerColumn)
      );
      const activeColumns = columns.filter((column) => column.length > 0);
      const columnCountResolved = activeColumns.length || 1;
      const skillMarkerChar = styles.skillMarkerChar || '▪';
      const columnGap = styles.skillsColumnSpacing || '12pt';
      const rowGap = styles.skillRowGap || '8pt';
      const markerStyle = {
        ...(styles.skillMarker || {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '18px',
          minWidth: '18px',
          fontSize: '11px',
          color: '#39A5B7',
          lineHeight: '1.2',
        }),
        marginRight: 0,
      };
      const textStyle = {
        ...(styles.skillText || {
          flex: 1,
          fontSize: '11px',
          color: '#374151',
          lineHeight: '1.3',
        }),
        flex: 1,
        minWidth: 0,
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
      };
      const baseItemStyle = {
        ...(styles.skillItem || {}),
      };
      baseItemStyle.display = 'flex';
      baseItemStyle.alignItems = baseItemStyle.alignItems || 'flex-start';
      if (!('gap' in baseItemStyle)) {
        baseItemStyle.gap = columnGap;
      }
      if (!('margin' in baseItemStyle) && !('marginBottom' in baseItemStyle)) {
        baseItemStyle.margin = 0;
      }
      const gridStyle = {
        ...(styles.skillsGrid || {}),
        display: 'grid',
        gridTemplateColumns: `repeat(${columnCountResolved}, minmax(0, 1fr))`,
        columnGap,
        rowGap,
        width: '100%',
      };
      return (
        <div style={gridStyle}>
          {activeColumns.map((column, columnIdx) => {
            const columnStyle = {
              ...(styles.skillsColumn || {}),
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: rowGap,
              minWidth: 0,
            };
            return (
              <ul key={columnIdx} style={columnStyle}>
                {column.map((skill, skillIdx) => (
                  <li
                    key={`${columnIdx}-${skillIdx}`}
                    style={{
                      ...(styles.skillItem || {}),
                      ...baseItemStyle,
                    }}
                  >
                    <span style={markerStyle}>{skillMarkerChar}</span>
                    <span style={textStyle}>{skill}</span>
                  </li>
                ))}
              </ul>
            );
          })}
        </div>
      );
    }
    return <div style={styles.skills}>{skills.join(', ')}</div>;
  };
  const renderSummaryContent = (value, styles) => {
    const summaryText = toText(value);
    if (!summaryText) {
      return null;
    }
    const summaryStyle = {
      ...styles.summary,
      whiteSpace: 'pre-wrap',
      overflowWrap: styles.summary?.overflowWrap || 'anywhere',
      wordBreak: styles.summary?.wordBreak || 'break-word',
      hyphens: styles.summary?.hyphens || 'auto',
      maxWidth: '100%',
      display: 'block'
    };
    return (
      <div className="live-preview-summary" style={summaryStyle}>
        {summaryText}
      </div>
    );
  };
  // Render experience items
const renderExperiences = (experiences, styles) => {
  if (!experiences || experiences.length === 0) return null;
  const isIndustryManager = selectedFormat === TEMPLATE_SLUGS.EXECUTIVE_SERIF;
  const isAttorneyTemplate = selectedFormat === TEMPLATE_SLUGS.ATTORNEY_TEMPLATE;
  const normalizeRange = (start, end, currentlyWorking) => {
    if (!start && !end) return '';
    const separator = isIndustryManager ? ' – ' : ' - ';
    if (start && end) return `${start}${separator}${end}`;
    if (start && currentlyWorking) return `${start}${separator}Present`;
    return start || end || '';
  };
  const formatHeaderSegments = (segments, upper = false) => {
    const cleaned = segments
      .filter(Boolean)
      .map((segment) => segment.replace(/\s+-\s+/g, ' – ').trim());
    const separator = upper ? ' | ' : ' • ';
    return cleaned.join(separator);
  };
  return experiences
    .map((exp, idx) => {
      if (typeof exp === 'string') {
        const lines = exp.split(/\r?\n/);
        const headerLine = (lines[0] || '').trim();
        const descriptionLines = lines.slice(1);
        if (!headerLine && descriptionLines.filter((line) => line.trim()).length === 0) {
          return null;
        }
        const headerParts = headerLine.split('|').map((part) => part.trim());
        const jobTitle = headerParts[0] || headerLine || 'Job Title';
        const company = headerParts[1] || '';
        const location = headerParts[2] || '';
        const datePart = headerParts[3] || '';
        const headerText = isIndustryManager
          ? formatHeaderSegments([jobTitle, company, location, datePart], true)
          : jobTitle;
        const secondaryLine = (!isIndustryManager && !isAttorneyTemplate)
          ? formatHeaderSegments([company, location, datePart])
          : '';
        const attorneyPrimary = isAttorneyTemplate
          ? [jobTitle, datePart].filter(Boolean).join(' • ')
          : null;
        const attorneySecondary = isAttorneyTemplate
          ? [company, location].filter(Boolean).join(' • ')
          : null;
        const descriptionContent = descriptionLines.filter((line) => line.trim()).length > 0
          ? (
              <div style={{ marginTop: '2px' }}>
                {descriptionLines.map((line, lineIdx) =>
                  renderBulletLine(line, `${idx}-${lineIdx}`, styles)
                )}
              </div>
            )
          : null;
        const contentNode = (
          <>
            <div style={styles.company}>{isAttorneyTemplate ? (attorneyPrimary || jobTitle) : headerText}</div>
            {isAttorneyTemplate && attorneySecondary && (
              <div style={styles.date}>{attorneySecondary}</div>
            )}
            {!isAttorneyTemplate && !isIndustryManager && secondaryLine && (
              <div style={styles.date}>{secondaryLine}</div>
            )}
            {descriptionContent}
          </>
        );
        if (isIndustryManager) {
          const headerBullet = styles.headerBulletChar || '●';
          const itemStyle = styles.item || { marginTop: '6px' };
          return (
            <div
              key={idx}
              style={itemStyle}
            >
              <div style={styles.company}>{`${headerBullet} ${headerText}`}</div>
              {descriptionContent}
            </div>
          );
        }
        return (
          <div key={idx} style={styles.item}>
            {contentNode}
          </div>
        );
      } else {
        const location = exp.city && exp.state
          ? `${toText(exp.city)}, ${toText(exp.state)}`
          : toText(exp.city) || toText(exp.state) || '';
        let startDate = '';
        let endDate = '';
        if (exp.startDate) {
          const startDateObj = new Date(exp.startDate);
          startDate = startDateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', timeZone: 'UTC' });
        }
        if (exp.endDate && !exp.currentlyWorking) {
          const endDateObj = new Date(exp.endDate);
          endDate = endDateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', timeZone: 'UTC' });
        }
        const dateRange = normalizeRange(startDate, endDate, exp.currentlyWorking);
        const jobTitle = toText(exp.jobTitle) || 'Job Title';
        const companyName = toText(exp.company) || 'Company';
        const locationLabel = exp.remote ? 'Remote' : location;
        const headerText = isIndustryManager
          ? formatHeaderSegments([jobTitle, companyName, locationLabel, dateRange], true)
          : formatHeaderSegments([jobTitle, companyName, locationLabel, dateRange]);
        const secondaryLine = (!isIndustryManager && !isAttorneyTemplate)
          ? formatHeaderSegments([companyName, locationLabel, dateRange])
          : '';
        const attorneyPrimary = isAttorneyTemplate
          ? [jobTitle, dateRange].filter(Boolean).join(' • ')
          : null;
        const attorneySecondary = isAttorneyTemplate
          ? [companyName, locationLabel].filter(Boolean).join(' • ')
          : null;
        const descriptionContent = exp.description
          ? (
              <div style={{ marginTop: '2px' }}>
                {exp.description.split(/\r?\n/).map((line, lineIdx) =>
                  renderBulletLine(line, `${idx}-${lineIdx}`, styles)
                )}
              </div>
            )
          : null;
        if (isIndustryManager) {
          const headerBullet = styles.headerBulletChar || '●';
          const itemStyle = styles.item || { marginTop: '6px' };
          return (
            <div
              key={idx}
              style={itemStyle}
            >
              <div style={styles.company}>{`${headerBullet} ${headerText}`}</div>
              {descriptionContent}
            </div>
          );
        }
        return (
          <div key={idx} style={styles.item}>
            <div style={styles.company}>{isAttorneyTemplate ? (attorneyPrimary || jobTitle) : headerText}</div>
            {!isAttorneyTemplate && secondaryLine && (
              <div style={styles.date}>{secondaryLine}</div>
            )}
            {isAttorneyTemplate && attorneySecondary && (
              <div style={styles.date}>{attorneySecondary}</div>
            )}
            {descriptionContent}
          </div>
        );
      }
    })
    .filter(Boolean);
};
// Render education items - format like original PDF with school and location on same line
const renderEducation = (education, styles) => {
  if (!education) return null;
  const isIndustryManager = selectedFormat === TEMPLATE_SLUGS.EXECUTIVE_SERIF;
  const formatMonthYear = (month, year) => {
    const safeMonth = toText(month);
    const safeYear = toText(year);
    if (safeMonth && safeYear) {
      return `${safeMonth} ${safeYear}`;
    }
    if (safeYear) {
      return safeYear;
    }
    if (safeMonth) {
      return safeMonth;
    }
    return '';
  };
  const normalizeRange = (edu) => {
    const dash = isIndustryManager ? ' – ' : ' - ';
    const startFormatted = formatMonthYear(edu.startMonth, edu.startYear);
    const gradFormatted = formatMonthYear(edu.graduationMonth, edu.graduationYear);
    if (startFormatted && gradFormatted) {
      return `${startFormatted}${dash}${gradFormatted}`;
    }
    if (gradFormatted) {
      return gradFormatted;
    }
    if (startFormatted) {
      return `${startFormatted}${dash}Present`;
    }
    if (edu.graduationYear) {
      const gradYear = parseInt(edu.graduationYear, 10);
      if (!Number.isNaN(gradYear)) {
        return `${gradYear - 4}${dash}${gradYear}`;
      }
      return edu.graduationYear;
    }
    if (edu.startDate && edu.endDate) {
      return `${edu.startDate}${dash}${edu.endDate}`;
    }
    if (edu.endDate) {
      return edu.endDate;
    }
    if (edu.startDate) {
      return `${edu.startDate}${dash}Present`;
    }
    return '';
  };
  const buildIndustryLine = (edu, key) => {
    const degreePart = [toText(edu.degree), edu.field ? toText(edu.field) : '']
      .filter(Boolean)
      .join(' in ');
    const datePart = normalizeRange(edu);
    const locationParts = [
      toText(edu.school),
      [toText(edu.city), toText(edu.state)].filter(Boolean).join(', ')
    ]
      .filter(Boolean)
      .join(', ');
    const segments = [degreePart, datePart, locationParts]
      .filter(Boolean)
      .map((segment) => segment.replace(/\s+-\s+/g, ' – ').toUpperCase());
    if (segments.length === 0) {
      return null;
    }
    return (
      <div key={key} style={styles.educationLine || styles.company}>
        {segments.join(' | ')}
      </div>
    );
  };
  if (isIndustryManager) {
    const items = Array.isArray(education) ? education : [education];
    return items.map((edu, idx) => buildIndustryLine(edu, idx)).filter(Boolean);
  }
  if (Array.isArray(education)) {
    return education.map((edu, idx) => {
      let yearRange = normalizeRange(edu);
      return (
        <div key={idx} style={styles.item}>
          <div style={{ width: '100%', overflow: 'hidden' }}>
            <div style={{ ...styles.company, float: 'left' }}>
              {edu.school || 'University'}
            </div>
            {yearRange && (
              <div
                style={{
                  ...styles.date,
                  fontWeight: 'normal',
                  float: 'right',
                  textAlign: 'right',
                  whiteSpace: 'nowrap',
                }}
              >
                {yearRange}
              </div>
            )}
          </div>
          <div
            style={{
              ...styles.company,
              fontWeight: 'normal',
              marginTop: '2px',
              clear: 'both',
            }}
          >
            {edu.degree} {edu.field && `in ${edu.field}`}
            {edu.gpa && ` • GPA: ${edu.gpa}`}
          </div>
        </div>
      );
    });
  }
  return (
    <div style={styles.item}>
      <div style={{ width: '100%', overflow: 'hidden' }}>
        <div style={{ ...styles.company, float: 'left' }}>Degree</div>
        <div
          style={{
            ...styles.date,
            fontWeight: 'normal',
            float: 'right',
            textAlign: 'right',
            whiteSpace: 'nowrap',
          }}
        >
          University • Year
        </div>
      </div>
      <div
        style={{
          ...styles.company,
          fontWeight: 'normal',
          marginTop: '2px',
          clear: 'both',
        }}
      >
        Degree • Field
      </div>
    </div>
  );
};
  const renderProjects = (projects, styles) => {
    if (!projects || projects.length === 0) return null;
    return projects.map((project, idx) => {
      // Skip empty projects
      if (!project.projectName && !project.description) return null;
      const nameText = toText(project.projectName);
      const techText = toText(project.technologies);
      const urlText = toText(project.projectUrl);
      return (
        <div key={idx} style={styles.item}>
          <div style={styles.company}>
            {nameText}
          </div>
          
          {techText && (
            <div style={{ fontStyle: 'italic', fontSize: '0.9em', marginTop: '2px', marginBottom: '4px' }}>
              Technologies: {techText}
            </div>
          )}
          
          {urlText && (
            <div style={{ fontSize: '0.9em', marginTop: '2px', marginBottom: '4px' }}>
              <a href={urlText} style={{ color: '#0066cc', textDecoration: 'none' }}>
                {urlText}
              </a>
            </div>
          )}
          
          {project.description && (
            <div style={{ marginTop: '2px' }}>
              {project.description.split('\n').map((line, lineIdx) =>
                renderBulletLine(line, `project-${idx}-${lineIdx}`, styles)
              )}
            </div>
          )}
        </div>
      );
    }).filter(Boolean);
  };
  // Render a single section
  const renderSection = (title, content, styles, opts = {}) => {
    if (!content || (Array.isArray(content) && content.length === 0)) {
      return null;
    }
    const isIndustryManager = selectedFormat === TEMPLATE_SLUGS.EXECUTIVE_SERIF;
    const showTitle = opts.showTitle !== false;
    const formatTitle = (raw) => {
      if (!isIndustryManager) return raw;
      const [main, extra] = raw.split('(');
      const mainTitle = main
        .trim()
        .toLowerCase()
        .replace(/(^|\s)([a-z])/g, (match, prefix, letter) => `${prefix}${letter.toUpperCase()}`);
      if (!extra) return mainTitle;
      const normalized = extra.replace(')', '').trim().toLowerCase();
      return `${mainTitle} (${normalized})`;
    };
    const displayTitle = formatTitle(title);
    return (
      <div>
        {showTitle && (
          <div style={styles.sectionTitle}>
            {isIndustryManager ? `${(styles.sectionTitleBullet || '●')} ${displayTitle}` : displayTitle}
          </div>
        )}
        {isIndustryManager && content ? (
          <div style={styles.sectionContent || { paddingLeft: '14pt' }}>{content}</div>
        ) : content}
      </div>
    );
  };
  // Render page content based on section type
  const renderPageContent = (pageSections, styles, pageIndex) => {
    if (isAttorneyFormat) {
      return renderAttorneyPageContent(pageSections, pageIndex);
    }
    return pageSections.map((section, idx) => {
      const prevType = idx > 0 ? pageSections[idx - 1]?.type : null;
      const showTitle = !section._suppressTitle && prevType !== section.type;
      switch (section.type) {
        case 'header':
          return (
            <div key={idx}>
              {(selectedFormat === TEMPLATE_SLUGS.MODERN_CLEAN) ? (
                <div style={styles.headerContainer}>
                  {section.content.name && (
                    <div style={styles.header}>
                      {toText(section.content.name)}
                    </div>
                  )}
                  {(section.content.email || section.content.phone) && (
                    <div style={styles.contact}>
                      {[section.content.email, section.content.phone].map(toText).filter(Boolean).join(' • ')}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {section.content.name && (
                    <div style={styles.header}>
                      {toText(section.content.name)}
                    </div>
                  )}
                  {(section.content.email || section.content.phone) && (
                    <div style={styles.contact}>
                      {[section.content.email, section.content.phone].map(toText).filter(Boolean).join(' • ')}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        case 'summary':
          return <div key={idx}>{renderSection('SUMMARY', renderSummaryContent(section.content, styles), styles, { showTitle })}</div>;
        case 'experience':
          return <div key={idx}>{renderSection('EXPERIENCE', renderExperiences(section.content, styles), styles, { showTitle })}</div>;
        case 'education':
          return <div key={idx}>{renderSection('EDUCATION', renderEducation(section.content, styles), styles, { showTitle })}</div>;
        case 'projects':
          return <div key={idx}>{renderSection('PROJECTS', renderProjects(section.content, styles), styles, { showTitle })}</div>;
        case 'skills': {
          const skills = parseSkills(section.content);
          return <div key={idx}>{renderSection('SKILLS', renderSkillsSection(skills, styles), styles, { showTitle })}</div>;
        }
        default:
          return null;
      }
    });
  };
  const styles = getFormatStyles(selectedFormat || DEFAULT_TEMPLATE_ID, data.selectedFontSize || 'medium');
  const deriveAttorneyLocation = () => {
    const direct = toText(data.location);
    if (direct) return direct;
    if (Array.isArray(data.experiences)) {
      const match = data.experiences.find((exp) => exp && (exp.city || exp.state));
      if (match) {
        const city = toText(match.city);
        const state = toText(match.state);
        if (city && state) return `${city}, ${state}`;
        return city || state || '';
      }
    }
    return '';
  };

  const formatAttorneyEducationDate = (edu) => {
    const gradMonth = toText(edu.graduationMonth);
    const gradYear = toText(edu.graduationYear);
    if (gradMonth && gradYear) return `${gradMonth} ${gradYear}`;
    if (gradYear) return gradYear;
    if (toText(edu.startYear) && toText(edu.endYear)) {
      return `${toText(edu.startYear)} – ${toText(edu.endYear)}`;
    }
    if (toText(edu.startDate) || toText(edu.endDate)) {
      return [toText(edu.startDate), toText(edu.endDate)].filter(Boolean).join(' – ');
    }
    return '';
  };

  const buildAttorneySidebarData = () => {
    const locationValue = deriveAttorneyLocation();
    const contactEntries = [
      data.email ? toText(data.email) : null,
      data.phone ? toText(data.phone) : null,
      locationValue || null
    ].filter(Boolean);

    const educationItems = Array.isArray(data.education)
      ? data.education.filter((edu) =>
          edu && (toText(edu.degree) || toText(edu.school) || toText(edu.field) || toText(edu.graduationYear) || toText(edu.honors))
        )
      : [];

    const skillsList = parseSkills(data.skills);

    return { contactEntries, educationItems, skillsList };
  };

const renderAttorneySummaryBlock = (summaryValue) => {
  const summaryText = toText(summaryValue);
  if (!summaryText) return null;
  return (
    <div style={styles.mainSection}>
        <div style={styles.mainHeading}>
          <span style={styles.mainHeadingBullet}>•</span>
          <span style={styles.mainHeadingText}>Profile</span>
        </div>
        <div style={styles.mainContent}>
          {renderSummaryContent(summaryText, styles)}
        </div>
    </div>
  );
};

  const renderAttorneyExperienceBlock = (experiences, headingLabel) => {
    if (!experiences || experiences.length === 0) return null;
    return (
      <div style={styles.mainSection}>
        <div style={styles.mainHeading}>
          <span style={styles.mainHeadingBullet}>•</span>
          <span style={styles.mainHeadingText}>{headingLabel}</span>
        </div>
        <div style={styles.mainContent}>{renderExperiences(experiences, styles)}</div>
      </div>
    );
  };

  const renderAttorneySidebar = (contactEntries, educationItems, skillsList) => {
    const fontScale = getFontSizeScaleFactor();
    const educationBlockSpacing = `${6 * fontScale}px`;
    return (
      <aside style={styles.sidebar}>
        {contactEntries.length > 0 && (
          <div style={styles.sidebarSection}>
            <div style={styles.sidebarHeading}>
              <span style={styles.sidebarHeadingBullet}>•</span>
              <span style={styles.sidebarHeadingText}>Contact</span>
            </div>
            <div style={styles.sidebarContent}>
              <ul style={styles.sidebarList}>
                {contactEntries.map((entry, idx) => (
                  <li key={`contact-${idx}`} style={styles.sidebarListItem}>
                    <span style={styles.sidebarBullet}>•</span>
                    <span style={styles.contactText}>{entry}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {educationItems.length > 0 && (
          <div style={styles.sidebarSection}>
            <div style={styles.sidebarHeading}>
              <span style={styles.sidebarHeadingBullet}>•</span>
              <span style={styles.sidebarHeadingText}>Education</span>
            </div>
            <div style={styles.sidebarContent}>
              <div style={styles.sidebarBody}>
                {educationItems.map((edu, idx) => {
                  const degreeLine = [toText(edu.degree), toText(edu.field)].filter(Boolean).join(', ');
                  const schoolLine = [toText(edu.school), toText(edu.location)].filter(Boolean).join(' • ');
                  const dateLine = formatAttorneyEducationDate(edu);
                  const honorsLine = toText(edu.honors);
                  return (
                    <div
                      key={`edu-${idx}`}
                      style={{ marginBottom: idx === educationItems.length - 1 ? 0 : educationBlockSpacing }}
                    >
                      {degreeLine && <div style={{ fontWeight: 600 }}>{degreeLine}</div>}
                      {schoolLine && <div>{schoolLine}</div>}
                      {dateLine && <div>{dateLine}</div>}
                      {honorsLine && <div>{honorsLine}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {skillsList.length > 0 && (
          <div style={styles.sidebarSection}>
            <div style={styles.sidebarHeading}>
              <span style={styles.sidebarHeadingBullet}>•</span>
              <span style={styles.sidebarHeadingText}>Key Skills</span>
            </div>
            <div style={styles.sidebarContent}>
              <ul style={styles.sidebarList}>
                {skillsList.map((skill, idx) => (
                  <li key={`skill-${idx}`} style={styles.sidebarListItem}>
                    <span style={styles.sidebarBullet}>•</span>
                    <span style={styles.contactText}>{skill}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </aside>
    );
  };

  const renderAttorneyTemplateContent = () => {
    const name = toText(data.name) || 'Your Name';
    const derivedPosition = toText(data.position);
    const defaultTitle = derivedPosition || '';
    const { contactEntries, educationItems, skillsList } = buildAttorneySidebarData();

    const experiencesContent = data.experiences && data.experiences.length > 0
      ? data.experiences
      : [];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <div style={styles.headerArea}>
          <div style={styles.headerName}>{name}</div>
          {defaultTitle && <div style={styles.headerTitle}>{defaultTitle}</div>}
        </div>
        <div style={styles.columns}>
          {renderAttorneySidebar(contactEntries, educationItems, skillsList)}
          <main style={styles.main}>
            {renderAttorneySummaryBlock(data.summary)}
            {renderAttorneyExperienceBlock(experiencesContent, 'Experience')}
          </main>
        </div>
      </div>
    );
  };

  const flattenAttorneySectionItems = (input) => {
    if (!input) return [];
    if (Array.isArray(input)) {
      return input.reduce((acc, item) => acc.concat(flattenAttorneySectionItems(item)), []);
    }
    return [input];
  };

  const renderAttorneyPageContent = (pageSections, pageIndex) => {
    const headerSection = pageSections.find((section) => section.type === 'header');
    const headerName = toText(headerSection?.content?.name) || toText(data.name) || 'Your Name';
    const headerTitle = toText(data.position);

    const summaryCombined = pageSections
      .filter((section) => section.type === 'summary')
      .map((section) => toText(section.content))
      .filter(Boolean)
      .join('\n\n');

    const experienceItems = pageSections
      .filter((section) => section.type === 'experience')
      .reduce((acc, section) => acc.concat(flattenAttorneySectionItems(section.content)), []);

    const { contactEntries, educationItems, skillsList } = buildAttorneySidebarData();
    const sidebarNode = renderAttorneySidebar(contactEntries, educationItems, skillsList);

    return [
      <div key={`attorney-page-${pageIndex}`} style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <div style={styles.headerArea}>
          <div style={styles.headerName}>{headerName}</div>
          {headerTitle && <div style={styles.headerTitle}>{headerTitle}</div>}
        </div>
        <div style={styles.columns}>
          {sidebarNode}
          <main style={styles.main}>
            {renderAttorneySummaryBlock(summaryCombined)}
            {renderAttorneyExperienceBlock(experienceItems, 'Experience')}
          </main>
        </div>
      </div>
    ];
  };
  const pageContainerStyle = {
    ...(styles?.container || {}),
    overflow: 'visible'
  };
  const singlePageSkills = parseSkills(data.skills);
  // Determine if we should show multiple pages
  const shouldShowMultiPage = pages.length > 1;
  return (
    <div className="live-preview-container">
      {/* Download PDF Button */}
      {onDownload && (
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '20px',
          padding: '15px',
          background: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <button
            onClick={onDownload}
            style={{ 
              backgroundColor: '#ef4444', 
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            📄 Generate Resume
          </button>
          {downloadNotice && (
            <div
              style={{
                marginTop: '12px',
                padding: '12px 16px',
                background: downloadNotice.blocked ? '#fef3c7' : '#e0f2fe',
                borderRadius: '8px',
                border: downloadNotice.blocked ? '1px solid #f59e0b' : '1px solid #38bdf8',
                color: downloadNotice.blocked ? '#92400e' : '#0f172a',
                textAlign: 'left',
                fontSize: '14px',
                lineHeight: '1.5',
              }}
            >
              <div>{downloadNotice.message}</div>
              {downloadNotice.link && (
                <div style={{ marginTop: '8px' }}>
                  <a
                    href={downloadNotice.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: downloadNotice.blocked ? '#b45309' : '#0369a1', textDecoration: 'underline', fontWeight: 600 }}
                  >
                    Open resume manually
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {/* Single Page View */}
      {!shouldShowMultiPage && (
        <div
          ref={contentRef}
          className="single-page-container"
          style={pageContainerStyle}
        >
          {/* Resume Content */}
          {selectedFormat === TEMPLATE_SLUGS.ATTORNEY_TEMPLATE ? (
            renderAttorneyTemplateContent()
          ) : (
            <div style={{ height: 'auto', overflow: 'visible' }}>
              {/* Header - handle modern template's special container */}
              {(selectedFormat === TEMPLATE_SLUGS.MODERN_CLEAN) ? (
                <div style={styles.headerContainer}>
                  {data.name && (
                    <div style={styles.header}>
                      {toText(data.name)}
                    </div>
                  )}
                  {(data.email || data.phone) && (
                    <div style={styles.contact}>
                      {[data.email, data.phone].map(toText).filter(Boolean).join(' • ')}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {data.name && (
                    <div style={styles.header}>
                      {toText(data.name)}
                    </div>
                  )}
                  {(data.email || data.phone) && (
                    <div style={styles.contact}>
                      {[data.email, data.phone].map(toText).filter(Boolean).join(' • ')}
                    </div>
                  )}
                </>
              )}
              {data.summary && (
                renderSection('SUMMARY', renderSummaryContent(data.summary, styles), styles)
              )}
              {data.experiences && data.experiences.length > 0 && (
                renderSection('EXPERIENCE', renderExperiences(data.experiences, styles), styles)
              )}
              {data.projects && data.projects.length > 0 && (
                renderSection('PROJECTS', renderProjects(data.projects, styles), styles)
              )}
              {data.education && (
                renderSection('EDUCATION', renderEducation(data.education, styles), styles)
              )}
              {singlePageSkills.length > 0 && (
                renderSection('SKILLS', renderSkillsSection(singlePageSkills, styles), styles)
              )}
            </div>
          )}
        </div>
      )}
      {/* Multi-Page View - Dynamic Content Splitting */}
      {shouldShowMultiPage && (
        <div className="multi-page-container">
          {pages.map((pageSections, pageIndex) => (
            <div key={pageIndex} className="page-wrapper" style={pageContainerStyle}>
              {/* Page Content - Rendered based on section types */}
              <div className="page-content">
                {renderPageContent(pageSections, styles, pageIndex)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default LivePreview; 






