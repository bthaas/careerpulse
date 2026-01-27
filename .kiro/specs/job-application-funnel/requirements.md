# Requirements Document: Job Application Funnel Visualization

## Introduction

This feature adds a visual analytics capability to the job application tracker, enabling users to understand their job search pipeline through an interactive Sankey diagram. The visualization shows the flow of applications through various stages from initial application to final outcomes, helping users identify bottlenecks, track conversion rates, and make data-driven decisions about their job search strategy.

## Glossary

- **System**: The job application tracking web application
- **Sankey_Diagram**: A flow diagram where the width of arrows is proportional to the flow quantity, used to visualize the progression of applications through stages
- **Funnel_Button**: An orange-colored button in the application header that triggers the visualization modal
- **Visualization_Modal**: A modal dialog that displays the Sankey diagram and export controls
- **Application_Stage**: A discrete step in the job application process (e.g., Applied, Phone Screen, Interview, Offer)
- **Flow**: A connection between two stages in the Sankey diagram representing applications moving from one stage to another
- **Conversion_Rate**: The percentage of applications that progress from one stage to the next
- **Export_Format**: A file format for saving the visualization (PNG, SVG, or CSV)
- **Stage_Mapping**: The process of converting application status values to standardized funnel stages
- **Tooltip**: An interactive overlay that displays detailed information when hovering over diagram elements

## Requirements

### Requirement 1: Funnel Button Display

**User Story:** As a user, I want to see a clearly labeled button to access the application funnel visualization, so that I can easily analyze my job search pipeline.

#### Acceptance Criteria

1. WHEN the application loads AND no applications exist, THE System SHALL NOT display the Funnel_Button
2. WHEN at least one application exists in the database, THE System SHALL display the Funnel_Button in the header area
3. THE Funnel_Button SHALL have an orange background color consistent with the application's design system
4. THE Funnel_Button SHALL display a clear label indicating its purpose (e.g., "View Application Funnel" or "Pipeline Analytics")
5. WHEN a user hovers over the Funnel_Button, THE System SHALL provide visual feedback (e.g., darker shade, shadow)
6. THE Funnel_Button SHALL be positioned prominently in the header, near other action buttons

### Requirement 2: Sankey Diagram Generation

**User Story:** As a user, I want to see a Sankey diagram of my application pipeline, so that I can visualize how my applications flow through different stages.

#### Acceptance Criteria

1. WHEN the Funnel_Button is clicked, THE System SHALL generate a Sankey_Diagram from the current application data
2. THE Sankey_Diagram SHALL display all relevant application stages as nodes
3. THE Sankey_Diagram SHALL display flows between stages with widths proportional to the number of applications
4. WHEN an application has a status that maps to a stage, THE System SHALL include it in the corresponding flow
5. THE Sankey_Diagram SHALL use a left-to-right layout showing progression through the pipeline
6. THE System SHALL calculate and display the total number of applications at each stage
7. THE Sankey_Diagram SHALL render within 2 seconds for datasets up to 500 applications

### Requirement 3: Stage Mapping and Data Processing

**User Story:** As a user, I want my application statuses to be intelligently mapped to funnel stages, so that the visualization accurately represents my job search progress.

#### Acceptance Criteria

1. THE System SHALL map the "Applied" status to an "Applied" stage
2. THE System SHALL map the "Interview" status to an "Interview" stage
3. THE System SHALL map the "Rejected" status to a "Rejected" stage
4. THE System SHALL map the "Offer" status to an "Offer" stage
5. WHEN an application has no status or an unrecognized status, THE System SHALL map it to an "Unknown" stage
6. THE System SHALL support future expansion to include intermediate stages (e.g., "Phone Screen", "Technical Interview", "Onsite")
7. THE System SHALL calculate conversion rates between consecutive stages
8. THE System SHALL handle applications with missing or incomplete data without crashing

### Requirement 4: Visual Design and Color Coding

**User Story:** As a user, I want the funnel visualization to use intuitive colors, so that I can quickly understand positive and negative outcomes.

#### Acceptance Criteria

1. THE System SHALL use green color tones for positive outcome stages (Interview, Offer)
2. THE System SHALL use red color tones for negative outcome stages (Rejected)
3. THE System SHALL use neutral gray or blue tones for initial stages (Applied)
4. THE System SHALL use distinct colors for each stage to ensure visual differentiation
5. THE System SHALL ensure color choices meet WCAG AA accessibility standards for contrast
6. THE System SHALL maintain consistent color coding across all diagram elements

### Requirement 5: Interactive Tooltips

**User Story:** As a user, I want to see detailed information when I hover over diagram elements, so that I can understand exact numbers and percentages.

#### Acceptance Criteria

1. WHEN a user hovers over a stage node, THE System SHALL display a Tooltip showing the stage name and total count
2. WHEN a user hovers over a flow connection, THE System SHALL display a Tooltip showing the source stage, target stage, count, and conversion rate
3. THE Tooltip SHALL appear within 200 milliseconds of hover
4. THE Tooltip SHALL disappear when the user moves the cursor away
5. THE Tooltip SHALL be positioned to avoid obscuring other diagram elements
6. THE Tooltip SHALL display numbers formatted with appropriate separators (e.g., "1,234" not "1234")

### Requirement 6: Modal Display and Interaction

**User Story:** As a user, I want the funnel visualization to appear in a modal dialog, so that I can focus on the analytics without losing my place in the application.

#### Acceptance Criteria

1. WHEN the Funnel_Button is clicked, THE System SHALL open the Visualization_Modal
2. THE Visualization_Modal SHALL display the Sankey_Diagram prominently
3. THE Visualization_Modal SHALL include a close button (X icon) in the top-right corner
4. WHEN the close button is clicked, THE System SHALL close the Visualization_Modal
5. WHEN the user clicks outside the modal content area, THE System SHALL close the Visualization_Modal
6. WHEN the Escape key is pressed, THE System SHALL close the Visualization_Modal
7. THE Visualization_Modal SHALL prevent scrolling of the background content while open
8. THE Visualization_Modal SHALL be responsive and adapt to different screen sizes

### Requirement 7: Export Functionality

**User Story:** As a user, I want to export the funnel visualization in multiple formats, so that I can share it or include it in reports.

#### Acceptance Criteria

1. THE Visualization_Modal SHALL display export buttons for PNG, SVG, and CSV formats
2. WHEN the PNG export button is clicked, THE System SHALL generate and download a PNG image of the Sankey_Diagram
3. WHEN the SVG export button is clicked, THE System SHALL generate and download an SVG file of the Sankey_Diagram
4. WHEN the CSV export button is clicked, THE System SHALL generate and download a CSV file containing the stage data and flow counts
5. THE exported PNG SHALL have a resolution of at least 1920x1080 pixels
6. THE exported SVG SHALL be scalable and maintain visual quality at any size
7. THE exported CSV SHALL include headers: "Source Stage", "Target Stage", "Count", "Conversion Rate"
8. THE System SHALL use descriptive filenames including the current date (e.g., "job-funnel-2024-01-15.png")

### Requirement 8: Summary Statistics Display

**User Story:** As a user, I want to see key metrics about my job search, so that I can quickly assess my overall performance.

#### Acceptance Criteria

1. THE Visualization_Modal SHALL display the total number of applications
2. THE Visualization_Modal SHALL display the overall response rate (percentage of applications that progressed beyond "Applied")
3. THE Visualization_Modal SHALL display the interview rate (percentage of applications that reached "Interview" stage)
4. THE Visualization_Modal SHALL display the offer rate (percentage of applications that reached "Offer" stage)
5. THE System SHALL calculate percentages rounded to one decimal place
6. THE System SHALL display statistics in a clear, readable format separate from the diagram

### Requirement 9: Responsive Design

**User Story:** As a user, I want to view the funnel visualization on different devices, so that I can analyze my job search on mobile or tablet.

#### Acceptance Criteria

1. WHEN the Visualization_Modal is displayed on a screen width less than 768px, THE System SHALL adjust the modal to full-screen
2. WHEN the Visualization_Modal is displayed on a screen width less than 768px, THE System SHALL scale the Sankey_Diagram to fit the available width
3. THE System SHALL maintain diagram readability on screens as small as 375px wide
4. THE System SHALL support touch interactions for tooltips on mobile devices
5. THE export buttons SHALL remain accessible and functional on mobile devices

### Requirement 10: Performance and Error Handling

**User Story:** As a user, I want the visualization to load quickly and handle errors gracefully, so that I have a reliable experience.

#### Acceptance Criteria

1. WHEN the Funnel_Button is clicked, THE System SHALL display a loading indicator if diagram generation takes longer than 500 milliseconds
2. WHEN diagram generation fails, THE System SHALL display an error message in the modal
3. WHEN no applications exist, THE System SHALL display a message indicating insufficient data for visualization
4. THE System SHALL handle datasets of up to 1000 applications without performance degradation
5. WHEN an error occurs during export, THE System SHALL display an error notification and allow the user to retry
6. THE System SHALL log errors to the console for debugging purposes

### Requirement 11: Accessibility

**User Story:** As a user with accessibility needs, I want the funnel visualization to be accessible, so that I can use assistive technologies to understand my job search data.

#### Acceptance Criteria

1. THE Funnel_Button SHALL have an appropriate ARIA label describing its function
2. THE Visualization_Modal SHALL trap keyboard focus while open
3. THE close button SHALL be keyboard accessible (focusable and activatable with Enter/Space)
4. THE export buttons SHALL be keyboard accessible
5. THE System SHALL provide text alternatives for the visual diagram (e.g., summary statistics, data table)
6. THE System SHALL ensure all interactive elements have visible focus indicators
7. THE System SHALL support screen reader announcements when the modal opens and closes
