import { describe, test, expect } from 'vitest';
import { STAGE_COLORS, getLinkColor, formatNumber, formatPercentage } from './funnelStyles';
import { FunnelStage } from '../FunnelTypes';

describe('Unit Tests: Color Assignments', () => {
  describe('Requirements 4.1, 4.2, 4.3 - Color tone validation', () => {
    test('Interview stage has green tone', () => {
      const color = STAGE_COLORS[FunnelStage.INTERVIEW];
      
      // Extract RGB values
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      
      // Green should be dominant
      expect(g).toBeGreaterThan(r);
      expect(g).toBeGreaterThan(b);
    });

    test('Offer stage has green tone', () => {
      const color = STAGE_COLORS[FunnelStage.OFFER];
      
      // Extract RGB values
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      
      // Green should be dominant
      expect(g).toBeGreaterThan(r);
      expect(g).toBeGreaterThan(b);
    });

    test('Rejected stage has red tone', () => {
      const color = STAGE_COLORS[FunnelStage.REJECTED];
      
      // Extract RGB values
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      
      // Red should be dominant
      expect(r).toBeGreaterThan(g);
      expect(r).toBeGreaterThan(b);
    });

    test('Applied stage has neutral tone', () => {
      const color = STAGE_COLORS[FunnelStage.APPLIED];
      
      // Extract RGB values
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      
      // RGB values should be relatively balanced (no channel dominates by > 50)
      const maxDiff = Math.max(
        Math.abs(r - g),
        Math.abs(g - b),
        Math.abs(r - b)
      );
      
      expect(maxDiff).toBeLessThanOrEqual(50);
    });
  });

  describe('Link color generation', () => {
    test('link color adds opacity to stage color', () => {
      const stage = FunnelStage.INTERVIEW;
      const stageColor = STAGE_COLORS[stage];
      const linkColor = getLinkColor(stage);
      
      expect(linkColor).toBe(`${stageColor}80`);
    });

    test('all link colors have 80 opacity suffix', () => {
      const stages = [
        FunnelStage.APPLIED,
        FunnelStage.INTERVIEW,
        FunnelStage.REJECTED,
        FunnelStage.OFFER,
        FunnelStage.UNKNOWN
      ];
      
      for (const stage of stages) {
        const linkColor = getLinkColor(stage);
        expect(linkColor).toMatch(/80$/);
      }
    });
  });

  describe('Number formatting', () => {
    test('formats numbers with comma separators', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1234)).toBe('1,234');
      expect(formatNumber(1234567)).toBe('1,234,567');
    });

    test('does not add separators for numbers < 1000', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(999)).toBe('999');
      expect(formatNumber(500)).toBe('500');
    });
  });

  describe('Percentage formatting', () => {
    test('formats percentages to one decimal place', () => {
      expect(formatPercentage(45.678)).toBe('45.7%');
      expect(formatPercentage(100)).toBe('100.0%');
      expect(formatPercentage(0)).toBe('0.0%');
      expect(formatPercentage(33.333)).toBe('33.3%');
    });

    test('includes percent sign', () => {
      expect(formatPercentage(50)).toContain('%');
      expect(formatPercentage(0)).toContain('%');
      expect(formatPercentage(100)).toContain('%');
    });
  });
});
