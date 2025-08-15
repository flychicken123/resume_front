# Resume Pagination System

This document explains how the multi-page pagination system works in the LivePreview component, similar to how Word documents handle page breaks.

## Overview

The pagination system automatically splits resume content into multiple pages when it exceeds the standard US Letter page dimensions (8.5" x 11"). Each page maintains proper boundaries and spacing, just like a printed document.

## How It Works

### 1. Page Dimensions
- **Width**: 816 pixels (8.5 inches × 96 DPI)
- **Height**: 1056 pixels (11 inches × 96 DPI)
- **Margins**: 20 pixels on all sides
- **Available Content Height**: 1016 pixels (height - margins)

### 2. Content Height Calculation
The system estimates content heights for different resume sections:

- **Header**: 80px (name + contact info)
- **Summary**: 60px + variable based on text length
- **Experience Items**: 40px per item + variable based on description length
- **Education Items**: 30px per item
- **Skills**: 40px + variable based on text length
- **Section Titles**: 20px each
- **Section Spacing**: 16px between sections

### 3. Page Break Logic
When content exceeds the available page height:
1. The current page is finalized
2. A new page is started
3. Content continues on the new page
4. Page numbers are automatically added

### 4. Smart Content Splitting
The system tries to keep related content together:
- Header and contact info always stay on the first page
- Summary section stays with the header when possible
- Experience items are kept together when space allows
- Education and skills sections are placed optimally

## Features

### Page Navigation
- **Previous/Next buttons** for multi-page resumes
- **Page counter** showing current page and total pages
- **Sticky navigation bar** that stays visible while scrolling

### Visual Elements
- **Page boundaries** with subtle shadows and borders
- **Page numbers** in the bottom-right corner
- **Page break indicators** between pages
- **Responsive design** that works on different screen sizes

### Print Support
- **Print-optimized styles** that hide navigation elements
- **Proper page breaks** for printing
- **Clean page boundaries** without shadows or borders

## Usage

### Basic Implementation
```jsx
import LivePreview from './components/LivePreview';

function App() {
  return (
    <LivePreview isVisible={true} />
  );
}
```

### With Resume Data
The component automatically receives resume data from the ResumeContext and calculates pagination based on:
- Personal information (name, email, phone)
- Summary text
- Experience entries
- Education details
- Skills list
- Selected resume format

### Customization
You can modify the pagination behavior by adjusting constants in `src/utils/paginationUtils.js`:
- Page dimensions
- Section height estimates
- Margin and spacing values

## Technical Details

### Files
- `LivePreview.jsx` - Main component with pagination logic
- `LivePreview.css` - Styling for pages and navigation
- `paginationUtils.js` - Utility functions for calculations

### State Management
- `pages` - Array of page content sections
- `currentPage` - Currently displayed page (for navigation)
- `pageNumbers` - Generated page numbers

### Performance
- Content is recalculated only when resume data changes
- Height calculations use estimates for efficiency
- DOM measurements are minimized

## Browser Support

- **Modern browsers** with CSS Grid and Flexbox support
- **Mobile responsive** with touch-friendly navigation
- **Print-friendly** with proper page break handling
- **Accessibility** with ARIA labels and keyboard navigation

## Future Enhancements

Potential improvements for the pagination system:
1. **Real-time height measurement** using ResizeObserver
2. **Dynamic content splitting** within sections
3. **Custom page sizes** (A4, Legal, etc.)
4. **Manual page break controls**
5. **Content overflow warnings**
6. **Zoom and scale support**

## Troubleshooting

### Common Issues

1. **Content not splitting properly**
   - Check that content exceeds page height
   - Verify section height calculations
   - Ensure proper data structure

2. **Navigation not working**
   - Confirm multiple pages exist
   - Check for JavaScript errors
   - Verify component state

3. **Styling issues**
   - Ensure CSS file is imported
   - Check for conflicting styles
   - Verify CSS class names

### Debug Mode
Add console logs to see pagination calculations:
```jsx
useEffect(() => {
  console.log('Pages calculated:', pages);
  console.log('Current page:', currentPage);
}, [pages, currentPage]);
```

## Examples

### Single Page Resume
- Short content fits on one page
- No navigation controls shown
- Standard single-page layout

### Multi-Page Resume
- Content exceeds page height
- Navigation controls appear
- Multiple pages with boundaries
- Page numbers and indicators

### Print Preview
- Navigation hidden
- Clean page boundaries
- Proper page breaks
- Print-optimized layout 