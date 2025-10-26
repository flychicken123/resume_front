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
  const CONTENT_MARGIN = 20; // Matches container padding for accurate estimates
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
        const entryLineHeight = Math.round(13 * fontScale);
        const baseEntryLines = 2; // school line + degree line
        const estimateEntryLines = (edu) => {
          if (!edu || typeof edu !== 'object') {
            return baseEntryLines;
          }
          let lines = baseEntryLines;
          if (toText(edu.summary) || toText(edu.description)) {
            lines += 1;
          }
          if (toText(edu.gpa)) {
            lines += 1;
          }
          if (toText(edu.honors)) {
            lines += 1;
          }
          return lines;
        };
        if (Array.isArray(content)) {
          const totalLines = content.reduce((acc, edu) => acc + estimateEntryLines(edu), 0);
          const eduHeight = (totalLines * entryLineHeight);
          return applyFormatAdjustment(eduHeight, 'education');
        }
        if (typeof content === 'object' && content !== null) {
          const lines = estimateEntryLines(content);
          return applyFormatAdjustment(lines * entryLineHeight, 'education');
        }
        return applyFormatAdjustment(baseEntryLines * entryLineHeight, 'education');
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
        const lineHeight = Math.round(13.2 * fontScale);
        const baseHeight = Math.max(lineHeight, Math.round(18 * fontScale));
        const itemGap = Math.max(2, Math.round(2.2 * fontScale));

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

        const perLineChars = Math.max(48, Math.round(260 / fontScale));
        let totalChars = 0;
        skillsArray.forEach((skill, index) => {
          const value = String(skill || '');
          totalChars += value.length + (index === skillsArray.length - 1 ? 0 : 2);
        });

        const lineCount = Math.max(1, Math.ceil(totalChars / perLineChars));
        const wrapAllowance = Math.round(Math.max(0, lineCount - 1) * lineHeight * 0.08);
        const estimated = (lineCount * lineHeight) + ((lineCount - 1) * itemGap) + wrapAllowance;
        return applyFormatAdjustment(Math.max(baseHeight, estimated), 'skills');
      }
      default:
        return applyFormatAdjustment(20, 'default');
    }
  };
  const adjustSkillContentEstimate = (contentHeight, { includeHeader = false } = {}) => {
    const fontScale = getFontSizeScaleFactor();
    const headerAllowance = includeHeader ? Math.round(12 * fontScale) : 0;
    const buffer = includeHeader ? Math.round(Math.max(6, 3 * fontScale)) : Math.round(Math.max(4, 2 * fontScale));
    return Math.round(contentHeight + headerAllowance + buffer);
  };
  // Split content into pages based on estimated heights
  const splitContentIntoPages = () => {
    const fontScale = getFontSizeScaleFactor();
    const baseUtilization = fontScale <= 1.0 ? 1.0 :
                           fontScale <= 1.2 ? 0.99 :
                           fontScale <= 1.5 ? 0.97 :
                           0.94;
    const pageUtilization = useConservativePaging
      ? Math.min(baseUtilization, 0.96)
      : baseUtilization;
    const basePageBuffer = useConservativePaging ? 32 : 24;
    let effectiveAvailableHeight = Math.min(
      AVAILABLE_HEIGHT * pageUtilization,
      AVAILABLE_HEIGHT - basePageBuffer
    );

    if (isIndustryManagerFormat && !useConservativePaging) {
      const marginLimit = AVAILABLE_HEIGHT - 18;
      effectiveAvailableHeight = Math.min(effectiveAvailableHeight, marginLimit);
    }

    const sectionPadding = {
      header: useConservativePaging ? 10 : 12,
      summary: useConservativePaging ? 12 : 16,
      experience: useConservativePaging ? 14 : 18,
      projects: useConservativePaging ? 14 : 18,
      education: useConservativePaging ? 12 : 16,
      skills: useConservativePaging ? 10 : 14,
      default: useConservativePaging ? 10 : 14,
    };

    const getSectionPadding = (type) => sectionPadding[type] ?? sectionPadding.default;

    const addBuffer = (height, type) => Math.max(0, height || 0) + getSectionPadding(type);


    const allSections = [];

    if (data.name || data.email || data.phone) {
      const headerHeight = estimateSectionHeight(data.name, 'header');
      allSections.push({
        type: 'header',
        content: { name: data.name, email: data.email, phone: data.phone },
        estimatedHeight: headerHeight,
        priority: 1,
      });
    }

    if (data.summary) {
      const summaryText = toText(data.summary);
      const sectionTitleHeight = Math.round(20 * fontScale);
      const summaryHeight = estimateSectionHeight(summaryText, 'summary') + sectionTitleHeight;
      allSections.push({
        type: 'summary',
        content: summaryText,
        estimatedHeight: summaryHeight,
        priority: 2,
        canSplit: true,
      });
    }

    if (data.experiences && data.experiences.length > 0) {
      const sectionTitleHeight = Math.round(20 * fontScale);
      const totalExpHeight = estimateSectionHeight(data.experiences, 'experience') + sectionTitleHeight;
      allSections.push({
        type: 'experience',
        content: data.experiences,
        estimatedHeight: totalExpHeight,
        priority: 3,
        canSplit: true,
      });
    }

    if (data.projects && data.projects.length > 0 && !isAttorneyFormat) {
      const sectionTitleHeight = Math.round(24 * fontScale);
      const projectsHeight = estimateSectionHeight(data.projects, 'projects') + sectionTitleHeight;
      allSections.push({
        type: 'projects',
        content: data.projects,
        estimatedHeight: projectsHeight,
        priority: 4,
        canSplit: true,
      });
    }

    if (data.education) {
      const sectionTitleHeight = Math.round(18 * fontScale);
      const eduHeight = estimateSectionHeight(data.education, 'education') + sectionTitleHeight;
      allSections.push({
        type: 'education',
        content: data.education,
        estimatedHeight: eduHeight,
        priority: 5,
        canSplit: isIndustryManagerFormat,
      });
    }

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
          canSplit: isIndustryManagerFormat,
        });
      }
    }

    const pages = [];
    let currentPage = [];
    let currentHeight = 0;

    const pushPage = () => {
      if (currentPage.length === 0) {
        return;
      }
      const withMetadata = currentPage.map((section, index) => ({
        ...section,
        _pageStart: index === 0,
        _suppressTitle: false,
      }));
      pages.push(withMetadata);
      currentPage = [];
      currentHeight = 0;
    };

    allSections.forEach((section) => {
      const bufferedHeight = addBuffer(section.estimatedHeight, section.type);
      if (currentHeight > 0 && (currentHeight + bufferedHeight) > effectiveAvailableHeight) {
        pushPage();
      }
      currentPage.push({ ...section });
      currentHeight += bufferedHeight;
    });

    pushPage();

    if (pages.length > 1 && pages[0].length === 1 && pages[0][0]?.type === 'header') {
      if (DEBUG_PAGINATION) {
        console.log('[Pagination] collapsing header-only first page');
      }
      const [headerSection] = pages[0];
      pages[1].unshift({ ...headerSection, _pageStart: true, _suppressTitle: false });
      pages.shift();
    }

    if (DEBUG_PAGINATION) {
      console.log('[Pagination] final page layout', pages.map((pageSections, pageIdx) => ({
        page: pageIdx + 1,
        types: pageSections.map((section) => section.type),
        totalEstimated: pageSections.reduce((acc, section) => acc + (section?.estimatedHeight || 0), 0),
      })));
    }

    return pages;
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
          companyRow: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: `${gapWidth}px`,
            paddingLeft: `${indent}px`,
            textIndent: `-${indent}px`,
            alignItems: 'baseline',
            color: '#2c3e50',
          },
          companyTitle: {
            fontWeight: 'bold',
            fontSize: `${headerLineFont}px`,
            textTransform: 'uppercase',
            letterSpacing: '0.35px',
            color: '#2c3e50',
          },
          companyMeta: {
            fontSize: `${headerLineFont - 0.4}px`,
            textTransform: 'uppercase',
            letterSpacing: '0.25px',
            color: '#4b5563',
          },
          educationDetail: {
            paddingLeft: `${indent}px`,
            textIndent: '0',
            marginTop: `${1.8 * scaleFactor}px`,
            fontSize: `${bodyFont}px`,
            color: '#374151',
            lineHeight: '1.3',
            letterSpacing: '0.2px',
            textTransform: 'none',
            fontWeight: 500
          },
          educationDetailSecondary: {
            paddingLeft: `${indent}px`,
            marginTop: `${1.2 * scaleFactor}px`,
            fontSize: `${bodyFont - 0.4}px`,
            color: '#4b5563',
            lineHeight: '1.3',
            letterSpacing: '0.2px',
            textTransform: 'none',
            fontWeight: 400
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
            marginBottom: `${4 * scaleFactor}px`,
            paddingLeft: `${indent}px`,
            textIndent: '0px',
            display: 'block',
            fontWeight: 400,
            textTransform: 'none',
            letterSpacing: '0.1px'
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
  const renderSkillsSection = (skills, styles, { inlineOnly = false } = {}) => {
    if (!skills) return null;
    const skillsArray = Array.isArray(skills) ? skills : parseSkills(skills);
    if (!skillsArray || skillsArray.length === 0) return null;
    const isIndustryManager = selectedFormat === TEMPLATE_SLUGS.EXECUTIVE_SERIF;
    if (inlineOnly || !styles.skillsGrid || !styles.skillsColumn || selectedFormat !== TEMPLATE_SLUGS.EXECUTIVE_SERIF) {
      return (
        <div
          style={{
            ...styles.skills,
            whiteSpace: 'pre-wrap',
            marginBottom: 0,
          }}
        >
          {skillsArray.join(', ')}
        </div>
      );
    }
    if (isIndustryManager) {
      const columnCount = 2;
      const itemsPerColumn = Math.ceil(skillsArray.length / columnCount);
      const columns = Array.from({ length: columnCount }, (_, columnIndex) =>
        skillsArray.slice(columnIndex * itemsPerColumn, (columnIndex + 1) * itemsPerColumn)
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
    return <div style={styles.skills}>{skillsArray.join(', ')}</div>;
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
    if (selectedFormat === TEMPLATE_SLUGS.EXECUTIVE_SERIF) {
      const renderExecutiveHeaderRow = createExecutiveHeaderRenderer(styles);
      if (renderExecutiveHeaderRow) {
        const {
          marginBottom: summaryMarginBottom,
          paddingLeft: _summaryPaddingLeft,
          textIndent: _summaryTextIndent,
          ...summaryPrimaryStyle
        } = summaryStyle;
        const rowNode = renderExecutiveHeaderRow(summaryText, null, {
          hideBullet: true,
          primaryStyle: {
            ...summaryPrimaryStyle,
            marginBottom: 0,
            paddingLeft: 0,
            textIndent: 0,
          },
          rowStyle: {
            marginBottom: summaryMarginBottom ?? 0,
          },
        });
        if (rowNode) {
          return (
            <div className="live-preview-summary">
              {rowNode}
            </div>
          );
        }
      }
    }
    return (
      <div className="live-preview-summary" style={summaryStyle}>
        {summaryText}
      </div>
    );
  };
  // Render experience items
  const parsePxValue = (value) => {
    if (value == null) return null;
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string') {
      const match = value.match(/-?\d+(\.\d+)?/);
      if (!match) return null;
      const parsed = parseFloat(match[0]);
      return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
  };
  const createExecutiveHeaderRenderer = (styles) => {
    if (selectedFormat !== TEMPLATE_SLUGS.EXECUTIVE_SERIF) {
      return null;
    }
    const indentCandidate = styles?.indentPx;
    const parsedIndentCandidate = typeof indentCandidate === 'number'
      ? indentCandidate
      : parsePxValue(indentCandidate);
    const paddingLeft = parsePxValue(styles?.company?.paddingLeft);
    const textIndent = parsePxValue(styles?.company?.textIndent);
    const baseIndent = parsedIndentCandidate ?? paddingLeft ?? (textIndent != null ? Math.abs(textIndent) : null);
    const companyRowBase = { ...(styles?.companyRow || {}) };
    const gapPx = parsePxValue(companyRowBase.gap) ?? Math.max(6, Math.round((baseIndent ?? 16) * 0.35));
    const bulletOffset = baseIndent ?? (textIndent != null ? Math.abs(textIndent) : 0);
    const titleBase = { ...(styles?.companyTitle || styles?.company || {}) };
    const metaBase = { ...(styles?.companyMeta || styles?.date || {}) };
    const bulletColor = titleBase.color || styles?.company?.color || '#2c3e50';
    const rowPaddingLeft = baseIndent != null
      ? `${baseIndent}px`
      : (companyRowBase.paddingLeft || styles?.company?.paddingLeft);
    return (primaryText, metaText, options = {}) => {
      const {
        hideBullet = false,
        primaryStyle: primaryStyleOverride,
        metaStyle: metaStyleOverride,
        rowStyle: rowStyleOverride,
        bulletStyle: bulletStyleOverride,
      } = options || {};
      if (!primaryText && !metaText) {
        return null;
      }
      const markerChar = styles.headerBulletChar || '●';
      const rowStyle = {
        ...companyRowBase,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        paddingLeft: rowPaddingLeft,
        textIndent: 0,
        ...(rowStyleOverride || {}),
      };
      if (!rowStyle.gap) {
        rowStyle.gap = `${gapPx}px`;
      }
      const bulletStyle = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: bulletOffset ? `-${bulletOffset}px` : companyRowBase.marginLeft,
        marginRight: `${gapPx}px`,
        color: bulletColor,
        visibility: hideBullet ? 'hidden' : undefined,
        ...(bulletStyleOverride || {}),
      };
      const titleStyle = {
        ...titleBase,
        flex: '1 1 auto',
        minWidth: 0,
        ...(primaryStyleOverride || {}),
      };
      const metaStyle = {
        ...metaBase,
        flex: '0 0 auto',
        ...(metaStyleOverride || {}),
      };
      return (
        <div style={rowStyle}>
          <span style={bulletStyle} aria-hidden={hideBullet ? 'true' : undefined}>
            {markerChar}
          </span>
          <span style={titleStyle}>{primaryText}</span>
          {metaText && (
            <span style={metaStyle}>{metaText}</span>
          )}
        </div>
      );
    };
  };
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
  const renderExecutiveHeaderRow = createExecutiveHeaderRenderer(styles);
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
        const headerSegments = [jobTitle, company, location, datePart];
        const headerText = isIndustryManager
          ? formatHeaderSegments(headerSegments, true)
          : formatHeaderSegments(headerSegments);
        const secondaryLine = (!isIndustryManager && !isAttorneyTemplate)
          ? ''
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
          const itemStyle = styles.item || { marginTop: '6px' };
          const jobLineSegments = [jobTitle, location].filter(Boolean);
          const metaLineSegments = [company, datePart].filter(Boolean);
          const jobLine = formatHeaderSegments(jobLineSegments, true) || jobTitle;
          const metaLine = formatHeaderSegments(metaLineSegments, true);
          if (renderExecutiveHeaderRow) {
            return (
              <div key={idx} style={itemStyle}>
                {renderExecutiveHeaderRow(jobLine, metaLine)}
                {descriptionContent}
              </div>
            );
          }
          const fallbackBullet = styles.headerBulletChar || '●';
          return (
            <div key={idx} style={itemStyle}>
              <div style={styles.company}>{`${fallbackBullet} ${jobLine}`}</div>
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
        const headerSegments = [jobTitle, companyName, locationLabel, dateRange];
        const headerPrimary = isIndustryManager
          ? formatHeaderSegments(headerSegments, true)
          : formatHeaderSegments(headerSegments);
        const secondaryLine = (!isIndustryManager && !isAttorneyTemplate)
          ? ''
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
          const itemStyle = styles.item || { marginTop: '6px' };
          const jobLineSegments = [jobTitle, locationLabel].filter(Boolean);
          const metaLineSegments = [companyName, dateRange].filter(Boolean);
          const jobLine = formatHeaderSegments(jobLineSegments, true) || jobTitle;
          const metaLine = formatHeaderSegments(metaLineSegments, true);
          if (renderExecutiveHeaderRow) {
            return (
              <div key={idx} style={itemStyle}>
                {renderExecutiveHeaderRow(jobLine, metaLine)}
                {descriptionContent}
              </div>
            );
          }
          const fallbackBullet = styles.headerBulletChar || '●';
          return (
            <div key={idx} style={itemStyle}>
              <div style={styles.company}>{`${fallbackBullet} ${jobLine}`}</div>
              {descriptionContent}
            </div>
          );
        }
        return (
          <div key={idx} style={styles.item}>
            <div style={styles.company}>{isAttorneyTemplate ? (attorneyPrimary || jobTitle) : headerPrimary}</div>
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
  const renderExecutiveHeaderRow = createExecutiveHeaderRenderer(styles);
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
    const indentPx = styles.indentPx != null ? Number(styles.indentPx) : null;
    const normalizeSegment = (segment) => segment.replace(/\s+-\s+/g, ' – ').trim();
    const degreePart = [toText(edu.degree), toText(edu.field)].filter(Boolean).join(' in ');
    const datePart = normalizeSegment(normalizeRange(edu) || '').trim();
    const locationText = (() => {
      const explicitLocation = toText(edu.location);
      const cityState = [toText(edu.city), toText(edu.state)].filter(Boolean).join(', ');
      if (explicitLocation && cityState) {
        return normalizeSegment(`${explicitLocation} • ${cityState}`);
      }
      return normalizeSegment(explicitLocation || cityState || '');
    })();
    const schoolSegment = normalizeSegment(toText(edu.school) || '');
    const primaryText = [schoolSegment, locationText].filter(Boolean).join(' • ');
    const metaText = datePart;
    const detailLines = [];
    if (degreePart) {
      detailLines.push(degreePart);
    }
    const honorsPieces = [
      edu.gpa ? `GPA: ${toText(edu.gpa)}` : '',
      toText(edu.honors)
    ].filter(Boolean);
    if (honorsPieces.length > 0) {
      detailLines.push(honorsPieces.join(' • '));
    }
    if (!primaryText && !metaText && detailLines.length === 0) {
      return null;
    }
    const basePrimary = { ...(styles.educationDetail || {}) };
    const baseSecondary = { ...(styles.educationDetailSecondary || styles.educationDetail || {}) };
    if (indentPx != null && basePrimary.paddingLeft == null) {
      basePrimary.paddingLeft = `${indentPx}px`;
    }
    if (indentPx != null && baseSecondary.paddingLeft == null) {
      baseSecondary.paddingLeft = `${indentPx}px`;
    }
    basePrimary.textIndent = 0;
    baseSecondary.textIndent = 0;
    return (
      <div key={key} style={styles.item || { marginTop: '6px' }}>
        {(primaryText || metaText) && (
          renderExecutiveHeaderRow
            ? renderExecutiveHeaderRow(primaryText, metaText)
            : (
              <div style={styles.company}>
                {`${styles.headerBulletChar || '●'} ${[primaryText, metaText].filter(Boolean).join(' | ')}`}
              </div>
            )
        )}
        {detailLines.map((line, idx) => (
          <div
            key={`${key}-detail-${idx}`}
            style={idx === 0 ? basePrimary : baseSecondary}
          >
            {line}
          </div>
        ))}
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
    const isContinuation = opts.isContinuation === true;
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
    const baseTitle = formatTitle(title);
    const continuationSuffix = isContinuation ? ' (continued)' : '';
    const displayTitle = `${baseTitle}${continuationSuffix}`;
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
      const isPageStart = section._pageStart === true;
      const showTitle = !section._suppressTitle && (isPageStart || prevType !== section.type);
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
          const inlineOnly = selectedFormat !== TEMPLATE_SLUGS.EXECUTIVE_SERIF;
          return (
            <div key={idx}>
              {renderSection(
                'SKILLS',
                renderSkillsSection(skills, styles, { inlineOnly }),
                styles,
                { showTitle }
              )}
            </div>
          );
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

  const splitAttorneySkillsForPages = (skillsList = [], {
    contactCount = 0,
    educationCount = 0,
    fontScale = 1.2,
  } = {}) => {
    if (!skillsList || skillsList.length === 0) {
      return [];
    }
    const safeFontScale = Math.max(0.9, fontScale || 1.0);
    const baseFirstLimit = Math.max(4, Math.floor(11 / safeFontScale));
    let adjustedFirstLimit = baseFirstLimit;
    if (educationCount > 1) {
      adjustedFirstLimit -= Math.ceil((educationCount - 1) * 0.85);
    }
    if (contactCount > 2) {
      adjustedFirstLimit -= Math.ceil((contactCount - 2) * 0.5);
    }
    adjustedFirstLimit = Math.max(3, Math.min(baseFirstLimit, adjustedFirstLimit));
    const subsequentLimit = Math.max(adjustedFirstLimit + 2, Math.floor(14 / safeFontScale));
    const remainingSkills = [...skillsList];
    const slices = [];
    const firstSlice = remainingSkills.splice(0, adjustedFirstLimit);
    slices.push(firstSlice);
    while (remainingSkills.length > 0) {
      slices.push(remainingSkills.splice(0, subsequentLimit));
    }
    return slices;
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

  const renderAttorneySidebar = (sidebarData = {}, options = {}) => {
    const {
      contactEntries = [],
      educationItems = [],
      skillsList = [],
    } = sidebarData;
    const {
      showContact = true,
      showEducation = true,
      skillsHeadingSuffix = '',
    } = options;
    const fontScale = getFontSizeScaleFactor();
    const educationBlockSpacing = `${6 * fontScale}px`;
    return (
      <aside style={styles.sidebar}>
        {showContact && contactEntries.length > 0 && (
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
        {showEducation && educationItems.length > 0 && (
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
              <span style={styles.sidebarHeadingText}>
                Key Skills{skillsHeadingSuffix}
              </span>
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
          {renderAttorneySidebar({ contactEntries, educationItems, skillsList })}
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

    const sidebarData = buildAttorneySidebarData();
    const { contactEntries, educationItems, skillsList } = sidebarData;
    const skillSlices = splitAttorneySkillsForPages(skillsList, {
      contactCount: contactEntries.length,
      educationCount: educationItems.length,
      fontScale: getFontSizeScaleFactor(),
    });
    const skillsForPage = skillSlices[pageIndex] || [];
    const hasPriorSkills = skillSlices.slice(0, pageIndex).some((slice) => slice && slice.length > 0);
    const sidebarNode = renderAttorneySidebar(
      {
        contactEntries: pageIndex === 0 ? contactEntries : [],
        educationItems: pageIndex === 0 ? educationItems : [],
        skillsList: skillsForPage,
      },
      {
        showContact: pageIndex === 0,
        showEducation: pageIndex === 0,
        skillsHeadingSuffix: skillsForPage.length > 0 && hasPriorSkills ? ' (continued)' : '',
      }
    );

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






