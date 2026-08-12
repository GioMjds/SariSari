import { Redirect, Slot, usePathname } from 'expo-router';

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
