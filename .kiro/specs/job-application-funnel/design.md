# Design Document: Job Application Funnel Visualization

## Overview

This feature adds a visual analytics capability to the job application tracker using a Sankey diagram to represent the flow of applications through various stages of the hiring process. The implementation uses React with Plotly.js for rendering interactive, exportable visualizations.

The feature consists of three main components:
1. **FunnelButton**: A conditional button in the header that triggers the visualization
2. **FunnelModal**: A modal dialog containing the visualization and controls
3. **SankeyDiagram**: The core visualization component using Plotly.js

The design emphasizes simplicity in the initial implementation while maintaining extensibility for future enhancements like detailed stage breakdowns and historical trend analysis.

## Architecture

### Component Hierarchy

```
App (existing)
└── Header (existing)
    └── FunnelButton (new)
        └── FunnelModal (new)
            ├── SankeyDiagram (new)
            ├── SummaryStats (new)
            └── ExportControls (new)
```

### Data Flow

1. **Application Data**: Flows from App state → FunnelButton → FunnelModal → SankeyDiagram
2. **Stage Mapping**: Raw application statuses are transformed into standardized funnel stages
3. **Diagram Data**: Transformed into Plotly-compatible format (nodes and links)
4. **Export Actions**: Triggered from ExportControls, processed by utility functions

### Technology Stack

- **Visualization Library**: [Plotly.js](https://plotly.com/javascript/) via react-plotly.js
  - Chosen for built-in Sankey diagram support
  - Interactive tooltips out of the box
  - Export functionality included
  - Smaller bundle size than full D3.js implementation
  - Active maintenance and React integration

- **Export Formats**:
  - PNG: Using Plotly's built-in `Plotly.downloadImage()`
  - SVG: Using Plotly's built-in `Plotly.downloadImage()` with format option
  - CSV: Custom implementation using browser download API

## Components and Interfaces

### 1. FunnelButton Component

**Purpose**: Conditionally rendered button in the header that opens the funnel visualization.

**Props**:
```typescript
interface FunnelButtonProps {
  applications: Application[];
  onClick: () => void;
}
```

**Behavior**:
- Renders only when `applications.length > 0`
- Orange background (`bg-orange-500`) with hover effects
- Icon: Chart/funnel icon from Material Icons or similar
- Label: "View Funnel" or "Pipeline Analytics"
- Positioned in Header component near existing action buttons

**Styling**:
```typescript
className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg 
           flex items-center gap-2 transition-colors duration-200"
```

### 2. FunnelModal Component

**Purpose**: Modal dialog that contains the visualization and controls.

**Props**:
```typescript
interface FunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: Application[];
}
```

**State**:
```typescript
interface FunnelModalState {
  isLoading: boolean;
  error: string | null;
}
```

**Behavior**:
- Full-screen overlay with semi-transparent backdrop
- Centered content area (max-width: 1400px)
- Close on:
  - X button click
  - Backdrop click
  - Escape key press
- Prevents body scroll when open
- Responsive: Full-screen on mobile (<768px)

**Layout**:
```
┌─────────────────────────────────────────┐
│ [X]                    Job Funnel       │
├─────────────────────────────────────────┤
│                                         │
│         [Sankey Diagram]                │
│                                         │
├─────────────────────────────────────────┤
│ Summary Stats                           │
│ Total: 150 | Response: 45% | Offer: 8% │
├─────────────────────────────────────────┤
│ [PNG] [SVG] [CSV]                       │
└─────────────────────────────────────────┘
```

### 3. SankeyDiagram Component

**Purpose**: Renders the interactive Sankey diagram using Plotly.js.

**Props**:
```typescript
interface SankeyDiagramProps {
  applications: Application[];
  width?: number;
  height?: number;
}
```

**Internal Data Structures**:
```typescript
interface PlotlyNode {
  label: string;
  color: string;
  pad: number;
  thickness: number;
}

interface PlotlyLink {
  source: number;  // Index into nodes array
  target: number;  // Index into nodes array
  value: number;   // Number of applications
  color: string;
}

interface PlotlyData {
  type: 'sankey';
  orientation: 'h';
  node: {
    label: string[];
    color: string[];
    pad: number;
    thickness: number;
  };
  link: {
    source: number[];
    target: number[];
    value: number[];
    color: string[];
  };
}
```

**Behavior**:
- Transforms application data into Plotly format
- Configures interactive tooltips
- Handles responsive sizing
- Applies color scheme based on stage type

### 4. SummaryStats Component

**Purpose**: Displays key metrics about the job search pipeline.

**Props**:
```typescript
interface SummaryStatsProps {
  applications: Application[];
}
```

**Calculated Metrics**:
```typescript
interface PipelineMetrics {
  totalApplications: number;
  responseRate: number;      // % that moved beyond "Applied"
  interviewRate: number;      // % that reached "Interview"
  offerRate: number;          // % that reached "Offer"
}
```

**Display Format**:
- Grid layout with 4 metric cards
- Each card shows: Label, Value, Percentage (where applicable)
- Color-coded: Green for positive metrics, neutral for totals

### 5. ExportControls Component

**Purpose**: Provides buttons for exporting the visualization.

**Props**:
```typescript
interface ExportControlsProps {
  onExportPNG: () => void;
  onExportSVG: () => void;
  onExportCSV: () => void;
}
```

**Behavior**:
- Three buttons: PNG, SVG, CSV
- Disabled state during export operation
- Loading indicator on active export
- Error handling with user notification

## Data Models

### Stage Mapping

The system maps application statuses to standardized funnel stages:

```typescript
enum FunnelStage {
  APPLIED = 'Applied',
  INTERVIEW = 'Interview',
  REJECTED = 'Rejected',
  OFFER = 'Offer',
  UNKNOWN = 'Unknown'
}

const STATUS_TO_STAGE_MAP: Record<AppStatus, FunnelStage> = {
  'Applied': FunnelStage.APPLIED,
  'Interview': FunnelStage.INTERVIEW,
  'Rejected': FunnelStage.REJECTED,
  'Offer': FunnelStage.OFFER
};

function mapStatusToStage(status: AppStatus | undefined): FunnelStage {
  if (!status) return FunnelStage.UNKNOWN;
  return STATUS_TO_STAGE_MAP[status] || FunnelStage.UNKNOWN;
}
```

### Flow Calculation

Applications flow through stages based on their current status. The system calculates flows by:

1. **Grouping**: Count applications by current stage
2. **Flow Generation**: Create flows from "Applied" to each outcome stage
3. **Conversion Rates**: Calculate percentage of applications reaching each stage

```typescript
interface StageCount {
  stage: FunnelStage;
  count: number;
}

interface Flow {
  source: FunnelStage;
  target: FunnelStage;
  count: number;
  conversionRate: number;
}

function calculateFlows(applications: Application[]): Flow[] {
  // Group applications by stage
  const stageCounts = groupByStage(applications);
  
  // Generate flows
  // For MVP: Simple flow from Applied to each outcome
  const flows: Flow[] = [];
  const totalApplied = applications.length;
  
  for (const [stage, count] of Object.entries(stageCounts)) {
    if (stage !== FunnelStage.APPLIED) {
      flows.push({
        source: FunnelStage.APPLIED,
        target: stage as FunnelStage,
        count: count,
        conversionRate: (count / totalApplied) * 100
      });
    }
  }
  
  return flows;
}
```

### Color Scheme

```typescript
const STAGE_COLORS: Record<FunnelStage, string> = {
  [FunnelStage.APPLIED]: '#94a3b8',      // Slate-400 (neutral)
  [FunnelStage.INTERVIEW]: '#22c55e',    // Green-500 (positive)
  [FunnelStage.OFFER]: '#10b981',        // Emerald-500 (very positive)
  [FunnelStage.REJECTED]: '#ef4444',     // Red-500 (negative)
  [FunnelStage.UNKNOWN]: '#6b7280'       // Gray-500 (neutral)
};

// Link colors are semi-transparent versions of target stage colors
function getLinkColor(targetStage: FunnelStage): string {
  const baseColor = STAGE_COLORS[targetStage];
  return `${baseColor}80`; // Add 50% opacity
}
```

### Plotly Configuration

```typescript
const PLOTLY_CONFIG = {
  displayModeBar: true,
  displaylogo: false,
  modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
  responsive: true,
  toImageButtonOptions: {
    format: 'png',
    filename: `job-funnel-${new Date().toISOString().split('T')[0]}`,
    height: 1080,
    width: 1920,
    scale: 2
  }
};

const PLOTLY_LAYOUT = {
  title: {
    text: 'Job Application Funnel',
    font: { size: 24 }
  },
  font: { size: 14 },
  margin: { l: 20, r: 20, t: 60, b: 20 },
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'transparent'
};
```

## Data Transformation Pipeline

### Step 1: Application Data → Stage Counts

```typescript
function groupByStage(applications: Application[]): Map<FunnelStage, number> {
  const counts = new Map<FunnelStage, number>();
  
  for (const app of applications) {
    const stage = mapStatusToStage(app.status);
    counts.set(stage, (counts.get(stage) || 0) + 1);
  }
  
  return counts;
}
```

### Step 2: Stage Counts → Flows

```typescript
function generateFlows(stageCounts: Map<FunnelStage, number>): Flow[] {
  const flows: Flow[] = [];
  const totalApplied = Array.from(stageCounts.values())
    .reduce((sum, count) => sum + count, 0);
  
  // Create flow from Applied to each outcome stage
  for (const [stage, count] of stageCounts.entries()) {
    if (stage !== FunnelStage.APPLIED) {
      flows.push({
        source: FunnelStage.APPLIED,
        target: stage,
        count: count,
        conversionRate: (count / totalApplied) * 100
      });
    }
  }
  
  return flows;
}
```

### Step 3: Flows → Plotly Data

```typescript
function transformToPlotlyData(flows: Flow[]): PlotlyData {
  // Create unique list of stages (nodes)
  const stageSet = new Set<FunnelStage>();
  stageSet.add(FunnelStage.APPLIED); // Always include Applied
  
  flows.forEach(flow => {
    stageSet.add(flow.source);
    stageSet.add(flow.target);
  });
  
  const stages = Array.from(stageSet);
  const stageToIndex = new Map(stages.map((stage, i) => [stage, i]));
  
  // Build Plotly data structure
  return {
    type: 'sankey',
    orientation: 'h',
    node: {
      label: stages,
      color: stages.map(stage => STAGE_COLORS[stage]),
      pad: 15,
      thickness: 30
    },
    link: {
      source: flows.map(f => stageToIndex.get(f.source)!),
      target: flows.map(f => stageToIndex.get(f.target)!),
      value: flows.map(f => f.count),
      color: flows.map(f => getLinkColor(f.target))
    }
  };
}
```

## Error Handling

### Error Scenarios

1. **No Applications**: Display message "No applications to visualize"
2. **All Same Status**: Display simplified view with single stage
3. **Plotly Load Failure**: Display error with fallback to text summary
4. **Export Failure**: Show error notification, allow retry
5. **Invalid Data**: Filter out invalid applications, log warning

### Error Boundaries

```typescript
class FunnelErrorBoundary extends React.Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Funnel visualization error:', error, errorInfo);
    this.setState({ hasError: true, error: error.message });
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <p className="text-red-600">Failed to load visualization</p>
          <p className="text-sm text-gray-600">{this.state.error}</p>
          <button onClick={this.props.onClose}>Close</button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

## Testing Strategy

The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage.

### Unit Testing

Unit tests focus on specific examples, edge cases, and integration points:

1. **Component Rendering**:
   - FunnelButton renders when applications exist
   - FunnelButton hidden when no applications
   - Modal opens/closes correctly
   - Export buttons trigger correct handlers

2. **Data Transformation**:
   - Status mapping for known statuses
   - Unknown status handling
   - Empty application list
   - Single application

3. **Export Functionality**:
   - PNG export generates file
   - SVG export generates file
   - CSV export contains correct headers
   - Filename includes date

4. **Edge Cases**:
   - All applications have same status
   - Applications with missing status
   - Very large datasets (1000+ applications)
   - Mobile viewport rendering

### Property-Based Testing

Property-based tests verify universal properties across all inputs using a PBT library (fast-check for TypeScript/JavaScript). Each test should run a minimum of 100 iterations.

**PBT Library**: fast-check (npm package)
- Mature, well-maintained library for JavaScript/TypeScript
- Excellent React integration
- Built-in generators for common data types
- Shrinking support for minimal failing examples

**Test Configuration**:
```typescript
import fc from 'fast-check';

// Run each property test with 100 iterations minimum
const PBT_CONFIG = { numRuns: 100 };
```

**Property Test Tagging**:
Each property test must include a comment tag referencing the design property:
```typescript
// Feature: job-application-funnel, Property 1: Stage mapping preserves count
test('property: stage mapping preserves application count', () => {
  fc.assert(
    fc.property(
      applicationArrayArbitrary,
      (applications) => {
        // Test implementation
      }
    ),
    PBT_CONFIG
  );
});
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Button visibility based on data presence

*For any* application list, the Funnel Button should be visible if and only if the list contains at least one application.

**Validates: Requirements 1.2**

### Property 2: Data transformation preserves application count

*For any* set of applications, when transformed into Sankey diagram data (nodes and links), the sum of all flow values should equal the total number of applications.

**Validates: Requirements 2.2, 2.4, 2.6**

### Property 3: Stage mapping handles all status values

*For any* application status value (including undefined, null, or unrecognized values), the stage mapping function should return a valid FunnelStage without throwing an error.

**Validates: Requirements 3.5, 3.8**

### Property 4: Conversion rate calculations are accurate

*For any* set of applications, the calculated conversion rates (response rate, interview rate, offer rate) should be mathematically correct percentages based on the stage counts, rounded to one decimal place.

**Validates: Requirements 3.7, 8.2, 8.3, 8.4, 8.5**

### Property 5: Stage colors are unique and consistent

*For any* Sankey diagram rendering, each stage should have a unique color, and the same stage should always have the same color across multiple renderings.

**Validates: Requirements 4.4, 4.6**

### Property 6: Node tooltips contain complete information

*For any* stage node in the diagram, the tooltip should contain both the stage name and the count of applications at that stage.

**Validates: Requirements 5.1**

### Property 7: Link tooltips contain complete information

*For any* flow link in the diagram, the tooltip should contain the source stage, target stage, application count, and conversion rate.

**Validates: Requirements 5.2**

### Property 8: Number formatting includes separators

*For any* number displayed in tooltips or statistics (greater than 999), the formatted string should include comma separators (e.g., "1,234" not "1234").

**Validates: Requirements 5.6**

### Property 9: PNG export produces valid image

*For any* Sankey diagram, clicking the PNG export button should generate a downloadable PNG file with dimensions of at least 1920x1080 pixels.

**Validates: Requirements 7.2, 7.5**

### Property 10: SVG export produces valid vector file

*For any* Sankey diagram, clicking the SVG export button should generate a downloadable SVG file that can be opened and scaled in vector graphics software.

**Validates: Requirements 7.3**

### Property 11: CSV export contains correct structure

*For any* application data, the exported CSV file should include headers "Source Stage", "Target Stage", "Count", "Conversion Rate" and contain one row per flow with correctly formatted data.

**Validates: Requirements 7.4, 7.7**

### Property 12: Export filenames include date

*For any* export operation (PNG, SVG, or CSV), the generated filename should include the current date in ISO format (YYYY-MM-DD).

**Validates: Requirements 7.8**

### Property 13: Summary statistics display correct totals

*For any* set of applications, the displayed total applications count should equal the length of the application array.

**Validates: Requirements 8.1**

### Property 14: Modal responsiveness at breakpoints

*For any* screen width less than 768px, the modal should apply full-screen styling; for widths 768px or greater, the modal should use centered layout with max-width.

**Validates: Requirements 6.8, 9.1, 9.2**

### Property 15: Error logging for all failures

*For any* error that occurs during diagram generation, data transformation, or export operations, an error message should be logged to the console with sufficient detail for debugging.

**Validates: Requirements 10.6**

### Property 16: Diagram generation from any valid data

*For any* non-empty array of applications (regardless of status values or missing fields), the system should successfully generate a Sankey diagram without crashing.

**Validates: Requirements 2.1, 3.8**
