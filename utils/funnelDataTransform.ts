import { Application, AppStatus } from '../types';
import { 
  FunnelStage, 
  STATUS_TO_STAGE_MAP, 
  Flow, 
  PlotlyData,
  STAGE_COLORS 
} from '../FunnelTypes';

/**
 * Maps an application status to a standardized funnel stage.
 * Returns UNKNOWN for undefined, null, or unrecognized status values.
 * 
 * @param status - The application status to map
 * @returns The corresponding FunnelStage
 */
export function mapStatusToStage(status: AppStatus | undefined | null): FunnelStage {
  if (!status) {
    return FunnelStage.UNKNOWN;
  }
  
  // Use hasOwnProperty to avoid prototype pollution issues
  if (Object.prototype.hasOwnProperty.call(STATUS_TO_STAGE_MAP, status)) {
    const mapped = STATUS_TO_STAGE_MAP[status];
    // Ensure the mapped value is actually a FunnelStage string
    if (typeof mapped === 'string' && Object.values(FunnelStage).includes(mapped as FunnelStage)) {
      return mapped;
    }
  }
  
  return FunnelStage.UNKNOWN;
}

/**
 * Groups applications by their funnel stage and counts them.
 * 
 * @param applications - Array of applications to group
 * @returns Map of FunnelStage to count
 */
export function groupByStage(applications: Application[]): Map<FunnelStage, number> {
  const counts = new Map<FunnelStage, number>();
  
  for (const app of applications) {
    const stage = mapStatusToStage(app.status);
    counts.set(stage, (counts.get(stage) || 0) + 1);
  }
  
  return counts;
}

/**
 * Calculates flows between stages based on application data.
 * For MVP: Creates simple flows from Applied to each outcome stage.
 * 
 * @param applications - Array of applications to analyze
 * @returns Array of Flow objects representing stage transitions
 */
export function calculateFlows(applications: Application[]): Flow[] {
  const flows: Flow[] = [];
  const stageCounts = groupByStage(applications);
  const totalApplied = applications.length;
  
  // If no applications, return empty flows
  if (totalApplied === 0) {
    return flows;
  }
  
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

/**
 * Gets the color for a link based on the target stage.
 * Returns a semi-transparent version of the target stage color.
 * 
 * @param targetStage - The target stage of the link
 * @returns Hex color string with opacity
 */
function getLinkColor(targetStage: FunnelStage): string {
  const baseColor = STAGE_COLORS[targetStage];
  return `${baseColor}80`; // Add 50% opacity
}

/**
 * Transforms application data into Plotly-compatible Sankey diagram format.
 * 
 * @param applications - Array of applications to transform
 * @returns PlotlyData object ready for rendering
 */
export function transformToPlotlyData(applications: Application[]): PlotlyData {
  const flows = calculateFlows(applications);
  
  // Create unique list of stages (nodes)
  const stageSet = new Set<FunnelStage>();
  stageSet.add(FunnelStage.APPLIED); // Always include Applied as the source
  
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
