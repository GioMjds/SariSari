import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui';
import { CATEGORY_FRAME_STYLE } from './CategoryStickyBar';

// Mirrors the hero, attention card, and product rows so content lands without a jump.
export function CategoryDetailsSkeleton() {
  const { t } = useTranslation('inventory');
  return (
    // One grouped progressbar, so screen readers do not announce every placeholder bar.
    <View
      className="pt-4"
      style={CATEGORY_FRAME_STYLE}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={t('category_loading')}
    >
      <View className="mx-4 rounded-3xl bg-paper-50 border border-ink-100 overflow-hidden">
        <View className="h-12 bg-cinnamon-50" />
        <View className="flex-row items-center px-5 pt-5 pb-4">
          <Skeleton width={56} height={56} borderRadius={12} />
          <View className="flex-1 px-3 gap-y-2">
            <Skeleton width="60%" height={20} borderRadius={6} />
            <Skeleton width="45%" height={12} borderRadius={4} />
          </View>
        </View>
        <View className="mx-4 mb-4 rounded-2xl border border-dashed border-ink-200 p-3.5 gap-y-4">
          {[0, 1].map((r) => (
            <View key={`kpi-${r}`} className="flex-row gap-x-4">
              <View className="flex-1 gap-y-2">
                <Skeleton width="50%" height={10} borderRadius={4} />
                <Skeleton width="80%" height={20} borderRadius={6} />
              </View>
              <View className="flex-1 gap-y-2">
                <Skeleton width="50%" height={10} borderRadius={4} />
                <Skeleton width="70%" height={20} borderRadius={6} />
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className="mx-4 mt-6 gap-y-2">
        <Skeleton width={120} height={14} borderRadius={4} />
        <Skeleton width="100%" height={60} borderRadius={16} />
      </View>

      <View className="mx-4 mt-6 rounded-2xl bg-paper-50 border border-ink-100">
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={`row-${i}`} className="flex-row items-center px-4 py-3.5">
            <Skeleton width={48} height={48} borderRadius={12} />
            <View className="flex-1 px-3 gap-y-2">
              <Skeleton width="65%" height={14} borderRadius={4} />
              <Skeleton width="40%" height={10} borderRadius={4} />
            </View>
            <Skeleton width={56} height={14} borderRadius={4} />
          </View>
        ))}
      </View>
    </View>
  );
}
