import { useTranslation } from 'react-i18next';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { SariMascot } from '@/components/mascot';

interface MovementEmptyStateProps {
  title?: string;
  subtitle?: string;
  onReceiveStock?: () => void;
  onAdjustStock?: () => void;
}

const PERFORATION_COUNT = 22;
// Matches the paper-200 page so the dots read as holes punched through the receipt.
const PERFORATION_BG = '#F7F6F2';

function Perforation({ edge }: { edge: 'top' | 'bottom' }) {
  return (
    <View
      className="relative h-0"
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <View
        className="absolute left-0 right-0 h-3 flex-row justify-between px-1"
        style={edge === 'top' ? { bottom: -6 } : { top: -6 }}
      >
        {Array.from({ length: PERFORATION_COUNT }).map((_, i) => (
          <View
            key={i}
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: PERFORATION_BG }}
          />
        ))}
      </View>
    </View>
  );
}

export function MovementEmptyState({
  title,
  subtitle,
  onReceiveStock,
  onAdjustStock,
}: MovementEmptyStateProps) {
  const { t } = useTranslation('inventory');
  return (
    <View className="mx-4 mt-6 rounded-2xl overflow-hidden bg-paper-50 border border-ink-100">
      <Perforation edge="top" />
      <View className="h-3" />

      <View className="paper-texture items-center px-6 pt-4 pb-8">
        <SariMascot state="inventory" size={160} />

        <StyledText
          variant="black"
          accessibilityRole="header"
          className="text-ink-900 text-h2 mt-3 text-center px-4"
        >
          {title ?? t('movementsEmptyTitle')}
        </StyledText>

        <StyledText
          variant="regular"
          className="text-ink-500 text-body mt-2 text-center max-w-[280px]"
        >
          {subtitle ?? t('movementsEmptyBody')}
        </StyledText>

        {(onReceiveStock || onAdjustStock) && (
          <View className="flex-row flex-wrap justify-center gap-3 mt-6">
            {onReceiveStock && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onReceiveStock}
                accessibilityRole="button"
                className="bg-sage-600 rounded-pill px-5 py-3 flex-row items-center min-h-[44px]"
              >
                <Ionicons name="add" size={18} color="#FBF7EE" />
                <StyledText
                  variant="extrabold"
                  className="text-paper-50 text-sm ml-1.5"
                >
                  {t('receiveStock')}
                </StyledText>
              </TouchableOpacity>
            )}

            {onAdjustStock && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onAdjustStock}
                accessibilityRole="button"
                className="bg-paper-100 rounded-pill px-5 py-3 flex-row items-center border border-ink-200 min-h-[44px]"
              >
                <Ionicons name="swap-vertical" size={16} color="#28231D" />
                <StyledText
                  variant="extrabold"
                  className="text-ink-800 text-sm ml-1.5"
                >
                  {t('adjustStock')}
                </StyledText>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <Perforation edge="bottom" />
      <View className="h-3" />
    </View>
  );
}
