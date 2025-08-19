// Utility functions for handling resume pagination

// Standard page dimensions (US Letter size)
export const PAGE_DIMENSIONS = {
  width: 816, // 8.5 inches * 96 DPI
  height: 1056, // 11 inches * 96 DPI
  margin: 20,
  availableHeight: 1016 // height - (margin * 2)
};

// Estimate content heights for different resume sections
export const SECTION_HEIGHTS = {
  header: 80, // Name + contact info
  summary: 60, // Summary section
  experienceItem: 40, // Per experience entry
  educationItem: 30, // Per education entry
  skills: 40, // Skills section
  sectionTitle: 20, // Section title height
  sectionSpacing: 16 // Spacing between sections
};

// Calculate estimated height for a section
export const calculateSectionHeight = (sectionType, content, styles) => {
  switch (sectionType) {
    case 'header':
      let height = SECTION_HEIGHTS.header;
      if (content.name) height += 20;
      if (content.email) height += 15;
      if (content.phone) height += 15;
      return height;
    
    case 'summary':
      if (!content.summary) return 0;
      const lines = content.summary.split('\n').length;
      const estimatedHeight = Math.max(SECTION_HEIGHTS.summary, lines * 12);
      return estimatedHeight + SECTION_HEIGHTS.sectionTitle + SECTION_HEIGHTS.sectionSpacing;
    
    case 'experiences':
      if (!content.experiences || content.experiences.length === 0) return 0;
      let totalHeight = SECTION_HEIGHTS.sectionTitle + SECTION_HEIGHTS.sectionSpacing;
      
      content.experiences.forEach(exp => {
        if (typeof exp === 'string') {
          const lines = exp.split('\n').length;
          totalHeight += Math.max(SECTION_HEIGHTS.experienceItem, lines * 12);
        } else {
          const descLines = exp.description ? exp.description.split('\n').length : 0;
          totalHeight += Math.max(SECTION_HEIGHTS.experienceItem, 30 + (descLines * 12));
        }
      });
      
      return totalHeight;
    
    case 'education':
      if (!content.education) return 0;
      const eduItems = Array.isArray(content.education) ? content.education.length : 1;
      return SECTION_HEIGHTS.sectionTitle + SECTION_HEIGHTS.sectionSpacing + (eduItems * SECTION_HEIGHTS.educationItem);
    
    case 'skills':
      if (!content.skills) return 0;
      const skillLines = content.skills.split('\n').length;
      return SECTION_HEIGHTS.sectionTitle + SECTION_HEIGHTS.sectionSpacing + Math.max(SECTION_HEIGHTS.skills, skillLines * 12);
    
    default:
      return 0;
  }
};

// Split content into pages based on estimated heights
export const splitContentIntoPages = (content, styles) => {
  const pages = [];
  let currentPage = [];
  let currentHeight = 0;
  const availableHeight = PAGE_DIMENSIONS.availableHeight;

  // Helper function to add section to current page or start new page
  const addSectionToPage = (section, estimatedHeight) => {
    if (currentHeight + estimatedHeight > availableHeight && currentPage.length > 0) {
      // Start new page
      pages.push([...currentPage]);
      currentPage = [];
      currentHeight = 0;
    }
    
    currentPage.push(section);
    currentHeight += estimatedHeight;
  };

  // Add header section
  if (content.name || content.email || content.phone) {
    const headerSection = {
      type: 'header',
      content: {
        name: content.name,
        email: content.email,
        phone: content.phone
      }
    };
    const headerHeight = calculateSectionHeight('header', headerSection.content);
    addSectionToPage(headerSection, headerHeight);
  }

  // Add summary section
  if (content.summary) {
    const summarySection = {
      type: 'summary',
      content: { summary: content.summary }
    };
    const summaryHeight = calculateSectionHeight('summary', summarySection.content);
    addSectionToPage(summarySection, summaryHeight);
  }

  // Add experiences section
  if (content.experiences && content.experiences.length > 0) {
    const experiencesSection = {
      type: 'experiences',
      content: { experiences: content.experiences }
    };
    const experiencesHeight = calculateSectionHeight('experiences', experiencesSection.content);
    addSectionToPage(experiencesSection, experiencesHeight);
  }

  // Add education section
  if (content.education) {
    const educationSection = {
      type: 'education',
      content: { education: content.education }
    };
    const educationHeight = calculateSectionHeight('education', educationSection.content);
    addSectionToPage(educationSection, educationHeight);
  }

  // Add skills section
  if (content.skills) {
    const skillsSection = {
      type: 'skills',
      content: { skills: content.skills }
    };
    const skillsHeight = calculateSectionHeight('skills', skillsSection.content);
    addSectionToPage(skillsSection, skillsHeight);
  }

  // Add the last page if it has content
  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
};

// Calculate actual DOM heights for more accurate pagination
export const measureActualHeights = (contentRef) => {
  if (!contentRef.current) return null;
  
  const sections = contentRef.current.querySelectorAll('[data-section]');
  const heights = {};
  
  sections.forEach(section => {
    const sectionType = section.getAttribute('data-section');
    heights[sectionType] = section.offsetHeight;
  });
  
  return heights;
};

// Generate page numbers for multi-page resumes
export const generatePageNumbers = (totalPages) => {
  return Array.from({ length: totalPages }, (_, i) => i + 1);
};

// Check if content should be split across pages
export const shouldSplitContent = (content, estimatedHeight) => {
  return estimatedHeight > PAGE_DIMENSIONS.availableHeight;
};

// Calculate optimal page breaks for better readability
export const calculateOptimalPageBreaks = (sections, availableHeight) => {
  const breaks = [];
  let currentHeight = 0;
  
  sections.forEach((section, index) => {
    const sectionHeight = section.estimatedHeight;
    
    // Check if adding this section would exceed page height
    if (currentHeight + sectionHeight > availableHeight) {
      // Try to find a better break point
      if (section.type === 'experiences' && section.content.experiences.length > 1) {
        // Split experiences across pages
        const remainingHeight = availableHeight - currentHeight;
        const itemsPerPage = Math.floor(remainingHeight / SECTION_HEIGHTS.experienceItem);
        
        if (itemsPerPage > 0) {
          breaks.push({
            page: breaks.length + 1,
            sectionIndex: index,
            splitType: 'experiences',
            itemsPerPage
          });
        }
      }
      
      breaks.push({
        page: breaks.length + 1,
        sectionIndex: index,
        splitType: 'full'
      });
      
      currentHeight = sectionHeight;
    } else {
      currentHeight += sectionHeight;
    }
  });
  
  return breaks;
}; 