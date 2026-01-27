import { describe, test, expect } from 'vitest';
import { mapStatusToStage, groupByStage, calculateFlows, transformToPlotlyData } from './funnelDataTransform';
import { Application, AppStatus } from '../types';
import { FunnelStage } from '../FunnelTypes';

describe('Unit Tests: Stage Mapping and Data Transformation', () => {
  describe('mapStatusToStage', () => {
    test('maps Applied status to Applied stage', () => {
      const result = mapStatusToStage('Applied');
      expect(result).toBe(FunnelStage.APPLIED);
    });

    test('maps Interview status to Interview stage', () => {
      const result = mapStatusToStage('Interview');
      expect(result).toBe(FunnelStage.INTERVIEW);
    });

    test('maps Rejected status to Rejected stage', () => {
      const result = mapStatusToStage('Rejected');
      expect(result).toBe(FunnelStage.REJECTED);
    });

    test('maps Offer status to Offer stage', () => {
      const result = mapStatusToStage('Offer');
      expect(result).toBe(FunnelStage.OFFER);
    });

    test('maps undefined to Unknown stage', () => {
      const result = mapStatusToStage(undefined);
      expect(result).toBe(FunnelStage.UNKNOWN);
    });

    test('maps null to Unknown stage', () => {
      const result = mapStatusToStage(null);
      expect(result).toBe(FunnelStage.UNKNOWN);
    });

    test('maps unrecognized status to Unknown stage', () => {
      const result = mapStatusToStage('InvalidStatus' as AppStatus);
      expect(result).toBe(FunnelStage.UNKNOWN);
    });

    test('handles prototype pollution attempts', () => {
      const result = mapStatusToStage('valueOf' as AppStatus);
      expect(result).toBe(FunnelStage.UNKNOWN);
    });

    test('handles constructor property', () => {
      const result = mapStatusToStage('constructor' as AppStatus);
      expect(result).toBe(FunnelStage.UNKNOWN);
    });
  });

  describe('groupByStage', () => {
    test('groups applications by stage correctly', () => {
      const applications: Application[] = [
        createMockApplication('1', 'Applied'),
        createMockApplication('2', 'Interview'),
        createMockApplication('3', 'Applied'),
        createMockApplication('4', 'Rejected'),
        createMockApplication('5', 'Offer'),
      ];

      const result = groupByStage(applications);

      expect(result.get(FunnelStage.APPLIED)).toBe(2);
      expect(result.get(FunnelStage.INTERVIEW)).toBe(1);
      expect(result.get(FunnelStage.REJECTED)).toBe(1);
      expect(result.get(FunnelStage.OFFER)).toBe(1);
    });

    test('handles empty array', () => {
      const result = groupByStage([]);
      expect(result.size).toBe(0);
    });

    test('handles single application', () => {
      const applications: Application[] = [
        createMockApplication('1', 'Interview'),
      ];

      const result = groupByStage(applications);

      expect(result.get(FunnelStage.INTERVIEW)).toBe(1);
      expect(result.size).toBe(1);
    });

    test('handles all applications with same status', () => {
      const applications: Application[] = [
        createMockApplication('1', 'Applied'),
        createMockApplication('2', 'Applied'),
        createMockApplication('3', 'Applied'),
      ];

      const result = groupByStage(applications);

      expect(result.get(FunnelStage.APPLIED)).toBe(3);
      expect(result.size).toBe(1);
    });

    test('handles applications with undefined status', () => {
      const applications: Application[] = [
        createMockApplication('1', 'Applied'),
        { ...createMockApplication('2', 'Applied'), status: undefined as any },
      ];

      const result = groupByStage(applications);

      expect(result.get(FunnelStage.APPLIED)).toBe(1);
      expect(result.get(FunnelStage.UNKNOWN)).toBe(1);
    });
  });

  describe('calculateFlows', () => {
    test('creates flows from Applied to each outcome stage', () => {
      const applications: Application[] = [
        createMockApplication('1', 'Applied'),
        createMockApplication('2', 'Interview'),
        createMockApplication('3', 'Rejected'),
        createMockApplication('4', 'Offer'),
      ];

      const flows = calculateFlows(applications);

      expect(flows).toHaveLength(3); // Interview, Rejected, Offer (not Applied)
      
      const interviewFlow = flows.find(f => f.target === FunnelStage.INTERVIEW);
      expect(interviewFlow).toBeDefined();
      expect(interviewFlow?.count).toBe(1);
      expect(interviewFlow?.conversionRate).toBe(25); // 1/4 * 100

      const rejectedFlow = flows.find(f => f.target === FunnelStage.REJECTED);
      expect(rejectedFlow).toBeDefined();
      expect(rejectedFlow?.count).toBe(1);
      expect(rejectedFlow?.conversionRate).toBe(25);

      const offerFlow = flows.find(f => f.target === FunnelStage.OFFER);
      expect(offerFlow).toBeDefined();
      expect(offerFlow?.count).toBe(1);
      expect(offerFlow?.conversionRate).toBe(25);
    });

    test('returns empty array for empty applications', () => {
      const flows = calculateFlows([]);
      expect(flows).toHaveLength(0);
    });

    test('returns empty array when all applications are Applied', () => {
      const applications: Application[] = [
        createMockApplication('1', 'Applied'),
        createMockApplication('2', 'Applied'),
      ];

      const flows = calculateFlows(applications);
      expect(flows).toHaveLength(0);
    });

    test('calculates correct conversion rates', () => {
      const applications: Application[] = [
        createMockApplication('1', 'Applied'),
        createMockApplication('2', 'Applied'),
        createMockApplication('3', 'Interview'),
        createMockApplication('4', 'Interview'),
        createMockApplication('5', 'Offer'),
      ];

      const flows = calculateFlows(applications);

      const interviewFlow = flows.find(f => f.target === FunnelStage.INTERVIEW);
      expect(interviewFlow?.conversionRate).toBe(40); // 2/5 * 100

      const offerFlow = flows.find(f => f.target === FunnelStage.OFFER);
      expect(offerFlow?.conversionRate).toBe(20); // 1/5 * 100
    });

    test('all flows have Applied as source', () => {
      const applications: Application[] = [
        createMockApplication('1', 'Interview'),
        createMockApplication('2', 'Rejected'),
        createMockApplication('3', 'Offer'),
      ];

      const flows = calculateFlows(applications);

      for (const flow of flows) {
        expect(flow.source).toBe(FunnelStage.APPLIED);
      }
    });
  });

  describe('transformToPlotlyData', () => {
    test('transforms applications to Plotly format', () => {
      const applications: Application[] = [
        createMockApplication('1', 'Applied'),
        createMockApplication('2', 'Interview'),
        createMockApplication('3', 'Rejected'),
      ];

      const plotlyData = transformToPlotlyData(applications);

      expect(plotlyData.type).toBe('sankey');
      expect(plotlyData.orientation).toBe('h');
      expect(plotlyData.node.label).toContain(FunnelStage.APPLIED);
      expect(plotlyData.node.label).toContain(FunnelStage.INTERVIEW);
      expect(plotlyData.node.label).toContain(FunnelStage.REJECTED);
    });

    test('includes Applied node even with empty applications', () => {
      const plotlyData = transformToPlotlyData([]);

      expect(plotlyData.node.label).toContain(FunnelStage.APPLIED);
      expect(plotlyData.link.value).toHaveLength(0);
    });

    test('node colors match stage colors', () => {
      const applications: Application[] = [
        createMockApplication('1', 'Interview'),
        createMockApplication('2', 'Rejected'),
      ];

      const plotlyData = transformToPlotlyData(applications);

      // Check that each node has a color
      expect(plotlyData.node.color.length).toBe(plotlyData.node.label.length);
      
      // All colors should be valid hex colors
      for (const color of plotlyData.node.color) {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });

    test('link colors have opacity', () => {
      const applications: Application[] = [
        createMockApplication('1', 'Interview'),
        createMockApplication('2', 'Rejected'),
      ];

      const plotlyData = transformToPlotlyData(applications);

      // Link colors should have opacity (80 suffix)
      for (const color of plotlyData.link.color) {
        expect(color).toMatch(/^#[0-9a-f]{6}80$/i);
      }
    });

    test('link indices reference valid nodes', () => {
      const applications: Application[] = [
        createMockApplication('1', 'Interview'),
        createMockApplication('2', 'Rejected'),
      ];

      const plotlyData = transformToPlotlyData(applications);
      const nodeCount = plotlyData.node.label.length;

      for (let i = 0; i < plotlyData.link.source.length; i++) {
        expect(plotlyData.link.source[i]).toBeGreaterThanOrEqual(0);
        expect(plotlyData.link.source[i]).toBeLessThan(nodeCount);
        expect(plotlyData.link.target[i]).toBeGreaterThanOrEqual(0);
        expect(plotlyData.link.target[i]).toBeLessThan(nodeCount);
      }
    });

    test('handles large dataset', () => {
      const applications: Application[] = [];
      for (let i = 0; i < 1000; i++) {
        const statuses: AppStatus[] = ['Applied', 'Interview', 'Rejected', 'Offer'];
        const status = statuses[i % 4];
        applications.push(createMockApplication(String(i), status));
      }

      const plotlyData = transformToPlotlyData(applications);

      expect(plotlyData.node.label.length).toBeGreaterThan(0);
      expect(plotlyData.link.value.length).toBeGreaterThan(0);
      
      // Verify data integrity
      const totalLinkValue = plotlyData.link.value.reduce((sum, val) => sum + val, 0);
      expect(totalLinkValue).toBe(750); // 1000 - 250 Applied
    });
  });
});

// Helper function to create mock applications
function createMockApplication(id: string, status: AppStatus): Application {
  return {
    id,
    company: `Company ${id}`,
    role: `Role ${id}`,
    location: 'Remote',
    dateApplied: '2024-01-01',
    lastUpdate: '2024-01-01',
    status,
    source: 'LinkedIn',
    sourceIcon: 'link',
    logoUrl: 'https://example.com/logo.png',
    logoBgColor: 'bg-blue-100',
    logoTextColor: 'text-blue-600',
  };
}
