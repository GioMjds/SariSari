import { ComponentType } from 'react';
import { Redirect, usePathname } from 'expo-router';

/**
 * Higher-Order Component (HOC) guard that redirects to the `/unimplemented`
 * screen when `isUnimplemented` is true.
 */
export function withFeatureGuard<P extends object>(
  Component: ComponentType<P>,
  isUnimplementedOverride?: boolean,
) {
  return function FeatureGuardWrapper(props: P) {
    const pathname = usePathname();
    const isUnimplemented = isUnimplementedOverride;

    if (isUnimplemented) {
      return (
        <Redirect
          href={{
            pathname: '/unimplemented',
            params: { route: pathname },
          }}
        />
      );
    }

    return <Component {...props} />;
  };
}
