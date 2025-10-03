import React, { useState, useEffect, useRef } from 'react';
import { useResume } from '../context/ResumeContext';
import { TEMPLATE_SLUGS, DEFAULT_TEMPLATE_ID, normalizeTemplateId } from '../constants/templates';
import './LivePreview.css';
const LivePreview = ({ isVisible = true, onToggle, onDownload, downloadNotice }) => {
  const { data } = useResume();
  const selectedFormat = normalizeTemplateId(data.selectedFormat);
  const [pages, setPages] = useState([]);
  const [useConservativePaging, setUseConservativePaging] = useState(false);
  const isIndustryManagerFormat = (selectedFormat === TEMPLATE_SLUGS.EXECUTIVE_SERIF);
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
  if (!isIndustryManagerFormat) {
    return value;
  }
  const adjustmentSets = {
    // Do not shrink estimates in aggressive mode; slightly inflate instead
    aggressive: {
      header: { multiplier: 1.00, floor: 26 },
      summary: { multiplier: 1.02, floor: 32 },
      experience: { multiplier: 1.06, floor: 100 },
      education: { multiplier: 1.04, floor: 44 },
      projects: { multiplier: 1.06, floor: 68 },
      skills: { multiplier: 1.04, floor: 36 },
      default: { multiplier: 1.02, floor: 32 }
    },
    conservative: {
      header: { multiplier: 1.08, floor: 30 },
      summary: { multiplier: 1.12, floor: 36 },
      experience: { multiplier: 1.15, floor: 115 },
      education: { multiplier: 1.10, floor: 50 },
      projects: { multiplier: 1.15, floor: 78 },
      skills: { multiplier: 1.10, floor: 40 },
      default: { multiplier: 1.10, floor: 36 }
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
              const descCharsPerLine = Math.round(110 / fontScale); // Increased from 90
              const descLines = Math.ceil(exp.description.length / descCharsPerLine);
              height += descLines * Math.round(14 * fontScale); // Reduced from 16
            }
            return total + height + Math.round(6 * fontScale); // Reduced from 8
          }, 0);
          return applyFormatAdjustment(totalHeight, 'experience');
        }
        return applyFormatAdjustment(Math.round(35 * fontScale), 'experience');
      }
      case 'education': {
        if (Array.isArray(content)) {
          const eduHeight = content.length * Math.round(25 * fontScale); // Reduced from 30
          return applyFormatAdjustment(eduHeight, 'education');
        }
        return applyFormatAdjustment(Math.round(25 * fontScale), 'education');
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
        // Estimation aware of executive-serif two-column layout
        const skillsText = toText(content);
        const perLine = Math.round((isIndustryManagerFormat ? 70 : 140) / fontScale);
        const skillLines = Math.ceil(skillsText.length / Math.max(1, perLine));
        const skillsHeight = Math.max(17 * fontScale, skillLines * Math.round(13 * fontScale));
        return applyFormatAdjustment(skillsHeight, 'skills');
      }
      default:
        return applyFormatAdjustment(20, 'default');
    }
  };
  // Split content into pages based on estimated heights
  const splitContentIntoPages = () => {
    const newPages = [];
    let currentPage = [];
    let currentHeight = 0;
    // Get font scale factor to adjust page capacity
    const fontScale = getFontSizeScaleFactor();
    // Adjust available height based on font size - tuned to reduce false overflows
    const pageUtilization = fontScale <= 1.0 ? 0.98  :   // Small
                           fontScale <= 1.2 ? 0.965 :   // Medium (default)
                           fontScale <= 1.5 ? 0.94  :   // Large
                           0.92;                        // Extra-large
    let effectiveAvailableHeight = AVAILABLE_HEIGHT * pageUtilization;
    if (isIndustryManagerFormat && !useConservativePaging) {
      if (fontScale >= 1.5 && fontScale < 1.8) {
        effectiveAvailableHeight = Math.min(effectiveAvailableHeight, AVAILABLE_HEIGHT * 0.9);
      } else if (fontScale >= 1.8) {
        effectiveAvailableHeight = Math.min(effectiveAvailableHeight, AVAILABLE_HEIGHT * 0.88);
      }
    }
    if (isIndustryManagerFormat) {
      const marginByMode = useConservativePaging ? 20 : 12;
      const marginLimit = AVAILABLE_HEIGHT - marginByMode;
      const hardLimit = AVAILABLE_HEIGHT - Math.max(16, Math.floor(marginByMode * 0.75));
      effectiveAvailableHeight = Math.min(effectiveAvailableHeight, marginLimit, hardLimit);
    }
    const basePageBuffer = useConservativePaging ? 18 : 18;
    const bufferedLimit = AVAILABLE_HEIGHT - basePageBuffer;
    effectiveAvailableHeight = Math.min(effectiveAvailableHeight, bufferedLimit);
    const hardPageLimit = AVAILABLE_HEIGHT - (useConservativePaging ? 32 : 36);
    effectiveAvailableHeight = Math.min(effectiveAvailableHeight, hardPageLimit);
    const sectionPadding = {
      header: useConservativePaging ? 8 : 12,
      summary: useConservativePaging ? 12 : 18,
      experience: useConservativePaging ? 14 : 20,
      projects: useConservativePaging ? 14 : 20,
      education: useConservativePaging ? 12 : 18,
      skills: useConservativePaging ? 10 : 16,
      default: useConservativePaging ? 8 : 12
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
        const perLine = Math.max(10, Math.round((isIndustryManagerFormat ? 70 : 140) / fontScale));
        const lineHeight = Math.round(13 * fontScale);
        const itemGap = Math.max(2, Math.round(2 * fontScale));
        // Estimate height for a set of items laid out in columns
        const estimateSetHeight = (arr) => {
          if (arr.length === 0) return 0;
          const colHeights = new Array(columnCount).fill(0);
          for (const skill of arr) {
            const clean = String(skill).trim();
            const lines = Math.max(1, Math.ceil(clean.length / perLine));
            const h = lines * lineHeight + itemGap;
            // Greedy: place into shortest column
            let idx = 0;
            for (let i = 1; i < columnCount; i++) {
              if (colHeights[i] < colHeights[idx]) idx = i;
            }
            colHeights[idx] += h;
          }
          return Math.max(...colHeights);
        };
        const parts = [];
        let current = [];
        for (let i = 0; i < items.length; i++) {
          const next = [...current, items[i]];
          const heightWithNext = estimateSetHeight(next);
          if (heightWithNext <= maxHeight || current.length === 0) {
            current = next;
          } else {
            parts.push(current);
            current = [items[i]];
          }
        }
        if (current.length) parts.push(current);
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
          const threshold = aggressiveIndustry ? 0.995 : 0.95; // Allow executive-serif to pack tighter
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
            const sectionTitleHeight = Math.round(20 * fontScale); // "PROJECTS" title
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
      const sectionTitleHeight = Math.round(20 * fontScale);
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
      const sectionTitleHeight = Math.round(20 * fontScale); // Add height for section title
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
      const sectionTitleHeight = Math.round(20 * fontScale); // Add height for section title
      const projectsHeight = estimateSectionHeight(data.projects, 'projects') + sectionTitleHeight;
      allSections.push({
        type: 'projects',
        content: data.projects,
        estimatedHeight: projectsHeight,
        priority: 4,
        canSplit: true  // Allow projects section to be split across pages
      });
    }
    // Education section
    if (data.education) {
      const sectionTitleHeight = Math.round(20 * fontScale); // Add height for section title
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
        const sectionTitleHeight = Math.round(20 * fontScale); // Add height for section title
        const skillsHeight = estimateSectionHeight(skillsText, 'skills') + sectionTitleHeight;
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
        if (rawRemainingHeight > minSpaceToSplit) {
          const parts = splitLongContent(section.content, section.type, rawRemainingHeight);
          
          // Check if we actually got a meaningful split
          // For projects, parts[0] should be an array of projects, not the full content
          const gotMeaningfulSplit = parts.length > 1 || 
            (section.type === 'projects' && Array.isArray(parts[0]) && parts[0].length < section.content.length);
          
          if (gotMeaningfulSplit) {
            // We got split parts - add them even if just one part fits
            
            // Add first part to current page
            const firstPartHeight = estimateSectionHeight(parts[0], section.type);
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
                const partHeight = estimateSectionHeight(parts[i], section.type);
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
                const firstPartHeight = estimateSectionHeight(partsOnNew[0], section.type);
                addToCurrentPage({ ...section, content: partsOnNew[0], estimatedHeight: firstPartHeight, isContinued: true });
                for (let i = 1; i < partsOnNew.length; i++) {
                  const partHeight = estimateSectionHeight(partsOnNew[i], section.type);
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
              const firstPartHeight = estimateSectionHeight(partsOnNew[0], section.type);
              addToCurrentPage({ ...section, content: partsOnNew[0], estimatedHeight: firstPartHeight, isContinued: true });
              for (let i = 1; i < partsOnNew.length; i++) {
                const partHeight = estimateSectionHeight(partsOnNew[i], section.type);
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
    if (isIndustryManagerFormat && newPages.length > 1) {
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
      // Rebalance: only pull forward the next page's first section if it
      // continues the same section type. This preserves section ordering
      // and prevents, e.g., Education moving ahead of remaining Experience.
      for (let i = 0; i < newPages.length - 1; i++) {
        const page = newPages[i];
        const next = newPages[i + 1];
        if (!page || !next || next.length === 0) continue;
        const lastType = page.length ? page[page.length - 1].type : null;
        const nextFirst = next[0];
        if (!lastType || !nextFirst || nextFirst.type !== lastType) {
          // Do not move across type boundaries
          continue;
        }
        let leftover = effectiveAvailableHeight - sumEstimatedHeight(page);
        if (leftover < 80) continue;
        // Try to pull only the first section (same type)
        const sec = nextFirst;
        const softAllowance = sec.type === 'education' ? (isIndustryManagerFormat ? 48 : 32) : (sec.type === 'summary' ? 24 : 12);
        // If we are appending the same section type, the visual header will be hidden.
        // Remove section-title height from the needed estimate so we don't block moves unnecessarily.
        const sectionTitleHeightPx = Math.round(20 * getFontSizeScaleFactor());
        const adjustedSecHeight = Math.max(0, sec.estimatedHeight - sectionTitleHeightPx);
        const needed = sumEstimatedHeight(page) + addBuffer(adjustedSecHeight, sec.type);
        const fits = needed <= effectiveAvailableHeight || (!sec.canSplit && needed <= (effectiveAvailableHeight + softAllowance));
        if (fits) {
          // Push with adjusted estimate since the header will be suppressed on this page
          page.push({ ...sec, estimatedHeight: adjustedSecHeight, _suppressTitle: true });
          next.shift();
        } else if (sec.canSplit) {
          const allowance = Math.max(0, effectiveAvailableHeight - sumEstimatedHeight(page) - getSectionPadding(sec.type));
          if (allowance > 60) {
            const parts = splitLongContent(sec.content, sec.type, allowance);
            if (parts.length > 1) {
              const firstPartHeight = estimateSectionHeight(parts[0], sec.type);
              // First part on this page: suppress title
              page.push({ ...sec, content: parts[0], estimatedHeight: firstPartHeight, isContinued: true, _suppressTitle: true });
              const remainder = parts.slice(1);
              // Replace on next page
              next.shift();
              // Insert remainders at the beginning to keep order
              for (let r = remainder.length - 1; r >= 0; r--) {
                const partHeight = estimateSectionHeight(remainder[r], sec.type);
                // First remainder part starts a visible block on the next page; include title height
                const needsTitle = (r === 0);
                const adjPartHeight = needsTitle ? (partHeight + sectionTitleHeightPx) : partHeight;
                next.unshift({ ...sec, content: remainder[r], estimatedHeight: adjPartHeight, isContinuation: true, isContinued: r < remainder.length - 1 });
              }
            }
          }
        }
        // Clean up if next page emptied
        if (next.length === 0) newPages.splice(i + 1, 1);
      }
    }
    // Final safety pass: ensure no page exceeds available height.
    // If a page still overflows due to estimation error, move/split the
    // last section forward until it fits.
    for (let i = 0; i < newPages.length; i++) {
      let safetyGuard = 0;
      while (sumEstimatedHeight(newPages[i]) > (effectiveAvailableHeight - 4) && safetyGuard < 20) {
        safetyGuard++;
        const page = newPages[i];
        if (!page || page.length === 0) break;
        const last = page.pop();
        const current = sumEstimatedHeight(page);
        const allowance = Math.max(0, effectiveAvailableHeight - current - getSectionPadding(last.type));
        if (last && last.canSplit && allowance > 40) {
          const parts = splitLongContent(last.content, last.type, allowance);
          if (parts.length > 1) {
            const firstPartHeight = estimateSectionHeight(parts[0], last.type);
            page.push({ ...last, content: parts[0], estimatedHeight: firstPartHeight, isContinued: true });
            if (i + 1 >= newPages.length) newPages.push([]);
            const remainder = parts.slice(1);
            for (let k = 0; k < remainder.length; k++) {
              const partHeight = estimateSectionHeight(remainder[k], last.type);
              newPages[i + 1].unshift({ ...last, content: remainder[k], estimatedHeight: partHeight, isContinuation: true, isContinued: k < remainder.length - 1 });
            }
            continue;
          }
        }
        if (i + 1 >= newPages.length) newPages.push([]);
        newPages[i + 1].unshift(last);
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
            fontSize: `${7 * scaleFactor}px`,  // Slightly larger than body text
            marginBottom: `${2 * scaleFactor}px`, 
            borderBottom: '1px solid #000', 
            paddingBottom: `${1 * scaleFactor}px`, 
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
        const sectionTitleFont = 7.0 * scaleFactor;
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
            boxSizing: 'border-box'
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
            lineHeight: '1.3'
          },
          skillMarkerChar: '▪',
          item: { marginTop: `${3 * scaleFactor}px` }
        };
      }
      case TEMPLATE_SLUGS.MODERN_CLEAN:
        // Contemporary Tech - exactly like StepFormat modern
        return {
          container: { 
            fontFamily: 'Segoe UI, sans-serif', 
            // Normalize body size to align with other templates
            fontSize: `${6 * scaleFactor}px`, 
            lineHeight: '1.2',
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
            fontSize: `${7 * scaleFactor}px`,  // Slightly larger than body text
            marginBottom: `${2 * scaleFactor}px`, 
            textTransform: 'uppercase', 
            letterSpacing: '1px', 
            borderBottom: '1px solid #000', 
            paddingBottom: `${1 * scaleFactor}px`, 
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
            fontSize: `${6 * scaleFactor}px`
          },
          item: { marginTop: `${3 * scaleFactor}px` }
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
      return (
        <div style={styles.skillsGrid}>
          {activeColumns.map((column, columnIdx) => {
            const columnStyle = {
              ...(styles.skillsColumn || {}),
              width: `${100 / columnCountResolved}%`
            };
            if (styles.skillsColumnSpacing && columnIdx < columnCountResolved - 1) {
              columnStyle.paddingRight = styles.skillsColumnSpacing;
            }
            return (
              <ul key={columnIdx} style={columnStyle}>
                {column.map((skill, skillIdx) => (
                  <li key={`${columnIdx}-${skillIdx}`} style={styles.skillItem || { display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={styles.skillMarker || { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', minWidth: '18px', fontSize: '11px', color: '#39A5B7', lineHeight: '1.2', marginRight: '8px' }}>{skillMarkerChar}</span>
                    <span style={styles.skillText || { flex: 1, fontSize: '11px', color: '#374151', lineHeight: '1.3' }}>{skill}</span>
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
        const secondaryLine = !isIndustryManager
          ? formatHeaderSegments([company, location, datePart])
          : '';
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
            <div style={styles.company}>{headerText}</div>
            {!isIndustryManager && secondaryLine && (
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
          startDate = startDateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        }
        if (exp.endDate && !exp.currentlyWorking) {
          const endDateObj = new Date(exp.endDate);
          endDate = endDateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        }
        const dateRange = normalizeRange(startDate, endDate, exp.currentlyWorking);
        const jobTitle = toText(exp.jobTitle) || 'Job Title';
        const companyName = toText(exp.company) || 'Company';
        const locationLabel = exp.remote ? 'Remote' : location;
        const headerText = isIndustryManager
          ? formatHeaderSegments([jobTitle, companyName, locationLabel, dateRange], true)
          : formatHeaderSegments([jobTitle, companyName, locationLabel, dateRange]);
        const descriptionContent = exp.description
          ? (
              <div style={{ marginTop: '2px' }}>
                {exp.description.split(/\r?\n/).map((line, lineIdx) =>
                  renderBulletLine(line, `${idx}-${lineIdx}`, styles)
                )}
              </div>
            )
          : null;
        const contentNode = (
          <>
            <div style={styles.company}>{headerText}</div>
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
      }
    })
    .filter(Boolean);
};
// Render education items - format like original PDF with school and location on same line
const renderEducation = (education, styles) => {
  if (!education) return null;
  const isIndustryManager = selectedFormat === TEMPLATE_SLUGS.EXECUTIVE_SERIF;
  const normalizeRange = (edu) => {
    const dash = isIndustryManager ? ' – ' : ' - ';
    if (edu.startYear && edu.graduationYear) {
      return `${edu.startYear}${dash}${edu.graduationYear}`;
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
  const renderPageContent = (pageSections, styles) => {
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
          let summaryTitle = 'SUMMARY';
          if (section.isContinuation && !section.isContinued) {
            summaryTitle = 'SUMMARY (continued)';
          } else if (section.isContinuation) {
            summaryTitle = 'SUMMARY (continued)';
          } else if (section.isContinued) {
            summaryTitle = 'SUMMARY';
          }
          
          return <div key={idx}>{renderSection(summaryTitle, renderSummaryContent(section.content, styles), styles, { showTitle })}</div>;
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
        </div>
      )}
      {/* Multi-Page View - Dynamic Content Splitting */}
      {shouldShowMultiPage && (
        <div className="multi-page-container">
          {pages.map((pageSections, pageIndex) => (
            <div key={pageIndex} className="page-wrapper" style={pageContainerStyle}>
              {/* Page Content - Rendered based on section types */}
              <div className="page-content">
                {renderPageContent(pageSections, styles)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default LivePreview; 
