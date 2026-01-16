import { describe, it, expect } from 'vitest';
import { MOCK_APPLICATIONS, Application } from './types';

describe('Phase 1: Application Type with lastUpdate', () => {
  it('should have lastUpdate field in Application interface', () => {
    const app: Application = MOCK_APPLICATIONS[0];
    expect(app).toHaveProperty('lastUpdate');
    expect(typeof app.lastUpdate).toBe('string');
  });

  it('should have createdAt optional field in Application interface', () => {
    const app: Application = MOCK_APPLICATIONS[0];
    // createdAt is optional, so we just check the type allows it
    expect(app.createdAt === undefined || typeof app.createdAt === 'string').toBe(true);
  });

  it('should have lastUpdate for all mock applications', () => {
    MOCK_APPLICATIONS.forEach((app, index) => {
      expect(app.lastUpdate, `Application ${index + 1} should have lastUpdate`).toBeDefined();
      expect(app.lastUpdate, `Application ${index + 1} lastUpdate should be a string`).toBeTruthy();
    });
  });

  it('should have all required Application fields', () => {
    const app: Application = MOCK_APPLICATIONS[0];
    expect(app).toHaveProperty('id');
    expect(app).toHaveProperty('company');
    expect(app).toHaveProperty('role');
    expect(app).toHaveProperty('location');
    expect(app).toHaveProperty('dateApplied');
    expect(app).toHaveProperty('lastUpdate');
    expect(app).toHaveProperty('status');
    expect(app).toHaveProperty('source');
    expect(app).toHaveProperty('sourceIcon');
  });

  it('should have valid status values', () => {
    MOCK_APPLICATIONS.forEach((app) => {
      expect(['Interview', 'Applied', 'Rejected', 'Offer']).toContain(app.status);
    });
  });
});
