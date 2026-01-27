import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { mapStatusToStage, groupByStage, calculateFlows, transformToPlotlyData } from './funnelDataTransform';
import { Application, AppStatus } from '../types';
import { FunnelStage } from '../FunnelTypes';

// Configuration for property-based tests
const PBT_CONFIG = { numRuns: 20 };

// Arbitraries (generators) for property-based testing

/**
 * Generates valid AppStatus values
 */
const appStatusArbitrary = fc.constantFrom<AppStatus>(
  'Applied',
  'Interview',
  'Rejected',
  'Offer'
);

/**
 * Generates any status value including undefined and invalid values
 */
const anyStatusArbitrary = fc.oneof(
  appStatusArbitrary,
  fc.constant(undefined),
  fc.constant(null as any),
  fc.string().map(s => s as AppStatus) // Random strings as invalid statuses
);

/**
 * Generates a valid Application object
 */
const applicationArbitrary = fc.record({
  id: fc.string(),
  company: fc.string(),
  role: fc.string(),
  location: fc.string(),
  dateApplied: fc.string(),
  lastUpdate: fc.string(),
  status: appStatusArbitrary,
  source: fc.string(),
  sourceIcon: fc.string(),
  logoUrl: fc.string(),
  logoBgColor: fc.string(),
  logoTextColor: fc.string(),
  salary: fc.option(fc.string()),
  remotePolicy: fc.option(fc.string()),
  emailSubject: fc.option(fc.string()),
  emailBody: fc.option(fc.string()),
  notes: fc.option(fc.string()),
  createdAt: fc.option(fc.string())
}) as fc.Arbitrary<Application>;

/**
 * Generates an array of applications
 */
const applicationArrayArbitrary = fc.array(applicationArbitrary, { minLength: 0, maxLength: 100 });

describe('Property Tests: Stage Mapping and Data Transformation', () => {
  describe('Property 3: Stage mapping handles all status values', () => {
    test('**Validates: Requirements 3.5, 3.8** - mapStatusToStage should never throw for any input', () => {
      fc.assert(
        fc.property(
          anyStatusArbitrary,
          (status) => {
            // Should not throw an error
            let result: FunnelStage;
            expect(() => {
              result = mapStatusToStage(status);
            }).not.toThrow();
            
            // Should always return a valid FunnelStage string value
            const validStages = [
              FunnelStage.APPLIED,
              FunnelStage.INTERVIEW,
              FunnelStage.REJECTED,
              FunnelStage.OFFER,
              FunnelStage.UNKNOWN
            ];
            expect(validStages).toContain(result!);
            
            return true;
          }
        ),
        PBT_CONFIG
      );
    });

    test('**Validates: Requirements 3.5, 3.8** - mapStatusToStage returns UNKNOWN for undefined/null', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(undefined, null as any),
          (status) => {
            const result = mapStatusToStage(status);
            expect(result).toBe(FunnelStage.UNKNOWN);
            return true;
          }
        ),
        PBT_CONFIG
      );
    });

    test('**Validates: Requirements 3.5, 3.8** - mapStatusToStage returns UNKNOWN for unrecognized statuses', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !['Applied', 'Interview', 'Rejected', 'Offer'].includes(s)),
          (invalidStatus) => {
            const result = mapStatusToStage(invalidStatus as AppStatus);
            expect(result).toBe(FunnelStage.UNKNOWN);
            return true;
          }
        ),
        PBT_CONFIG
      );
    });

    test('**Validates: Requirements 3.1, 3.2, 3.3, 3.4** - mapStatusToStage correctly maps valid statuses', () => {
      fc.assert(
        fc.property(
          appStatusArbitrary,
          (status) => {
            const result = mapStatusToStage(status);
            
            // Verify correct mapping
            const expectedMappings: Record<AppStatus, FunnelStage> = {
              'Applied': FunnelStage.APPLIED,
              'Interview': FunnelStage.INTERVIEW,
              'Rejected': FunnelStage.REJECTED,
              'Offer': FunnelStage.OFFER
            };
            
            expect(result).toBe(expectedMappings[status]);
            return true;
          }
        ),
        PBT_CONFIG
      );
    });
  });

  describe('Property 2: Data transformation preserves application count', () => {
    test('**Validates: Requirements 2.2, 2.4, 2.6** - groupByStage preserves total count', () => {
      fc.assert(
        fc.property(
          applicationArrayArbitrary,
          (applications) => {
            const stageCounts = groupByStage(applications);
            
            // Sum of all stage counts should equal total applications
            const totalCount = Array.from(stageCounts.values()).reduce((sum, count) => sum + count, 0);
            expect(totalCount).toBe(applications.length);
            
            return true;
          }
        ),
        PBT_CONFIG
      );
    });

    test('**Validates: Requirements 2.2, 2.4, 2.6** - calculateFlows preserves total count', () => {
      fc.assert(
        fc.property(
          applicationArrayArbitrary.filter(apps => apps.length > 0),
          (applications) => {
            const flows = calculateFlows(applications);
            const stageCounts = groupByStage(applications);
            
            // Sum of all flow counts should equal total applications MINUS those in Applied stage
            // (since flows go FROM Applied TO other stages)
            const appliedCount = stageCounts.get(FunnelStage.APPLIED) || 0;
            const totalFlowCount = flows.reduce((sum, flow) => sum + flow.count, 0);
            expect(totalFlowCount).toBe(applications.length - appliedCount);
            
            return true;
          }
        ),
        PBT_CONFIG
      );
    });

    test('**Validates: Requirements 2.2, 2.4, 2.6** - transformToPlotlyData preserves total count', () => {
      fc.assert(
        fc.property(
          applicationArrayArbitrary.filter(apps => apps.length > 0),
          (applications) => {
            const plotlyData = transformToPlotlyData(applications);
            const stageCounts = groupByStage(applications);
            
            // Sum of all link values should equal total applications MINUS those in Applied stage
            const appliedCount = stageCounts.get(FunnelStage.APPLIED) || 0;
            const totalLinkValue = plotlyData.link.value.reduce((sum, val) => sum + val, 0);
            expect(totalLinkValue).toBe(applications.length - appliedCount);
            
            return true;
          }
        ),
        PBT_CONFIG
      );
    });

    test('**Validates: Requirements 2.2, 2.4, 2.6** - transformToPlotlyData handles empty arrays', () => {
      fc.assert(
        fc.property(
          fc.constant([]),
          (applications) => {
            const plotlyData = transformToPlotlyData(applications);
            
            // Should have at least the Applied node
            expect(plotlyData.node.label.length).toBeGreaterThanOrEqual(1);
            expect(plotlyData.node.label).toContain(FunnelStage.APPLIED);
            
            // Should have no links
            expect(plotlyData.link.value.length).toBe(0);
            
            return true;
          }
        ),
        PBT_CONFIG
      );
    });

    test('**Validates: Requirements 2.2, 2.4, 2.6** - node and link arrays have consistent lengths', () => {
      fc.assert(
        fc.property(
          applicationArrayArbitrary,
          (applications) => {
            const plotlyData = transformToPlotlyData(applications);
            
            // Node arrays should all have same length
            expect(plotlyData.node.label.length).toBe(plotlyData.node.color.length);
            
            // Link arrays should all have same length
            expect(plotlyData.link.source.length).toBe(plotlyData.link.target.length);
            expect(plotlyData.link.source.length).toBe(plotlyData.link.value.length);
            expect(plotlyData.link.source.length).toBe(plotlyData.link.color.length);
            
            return true;
          }
        ),
        PBT_CONFIG
      );
    });

    test('**Validates: Requirements 2.2, 2.4, 2.6** - link indices are valid node references', () => {
      fc.assert(
        fc.property(
          applicationArrayArbitrary,
          (applications) => {
            const plotlyData = transformToPlotlyData(applications);
            const nodeCount = plotlyData.node.label.length;
            
            // All source and target indices should be valid
            for (const sourceIdx of plotlyData.link.source) {
              expect(sourceIdx).toBeGreaterThanOrEqual(0);
              expect(sourceIdx).toBeLessThan(nodeCount);
            }
            
            for (const targetIdx of plotlyData.link.target) {
              expect(targetIdx).toBeGreaterThanOrEqual(0);
              expect(targetIdx).toBeLessThan(nodeCount);
            }
            
            return true;
          }
        ),
        PBT_CONFIG
      );
    });
  });

  describe('Additional Property Tests', () => {
    test('conversion rates are between 0 and 100', () => {
      fc.assert(
        fc.property(
          applicationArrayArbitrary.filter(apps => apps.length > 0),
          (applications) => {
            const flows = calculateFlows(applications);
            
            for (const flow of flows) {
              expect(flow.conversionRate).toBeGreaterThanOrEqual(0);
              expect(flow.conversionRate).toBeLessThanOrEqual(100);
            }
            
            return true;
          }
        ),
        PBT_CONFIG
      );
    });

    test('all flows have positive counts', () => {
      fc.assert(
        fc.property(
          applicationArrayArbitrary.filter(apps => apps.length > 0),
          (applications) => {
            const flows = calculateFlows(applications);
            
            for (const flow of flows) {
              expect(flow.count).toBeGreaterThan(0);
            }
            
            return true;
          }
        ),
        PBT_CONFIG
      );
    });

    test('groupByStage never returns negative counts', () => {
      fc.assert(
        fc.property(
          applicationArrayArbitrary,
          (applications) => {
            const stageCounts = groupByStage(applications);
            
            for (const count of stageCounts.values()) {
              expect(count).toBeGreaterThanOrEqual(0);
            }
            
            return true;
          }
        ),
        PBT_CONFIG
      );
    });
  });
});
