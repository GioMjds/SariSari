import { FontAwesome } from '@expo/vector-icons';

export type FeatureStatus = 'in-progress' | 'planned' | 'testing';

export interface FeatureMetadata {
  id: string;
  route: string;
  title: string;
  description: string;
  status: FeatureStatus;
  targetRelease?: string;
  iconName?: keyof typeof FontAwesome.glyphMap;
}

export const UNIMPLEMENTED_FEATURES: Record<string, FeatureMetadata> = {
  '/gastos-kaha': {
    id: 'gastos-kaha',
    route: '/gastos-kaha',
    title: 'Gastos at Kaha Management',
    description:
      'Petty cash tracking, daily drawer reconciliation, and expense logging.',
    status: 'in-progress',
    targetRelease: 'v1.1',
    iconName: 'money',
  },
  '/reports/export': {
    id: 'reports-export',
    route: '/reports/export',
    title: 'CSV/Excel Report Export',
    description:
      'Exporting sales, inventory, and utang ledgers to CSV or Excel files.',
    status: 'planned',
    targetRelease: 'v1.2',
    iconName: 'file-text-o',
  },
};

export function isRouteUnimplemented(routePath: string): boolean {
  if (!routePath) return false;
  return Object.prototype.hasOwnProperty.call(
    UNIMPLEMENTED_FEATURES,
    routePath,
  );
}

export function getFeatureByRoute(
  routePath: string,
): FeatureMetadata | undefined {
  if (!routePath) return undefined;
  return UNIMPLEMENTED_FEATURES[routePath];
}

export function getAllInWorkFeatures(): FeatureMetadata[] {
  return Object.values(UNIMPLEMENTED_FEATURES);
}
