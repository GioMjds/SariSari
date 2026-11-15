import { Profiler, useEffect, useRef, type ComponentType, type ReactNode } from 'react';

/** Dev-only: log a commit of a profiled subtree that takes longer than the given minimum. */
const logSlowRender = (id: string, phase: string, actualDuration: number, min: number) => {
  if (actualDuration > min) {
    const flag = actualDuration > 200 ? '  <-- SLOW' : '';
    console.log(`[perf] RENDER ${id} ${phase} ${actualDuration.toFixed(1)}ms${flag}`);
  }
};

/** Dev-only: wrap a subtree in a Profiler that reports slow commits. */
export const Prof = ({ id, min = 16, children }: { id: string; min?: number; children: ReactNode }) =>
  __DEV__ ? (
    <Profiler id={id} onRender={(pid, phase, ms) => logSlowRender(pid, phase, ms, min)}>
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

/** Dev-only: log which named values changed identity since the previous render. */
export function useChangeLog(id: string, values: Record<string, unknown>) {
  const previous = useRef<Record<string, unknown> | null>(null);
  useEffect(() => {
    if (!__DEV__) return;
    const last = previous.current;
    previous.current = values;
    if (!last) return;
    const changed = Object.keys(values).filter((key) => !Object.is(last[key], values[key]));
    console.log(`[perf] WHY ${id}: ${changed.length > 0 ? changed.join(', ') : 'no tracked value changed'}`);
  });
}
