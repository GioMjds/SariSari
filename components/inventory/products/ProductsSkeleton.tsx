import { View } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';
import { GRID_COLUMN_STYLE } from '@/components/ui/ViewModeToggle';
import type { ViewMode } from '@/stores/useViewModeStore';

interface ProductsSkeletonProps {
  viewMode: ViewMode;
  /** Footer mode: one placeholder row appended under loaded items while the next page loads. */
  inline?: boolean;
}

/** Placeholder for product lists; mirrors ProductTile and ProductRow so nothing jumps on swap. */
export function ProductsSkeleton({ viewMode, inline = false }: ProductsSkeletonProps) {
  const isGrid = viewMode === 'grid';
  const placeholders = Array.from({ length: inline ? 2 : 6 }, (_, i) => i);

  return (
    // One label for the whole block so screen readers do not announce every bar.
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={inline ? 'Loading more products' : 'Loading products'}
      className={inline ? '' : 'flex-1 pt-3'}
    >
      {isGrid ? (
        <View className="flex-row flex-wrap" style={GRID_COLUMN_STYLE}>
          {placeholders.map((i) => (
            <View
              key={i}
              className="w-[48.5%] mb-3 rounded-2xl bg-paper-50 border border-ink-100 overflow-hidden"
            >
              <Skeleton width="100%" height={96} borderRadius={0} />
              <View className="p-2.5 gap-0.5">
                {/* Same 51px name block the tile reserves for three lines. */}
                <View className="h-[51px] gap-1.5 pt-0.5">
                  <Skeleton width="90%" height={12} />
                  <Skeleton width="60%" height={12} />
                </View>
                <Skeleton width={72} height={18} style={{ marginTop: 4 }} />
                <Skeleton width="50%" height={10} style={{ marginTop: 4 }} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        placeholders.map((i) => (
          <View
            key={i}
            className="bg-paper-50 mx-4 mb-2 p-2.5 rounded-2xl border border-ink-100 flex-row items-center gap-3"
          >
            <Skeleton width={64} height={64} borderRadius={12} />
            <View className="flex-1 gap-y-1.5">
              <Skeleton width="75%" height={14} />
              <Skeleton width={72} height={16} />
              <Skeleton width={84} height={18} borderRadius={9} />
            </View>
            <Skeleton width={44} height={32} borderRadius={16} />
          </View>
        ))
      )}
    </View>
  );
}
