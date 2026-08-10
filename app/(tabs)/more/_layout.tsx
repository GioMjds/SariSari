import { Redirect, Slot, usePathname } from 'expo-router';

/**
 * In production/preview builds, gate the entire `/(tabs)/more` group behind
 * the `/unimplemented` screen. This covers the index and every nested
 * subroute (cash-entries, cash-session, reports, settings) in a single
 * place, so deep links can't bypass the guard.
 *
 * In dev (`__DEV__ === true`), the slot renders normally so the work-in-
 * progress UI is reachable.
 */
export default function MoreLayout() {
  const pathname = usePathname();

  if (!__DEV__) {
    return (
      <Redirect
        href={{
          pathname: '/unimplemented',
          params: { route: pathname },
        }}
      />
    );
  }

  return <Slot />;
}
