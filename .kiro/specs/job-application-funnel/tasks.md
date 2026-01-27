# Implementation Plan: Job Application Funnel Visualization

## Overview

This implementation plan breaks down the job application funnel visualization feature into discrete, incremental coding tasks. Each task builds on previous work, with testing integrated throughout to validate functionality early. The implementation uses React with TypeScript and Plotly.js for the Sankey diagram visualization.

## Tasks

- [x] 1. Install dependencies and set up types
  - Install react-plotly.js and @types/plotly.js packages
  - Install fast-check for property-based testing
  - Create FunnelTypes.ts with FunnelStage enum, stage mapping types, and Plotly data interfaces
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 2. Implement stage mapping and data transformation utilities
  - [x] 2.1 Create utils/funnelDataTransform.ts with stage mapping functions
    - Implement mapStatusToStage function to convert AppStatus to FunnelStage
    - Implement groupByStage function to count applications per stage
    - Implement calculateFlows function to generate flow data
    - Implement transformToPlotlyData function to convert flows to Plotly format
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.7_
  
  - [x] 2.2 Write property test for stage mapping
    - **Property 3: Stage mapping handles all status values**
    - **Validates: Requirements 3.5, 3.8**
  
  - [x] 2.3 Write property test for data transformation
    - **Property 2: Data transformation preserves application count**
    - **Validates: Requirements 2.2, 2.4, 2.6**
  
  - [x] 2.4 Write unit tests for specific status mappings
    - Test Applied → Applied stage
    - Test Interview → Interview stage
    - Test Rejected → Rejected stage
    - Test Offer → Offer stage
    - Test undefined/null → Unknown stage
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Implement color scheme and formatting utilities
  - [x] 3.1 Create utils/funnelStyles.ts with color definitions
    - Define STAGE_COLORS constant with colors for each FunnelStage
    - Implement getLinkColor function for semi-transparent link colors
    - Implement formatNumber function with comma separators
    - _Requirements: 4.1, 4.2, 4.3, 5.6_
  
  - [x] 3.2 Write property test for color uniqueness and consistency
    - **Property 5: Stage colors are unique and consistent**
    - **Validates: Requirements 4.4, 4.6**
  
  - [x] 3.3 Write property test for number formatting
    - **Property 8: Number formatting includes separators**
    - **Validates: Requirements 5.6**
  
  - [x] 3.4 Write unit tests for specific color assignments
    - Test Interview and Offer have green tones
    - Test Rejected has red tone
    - Test Applied has neutral tone
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 4. Create SankeyDiagram component
  - [x] 4.1 Create components/SankeyDiagram.tsx
    - Import Plot from react-plotly.js
    - Define SankeyDiagramProps interface
    - Implement data transformation pipeline (applications → Plotly data)
    - Configure Plotly layout and config objects
    - Render Plot component with transformed data
    - Add error boundary for diagram rendering failures
    - Fixed chart height and modal scrolling for proper visualization display
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [~] 4.2 Write property test for diagram generation
    - **Property 16: Diagram generation from any valid data**
    - **Validates: Requirements 2.1, 3.8**
  
  - [~] 4.3 Write unit tests for diagram component
    - Test diagram renders with valid data
    - Test diagram handles empty application list
    - Test diagram handles all applications with same status
    - Test Plotly config includes correct settings
    - _Requirements: 2.1, 2.7_

- [ ] 5. Checkpoint - Ensure core visualization works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement summary statistics calculation and display
  - [x] 6.1 Create utils/funnelMetrics.ts
    - Implement calculatePipelineMetrics function
    - Calculate total applications, response rate, interview rate, offer rate
    - Round percentages to one decimal place
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [x] 6.2 Create components/SummaryStats.tsx
    - Define SummaryStatsProps interface
    - Implement metric card layout (4 cards in grid)
    - Display total, response rate, interview rate, offer rate
    - Apply color coding (green for positive metrics)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [~] 6.3 Write property test for metrics calculation
    - **Property 4: Conversion rate calculations are accurate**
    - **Validates: Requirements 3.7, 8.2, 8.3, 8.4, 8.5**
  
  - [~] 6.4 Write property test for total count display
    - **Property 13: Summary statistics display correct totals**
    - **Validates: Requirements 8.1**
  
  - [~] 6.5 Write unit tests for summary stats component
    - Test all four metrics are displayed
    - Test percentages are formatted with one decimal place
    - Test component renders with zero applications
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 7. Implement export functionality
  - [x] 7.1 Create utils/funnelExport.ts
    - Implement exportToPNG function using Plotly.downloadImage
    - Implement exportToSVG function using Plotly.downloadImage
    - Implement exportToCSV function with custom CSV generation
    - Implement generateFilename function with date formatting
    - Add error handling and logging for all export functions
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.7, 7.8, 10.5, 10.6_
  
  - [x] 7.2 Create components/ExportControls.tsx
    - Define ExportControlsProps interface
    - Implement three export buttons (PNG, SVG, CSV)
    - Add loading states during export
    - Add error notification display
    - Wire up export handlers
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [~] 7.3 Write property test for PNG export
    - **Property 9: PNG export produces valid image**
    - **Validates: Requirements 7.2, 7.5**
  
  - [~] 7.4 Write property test for SVG export
    - **Property 10: SVG export produces valid vector file**
    - **Validates: Requirements 7.3**
  
  - [~] 7.5 Write property test for CSV export structure
    - **Property 11: CSV export contains correct structure**
    - **Validates: Requirements 7.4, 7.7**
  
  - [~] 7.6 Write property test for filename generation
    - **Property 12: Export filenames include date**
    - **Validates: Requirements 7.8**
  
  - [~] 7.7 Write property test for error logging
    - **Property 15: Error logging for all failures**
    - **Validates: Requirements 10.6**
  
  - [~] 7.8 Write unit tests for export functionality
    - Test PNG export button triggers correct handler
    - Test SVG export button triggers correct handler
    - Test CSV export button triggers correct handler
    - Test CSV includes correct headers
    - Test filename includes current date
    - Test error handling displays notification
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.7, 7.8, 10.5_

- [ ] 8. Create FunnelModal component
  - [x] 8.1 Create components/FunnelModal.tsx
    - Define FunnelModalProps interface
    - Implement modal overlay with backdrop
    - Implement modal content container with max-width
    - Add close button in top-right corner
    - Integrate SankeyDiagram component
    - Integrate SummaryStats component
    - Integrate ExportControls component
    - Implement close handlers (X button, backdrop click, Escape key)
    - Prevent body scroll when modal is open
    - Add responsive styling (full-screen on mobile)
    - Add error boundary and loading states
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 9.1, 9.2, 10.2, 10.3_
  
  - [~] 8.2 Write property test for modal responsiveness
    - **Property 14: Modal responsiveness at breakpoints**
    - **Validates: Requirements 6.8, 9.1, 9.2**
  
  - [~] 8.3 Write unit tests for modal component
    - Test modal opens when isOpen is true
    - Test modal closes when close button clicked
    - Test modal closes when backdrop clicked
    - Test modal closes when Escape key pressed
    - Test body scroll is prevented when modal open
    - Test modal displays error message when diagram fails
    - Test modal displays "no data" message when applications empty
    - Test modal is full-screen on mobile viewport
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 9.1, 9.2, 10.2, 10.3_

- [ ] 9. Checkpoint - Ensure modal and export work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Create FunnelButton component and integrate into Header
  - [x] 10.1 Create components/FunnelButton.tsx
    - Define FunnelButtonProps interface
    - Implement conditional rendering (only show if applications.length > 0)
    - Apply orange styling with hover effects
    - Add chart/funnel icon
    - Add "View Funnel" label
    - Add ARIA label for accessibility
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 11.1_
  
  - [x] 10.2 Integrate FunnelButton into Header component
    - Import FunnelButton and FunnelModal
    - Add state for modal open/close
    - Pass applications prop to FunnelButton
    - Render FunnelButton in header near other action buttons
    - Render FunnelModal with isOpen state
    - _Requirements: 1.2, 1.6_
  
  - [~] 10.3 Write property test for button visibility
    - **Property 1: Button visibility based on data presence**
    - **Validates: Requirements 1.2**
  
  - [~] 10.4 Write unit tests for FunnelButton component
    - Test button not rendered when applications array is empty
    - Test button rendered when applications array has items
    - Test button has orange background color
    - Test button displays correct label
    - Test button has ARIA label
    - Test button click triggers onClick handler
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 11.1_

- [ ] 11. Add accessibility features
  - [~] 11.1 Enhance FunnelModal with accessibility
    - Implement focus trap (keep focus within modal when open)
    - Add ARIA role="dialog" and aria-modal="true"
    - Add aria-labelledby for modal title
    - Ensure close button is keyboard accessible
    - Add visible focus indicators to all interactive elements
    - Add ARIA live region for modal open/close announcements
    - _Requirements: 11.2, 11.3, 11.5, 11.6, 11.7_
  
  - [~] 11.2 Enhance ExportControls with accessibility
    - Ensure all export buttons are keyboard accessible
    - Add ARIA labels to export buttons
    - Add visible focus indicators
    - _Requirements: 11.4, 11.6_
  
  - [~] 11.3 Write unit tests for accessibility features
    - Test modal has correct ARIA attributes
    - Test focus trap works (focus stays in modal)
    - Test close button responds to Enter and Space keys
    - Test export buttons respond to Enter and Space keys
    - Test all interactive elements have focus indicators
    - Test ARIA live region announces modal state changes
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

- [ ] 12. Add mobile touch support and final polish
  - [~] 12.1 Add touch event handlers for mobile
    - Add touch event handlers to SankeyDiagram for tooltip display
    - Ensure export buttons work with touch events
    - Test on mobile viewport sizes (375px, 414px, 768px)
    - _Requirements: 9.3, 9.4, 9.5_
  
  - [~] 12.2 Write unit tests for mobile interactions
    - Test touch events trigger tooltips
    - Test export buttons work with touch events
    - Test modal scales correctly on small screens
    - _Requirements: 9.4, 9.5_

- [ ] 13. Final checkpoint - End-to-end validation
  - Ensure all tests pass, ask the user if questions arise.
  - Verify button appears when applications exist
  - Verify clicking button opens modal with diagram
  - Verify all export formats work correctly
  - Verify modal closes via all methods (X, backdrop, Escape)
  - Verify responsive behavior on different screen sizes
  - Verify accessibility with keyboard navigation

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation uses TypeScript with React and Plotly.js
- Fast-check library is used for property-based testing with minimum 100 iterations per test
