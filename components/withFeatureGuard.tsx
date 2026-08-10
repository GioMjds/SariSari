import { ComponentType, useEffect, useState } from 'react';
import { View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';

/**
 * Higher-Order Component (HOC) guard that redirects to the `/unimplemented`
 * screen when `isUnimplementedOverride` is `true`.
 *
 * Semantics:
 * - `true`  -> redirect to `/unimplemented` after the first commit.
 * - `false` -> render the wrapped component.
 * - `undefined` -> render the wrapped component (fail-open). This makes the
 *   HOC safe to wire to a feature flag or env var that may be undefined
 *   before it has hydrated.
 *
 * The redirect is deferred to a `useEffect` so the first commit renders the
 * wrapped component (or a placeholder) instead of swapping views mid-mount.
 * This avoids a Fabric `addViewAt: specified child already has a parent` crash
 * on the New Architecture when the tab slot has just been mounted.
 */
export function withFeatureGuard<P extends object>(
  Component: ComponentType<P>,
  isUnimplementedOverride?: boolean,
) {
  return function FeatureGuardWrapper(props: P) {
    const pathname = usePathname();
    const router = useRouter();
    const shouldRedirect = isUnimplementedOverride === true;
    const [armed, setArmed] = useState(false);

    useEffect(() => {
      if (!shouldRedirect) return;
      setArmed(true);
    }, [shouldRedirect]);

    useEffect(() => {
      if (!armed) return;
      router.replace({
        pathname: '/unimplemented',
        params: { route: pathname },
      });
    }, [armed, pathname, router]);

    if (!shouldRedirect) return <Component {...props} />;
    return <View />;
  };
}
