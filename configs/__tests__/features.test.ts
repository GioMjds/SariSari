import {
  getAllInWorkFeatures,
  getFeatureByRoute,
  isRouteUnimplemented,
  UNIMPLEMENTED_FEATURES,
} from '../features';

describe('configs/features', () => {
  it('identifies unimplemented routes correctly', () => {
    expect(isRouteUnimplemented('/gastos-kaha')).toBe(true);
    expect(isRouteUnimplemented('/reports/export')).toBe(true);
    expect(isRouteUnimplemented('/non-existent-route')).toBe(false);
    expect(isRouteUnimplemented('')).toBe(false);
  });

  it('fetches feature metadata by route path', () => {
    const feature = getFeatureByRoute('/gastos-kaha');
    expect(feature).toBeDefined();
    expect(feature?.id).toBe('gastos-kaha');
    expect(feature?.status).toBe('in-progress');

    expect(getFeatureByRoute('/unknown')).toBeUndefined();
    expect(getFeatureByRoute('')).toBeUndefined();
  });

  it('returns all features in progress/work registry', () => {
    const allFeatures = getAllInWorkFeatures();
    expect(allFeatures).toHaveLength(Object.keys(UNIMPLEMENTED_FEATURES).length);
    expect(allFeatures.map((f) => f.id)).toContain('gastos-kaha');
  });
});
