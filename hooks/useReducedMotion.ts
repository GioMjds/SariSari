import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';

// One shared native query and listener, however many components read the flag.
let value = false;
const listeners = new Set<() => void>();
let started = false;

const set = (next: boolean) => {
  if (next === value) return;
  value = next;
  listeners.forEach((l) => l());
};

function start() {
  started = true;
  AccessibilityInfo.isReduceMotionEnabled().then(set);
  AccessibilityInfo.addEventListener('reduceMotionChanged', set);
}

function subscribe(listener: () => void) {
  if (!started) start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => value,
    () => false,
  );
}
