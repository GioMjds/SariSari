export type ChartKind = 'categorical' | 'value' | 'velocity';

const PALETTES = {
  categorical: ['#623418', '#E85A1F', '#4F7A24', '#F59E0B', '#9F1239'],
  value: ['#E85A1F', '#623418', '#F59E0B', '#4F7A24', '#9F1239'],
  velocity: ['#623418', '#E85A1F', '#4F7A24', '#F59E0B'],
} satisfies Record<ChartKind, string[]>;

export function useChartPalette(kind: ChartKind) {
  return PALETTES[kind];
}
