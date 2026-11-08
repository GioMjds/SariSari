/**
 * gettingStarted - derives the "Get started" checklist from existing data.
 * No per-task flags are stored; progress is always recomputed.
 */

export type GettingStartedTaskId = 'product' | 'sale' | 'suki';

export type GettingStartedInput = {
  productCount: number;
  hasSales: boolean;
  customerCount: number;
};

export type GettingStartedProgress = {
  tasks: { id: GettingStartedTaskId; done: boolean }[];
  doneCount: number;
  total: number;
  allDone: boolean;
};

const hasAny = (count: number): boolean => Number.isFinite(count) && count > 0;

export function deriveGettingStarted(
  input: GettingStartedInput,
): GettingStartedProgress {
  const tasks: GettingStartedProgress['tasks'] = [
    { id: 'product', done: hasAny(input.productCount) },
    { id: 'sale', done: input.hasSales },
    { id: 'suki', done: hasAny(input.customerCount) },
  ];
  const doneCount = tasks.filter((task) => task.done).length;
  return {
    tasks,
    doneCount,
    total: tasks.length,
    allDone: doneCount === tasks.length,
  };
}

export function shouldShowGettingStarted(
  progress: GettingStartedProgress,
  dismissed: boolean,
): boolean {
  return !dismissed && !progress.allDone;
}
