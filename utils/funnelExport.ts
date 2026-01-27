import Plotly from 'plotly.js-basic-dist-min';
import { Application } from '../types';
import { calculateFlows } from './funnelDataTransform';

/**
 * Generates a filename with the current date in ISO format
 * 
 * @param prefix - Filename prefix (e.g., "job-funnel")
 * @param extension - File extension (e.g., "png", "svg", "csv")
 * @returns Formatted filename with date
 */
export function generateFilename(prefix: string, extension: string): string {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `${prefix}-${date}.${extension}`;
}

/**
 * Exports the Sankey diagram as a PNG image
 * 
 * @param elementId - ID of the Plotly graph div element
 * @returns Promise that resolves when export is complete
 */
export async function exportToPNG(elementId: string): Promise<void> {
  try {
    const filename = generateFilename('job-funnel', 'png');
    
    await Plotly.downloadImage(elementId, {
      format: 'png',
      filename: filename,
      height: 1080,
      width: 1920,
      scale: 2
    });
    
    console.log(`PNG export successful: ${filename}`);
  } catch (error) {
    console.error('PNG export failed:', error);
    throw new Error('Failed to export PNG. Please try again.');
  }
}

/**
 * Exports the Sankey diagram as an SVG file
 * 
 * @param elementId - ID of the Plotly graph div element
 * @returns Promise that resolves when export is complete
 */
export async function exportToSVG(elementId: string): Promise<void> {
  try {
    const filename = generateFilename('job-funnel', 'svg');
    
    await Plotly.downloadImage(elementId, {
      format: 'svg',
      filename: filename,
      height: 1080,
      width: 1920
    });
    
    console.log(`SVG export successful: ${filename}`);
  } catch (error) {
    console.error('SVG export failed:', error);
    throw new Error('Failed to export SVG. Please try again.');
  }
}

/**
 * Exports the funnel data as a CSV file
 * 
 * @param applications - Array of applications to export
 */
export function exportToCSV(applications: Application[]): void {
  try {
    const flows = calculateFlows(applications);
    
    // CSV headers
    const headers = ['Source Stage', 'Target Stage', 'Count', 'Conversion Rate'];
    
    // CSV rows
    const rows = flows.map(flow => [
      flow.source,
      flow.target,
      flow.count.toString(),
      `${flow.conversionRate.toFixed(1)}%`
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', generateFilename('job-funnel-data', 'csv'));
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('CSV export successful');
  } catch (error) {
    console.error('CSV export failed:', error);
    throw new Error('Failed to export CSV. Please try again.');
  }
}
