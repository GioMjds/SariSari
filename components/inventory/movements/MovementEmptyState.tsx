import { View, Image, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

interface MovementEmptyStateProps {
  title?: string;
  subtitle?: string;
  onReceiveStock?: () => void;
  onAdjustStock?: () => void;
}

const PERFORATION_COUNT = 22;
const PERFORATION_BG = '#F7F6F2';
const mascotImage = require('@/assets/images/sari-emotions/sari-inventory-state.png');

export function MovementEmptyState({
  title = 'Wala pang stock movement',
  subtitle = 'Ang mga restock, benta, at stock adjustments ay lalabas dito nang sunod-sunod ayon sa petsa.',
  onReceiveStock,
  onAdjustStock,
}: MovementEmptyStateProps) {
  return (
    <View
      className="mx-4 mt-6 rounded-3xl overflow-hidden bg-paper-50 border border-ink-100"
      style={{
        shadowColor: '#564E45',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 4,
      }}
    >
      {/* Top perforation */}
      <View className="relative h-0">
        <View
          className="absolute left-0 right-0 h-3 flex-row justify-between px-1"
          style={{ bottom: -6 }}
        >
          {Array.from({ length: PERFORATION_COUNT }).map((_, i) => (
            <View
              key={`e-top-${i}`}
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: PERFORATION_BG }}
            />
          ))}
        </View>
      </View>
      <View className="h-3" />

      <View className="paper-texture items-center px-6 pt-2 pb-8">
        <StyledText
          variant="extrabold"
          className="label-caps text-cinnamon-600 mb-2"
        >
          Activity Log Empty
        </StyledText>

        {/* Sari Mascot Image */}
        <Image
          source={mascotImage}
          style={{ width: 180, height: 180 }}
          resizeMode="contain"
        />

        <StyledText
          variant="black"
          className="text-ink-900 text-h2 mt-3 text-center px-4"
        >
          {title}
        </StyledText>

        <StyledText
          variant="regular"
          className="text-ink-500 text-body mt-2 text-center max-w-[280px]"
        >
          {subtitle}
        </StyledText>

        {/* Action CTAs */}
        {(onReceiveStock || onAdjustStock) && (
          <View className="flex-row items-center gap-3 mt-6">
            {onReceiveStock && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onReceiveStock}
                className="bg-sage-600 rounded-pill px-5 py-3 flex-row items-center shadow-sm min-h-[44px]"
              >
                <FontAwesome name="plus" size={14} color="#FBF7EE" />
                <StyledText
                  variant="extrabold"
                  className="text-paper-50 text-sm ml-2"
                >
                  Receive Stock
                </StyledText>
              </TouchableOpacity>
            )}

            {onAdjustStock && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onAdjustStock}
                className="bg-paper-100 rounded-pill px-5 py-3 flex-row items-center border border-ink-200 min-h-[44px]"
              >
                <FontAwesome name="sliders" size={14} color="#2A241E" />
                <StyledText
                  variant="extrabold"
                  className="text-ink-800 text-sm ml-2"
                >
                  Adjust Stock
                </StyledText>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Bottom perforation */}
      <View className="relative h-0">
        <View
          className="absolute left-0 right-0 h-3 flex-row justify-between px-1"
          style={{ top: -6 }}
        >
          {Array.from({ length: PERFORATION_COUNT }).map((_, i) => (
            <View
              key={`e-bot-${i}`}
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: PERFORATION_BG }}
            />
          ))}
        </View>
      </View>
      <View className="h-3" />
    </View>
  );
}
