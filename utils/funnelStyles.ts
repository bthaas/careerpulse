import { FunnelStage, STAGE_COLORS } from '../FunnelTypes';

/**
 * Gets the color for a link based on the target stage.
 * Returns a semi-transparent version (50% opacity) of the target stage color.
 * 
 * @param targetStage - The target stage of the link
 * @returns Hex color string with 80 suffix for 50% opacity
 */
export function getLinkColor(targetStage: FunnelStage): string {
  const baseColor = STAGE_COLORS[targetStage];
  return `${baseColor}80`; // Add 50% opacity (80 in hex)
}

/**
 * Formats a number with comma separators for thousands.
 * Numbers less than 1000 are returned as-is.
 * 
 * Examples:
 * - formatNumber(999) => "999"
 * - formatNumber(1000) => "1,000"
 * - formatNumber(1234567) => "1,234,567"
 * 
 * @param num - The number to format
 * @returns Formatted string with comma separators
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Formats a percentage to one decimal place.
 * 
 * Examples:
 * - formatPercentage(45.678) => "45.7%"
 * - formatPercentage(100) => "100.0%"
 * - formatPercentage(0) => "0.0%"
 * 
 * @param percentage - The percentage value to format
 * @returns Formatted percentage string with one decimal place
 */
export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(1)}%`;
}

/**
 * Re-export STAGE_COLORS for convenience
 */
export { STAGE_COLORS };
