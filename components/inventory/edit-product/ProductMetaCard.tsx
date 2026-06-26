import { FontAwesome } from '@expo/vector-icons';
import { View } from 'react-native';
import { StyledText } from '@/components/elements';

interface ProductMetaCardProps {
  /** ISO timestamp from the DB. */
  createdAt: string;
  /** ISO timestamp from the DB. */
  updatedAt: string;
}

/**
 * ProductMetaCard — read-only metadata ribbon that surfaces
 * created_at / updated_at. Replaces the blue info banner from
 * the original screen with a parchment card that matches the
 * rest of the form.
 */
export function ProductMetaCard({
  createdAt,
  updatedAt,
}: ProductMetaCardProps) {
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return Number.isFinite(d.getTime()) ? d.toLocaleDateString() : '—';
  };

  return (
    <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4 flex-row">
      <View className="w-9 h-9 rounded-full bg-paper-100 border border-ink-200 items-center justify-center mr-3">
        <FontAwesome name="info-circle" size={16} color="#623418" />
      </View>
      <View className="flex-1">
        <StyledText variant="black" className="label-caps text-cinnamon-500">
          Product Information
        </StyledText>
        <View className="mt-1.5 flex-row">
          <View className="flex-1">
            <StyledText variant="medium" className="text-ink-400 text-xs">
              Created
            </StyledText>
            <StyledText variant="semibold" className="text-ink-700 text-sm mt-0.5">
              {formatDate(createdAt)}
            </StyledText>
          </View>
          <View className="flex-1">
            <StyledText variant="medium" className="text-ink-400 text-xs">
              Last Updated
            </StyledText>
            <StyledText variant="semibold" className="text-ink-700 text-sm mt-0.5">
              {formatDate(updatedAt)}
            </StyledText>
          </View>
        </View>
      </View>
    </View>
  );
}