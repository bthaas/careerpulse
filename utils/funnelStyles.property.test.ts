import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { getLinkColor, STAGE_COLORS, formatNumber } from './funnelStyles';
import { FunnelStage } from '../FunnelTypes';

// Configuration for property-based tests
const PBT_CONFIG = { numRuns: 20 };

// Arbitraries (generators) for property-based testing

/**
 * Generates valid FunnelStage values
 */
const funnelStageArbitrary = fc.constantFrom<FunnelStage>(
  FunnelStage.APPLIED,
  FunnelStage.INTERVIEW,
  FunnelStage.REJECTED,
  FunnelStage.OFFER,
  FunnelStage.UNKNOWN
);

describe('Property Tests: Color Scheme', () => {
  describe('Property 5: Stage colors are unique and consistent', () => {
    test('**Validates: Requirements 4.4, 4.6** - each stage has a unique color', () => {
      fc.assert(
        fc.property(
          fc.constant(STAGE_COLORS),
          (stageColors) => {
            // Get all color values
            const colors = Object.values(stageColors);
            
            // Create a set to check uniqueness
            const uniqueColors = new Set(colors);
            
            // All colors should be unique
            expect(uniqueColors.size).toBe(colors.length);
            
            return true;
          }
        ),
        PBT_CONFIG
      );
    });

    test('**Validates: Requirements 4.4, 4.6** - same stage always returns same color', () => {
      fc.assert(
        fc.property(
          funnelStageArbitrary,
          (stage) => {
            // Get color multiple times
            const color1 = STAGE_COLORS[stage];
            const color2 = STAGE_COLORS[stage];
            const color3 = STAGE_COLORS[stage];
            
            // Should always be the same
            expect(color1).toBe(color2);
            expect(color2).toBe(color3);
            
            return true;
          }
        ),
        PBT_CONFIG
      );
    });

    test('**Validates: Requirements 4.4, 4.6** - all stage colors are valid hex colors', () => {
      fc.assert(
        fc.property(
          funnelStageArbitrary,
          (stage) => {
            const color = STAGE_COLORS[stage];
            
            // Should be a valid hex color (#RRGGBB format)
            expect(color).toMatch(/^#[0-9a-f]{6}$/i);
            
            return true;
          }
        ),
        PBT_CONFIG
      );
    });

    test('**Validates: Requirements 4.4, 4.6** - link colors are consistent for same stage', () => {
      fc.assert(
        fc.property(
          funnelStageArbitrary,
          (stage) => {
            // Get link color multiple times
            const linkColor1 = getLinkColor(stage);
            const linkColor2 = getLinkColor(stage);
            const linkColor3 = getLinkColor(stage);
            
            // Should always be the same
            expect(linkColor1).toBe(linkColor2);
            expect(linkColor2).toBe(linkColor3);
            
            return true;
          }
        ),
        PBT_CONFIG
      );
    });

    test('**Validates: Requirements 4.4, 4.6** - link colors have opacity suffix', () => {
      fc.assert(
        fc.property(
          funnelStageArbitrary,
          (stage) => {
            const linkColor = getLinkColor(stage);
            
            // Should be a valid hex color with opacity (#RRGGBB80 format)
            expect(linkColor).toMatch(/^#[0-9a-f]{6}80$/i);
            
            return true;
          }
        ),
        PBT_CONFIG
      );
    });

    test('**Validates: Requirements 4.4, 4.6** - link color is derived from stage color', () => {
      fc.assert(
        fc.property(
          funnelStageArbitrary,
          (stage) => {
            const stageColor = STAGE_COLORS[stage];
            const linkColor = getLinkColor(stage);
            
            // Link color should be stage color + opacity suffix
            expect(linkColor).toBe(`${stageColor}80`);
            
            return true;
          }
        ),
        PBT_CONFIG
      );
    });

    test('**Validates: Requirements 4.1, 4.2, 4.3** - positive stages have green tones', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(FunnelStage.INTERVIEW, FunnelStage.OFFER),
          (stage) => {
            const color = STAGE_COLORS[stage];
            
            // Extract RGB values from hex color
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            
            // Green should be the dominant color (higher than red and blue)
            expect(g).toBeGreaterThan(r);
            expect(g).toBeGreaterThan(b);
            
            return true;
          }
        ),
        PBT_CONFIG
      );
    });

    test('**Validates: Requirements 4.1, 4.2, 4.3** - rejected stage has red tone', () => {
      fc.assert(
        fc.property(
          fc.constant(FunnelStage.REJECTED),
          (stage) => {
            const color = STAGE_COLORS[stage];
            
            // Extract RGB values from hex color
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            
            // Red should be the dominant color (higher than green and blue)
            expect(r).toBeGreaterThan(g);
            expect(r).toBeGreaterThan(b);
            
            return true;
          }
        ),
        PBT_CONFIG
      );
    });

    test('**Validates: Requirements 4.1, 4.2, 4.3** - applied stage has neutral tone', () => {
      fc.assert(
        fc.property(
          fc.constant(FunnelStage.APPLIED),
          (stage) => {
            const color = STAGE_COLORS[stage];
            
            // Extract RGB values from hex color
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            
            // For neutral colors, RGB values should be relatively balanced
            // (no single channel should dominate by more than 50 points)
            const maxDiff = Math.max(
              Math.abs(r - g),
              Math.abs(g - b),
              Math.abs(r - b)
            );
            
            expect(maxDiff).toBeLessThanOrEqual(50);
            
            return true;
          }
        ),
        PBT_CONFIG
      );
    });
  });

  describe('Property 8: Number formatting includes separators', () => {
    test('**Validates: Requirements 5.6** - numbers > 999 include comma separators', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 10000000 }),
          (num) => {
            const formatted = formatNumber(num);
            
            // Should contain at least one comma
            expect(formatted).toMatch(/,/);
            
            // Should not contain spaces
            expect(formatted).not.toMatch(/\s/);
            
            return true;
          }
        ),
        PBT_CONFIG
      );
    });

    test('**Validates: Requirements 5.6** - numbers < 1000 have no separators', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 999 }),
          (num) => {
            const formatted = formatNumber(num);
            
            // Should not contain commas
            expect(formatted).not.toMatch(/,/);
            
            // Should be the number as a string
            expect(formatted).toBe(num.toString());
            
            return true;
          }
        ),
        PBT_CONFIG
      );
    });

    test('**Validates: Requirements 5.6** - formatted number can be parsed back', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000000 }),
          (num) => {
            const formatted = formatNumber(num);
            
            // Remove commas and parse back
            const parsed = parseInt(formatted.replace(/,/g, ''), 10);
            
            // Should equal original number
            expect(parsed).toBe(num);
            
            return true;
          }
        ),
        PBT_CONFIG
      );
    });

    test('**Validates: Requirements 5.6** - formatting is consistent', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000000 }),
          (num) => {
            // Format multiple times
            const formatted1 = formatNumber(num);
            const formatted2 = formatNumber(num);
            const formatted3 = formatNumber(num);
            
            // Should always be the same
            expect(formatted1).toBe(formatted2);
            expect(formatted2).toBe(formatted3);
            
            return true;
          }
        ),
        PBT_CONFIG
      );
    });
  });
});
