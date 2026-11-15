import { Profiler, type ComponentType, type ProfilerOnRenderCallback, type ReactNode } from 'react';

/** Dev-only: log any commit of the wrapped subtree that takes over 16ms. */
const logSlowRender: ProfilerOnRenderCallback = (id, phase, actualDuration) => {
  if (actualDuration > 16) {
    const flag = actualDuration > 200 ? '  <-- SLOW' : '';
    console.log(`[perf] RENDER ${id} ${phase} ${actualDuration.toFixed(1)}ms${flag}`);
  }
};

/** Dev-only: wrap a subtree in a Profiler that reports slow commits. */
export const Prof = ({ id, children }: { id: string; children: ReactNode }) =>
  __DEV__ ? (
    <Profiler id={id} onRender={logSlowRender}>
      {children}
    </Profiler>
  ) : (
    <>{children}</>
  );

/** Dev-only: wrap a screen component so its commits are reported under the given id. */
export function withProf<P extends object>(Component: ComponentType<P>, id: string): ComponentType<P> {
  if (!__DEV__) return Component;
  const Profiled = (props: P) => (
    <Prof id={id}>
      <Component {...props} />
    </Prof>
  );
  Profiled.displayName = `Prof(${id})`;
  return Profiled;
}
