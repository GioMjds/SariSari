import { StyledText } from '@/components/elements';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

type InsightCardProps = {
  type: 'success' | 'warning' | 'info';
  title: string;
  message: string;
  icon: keyof typeof FontAwesome.glyphMap;
};

type Colors = {
  accent: string;
  text: string;
  bg: string;
};

export function InsightCard({ type, title, message, icon }: InsightCardProps) {
  const colors = {
    success: {
      accent: '#4F7A24',
      text: '#3D5E1B',
      bg: 'bg-sage-50',
    },
    warning: {
      accent: '#C77B0E',
      text: '#8A5400',
      bg: 'bg-semantic-warning-50',
    },
    info: {
      accent: '#2E6FA8',
      text: '#1F4D78',
      bg: 'bg-semantic-info-50',
    },
  } satisfies Record<string, Colors>;

  const { t } = useTranslation();
  const { accent, text, bg } = colors[type];

  return (
    <View
      className={`rounded-md ${bg} mb-2 overflow-hidden flex-row`}
      style={{ borderLeftWidth: 4, borderLeftColor: accent }}
    >
      <View className="pl-3 pr-3 py-3 flex-1 flex-row items-start">
        <View
          className="w-8 h-8 rounded-md items-center justify-center mr-3 mt-0.5"
          style={{ backgroundColor: accent }}
        >
          <FontAwesome name={icon} size={14} color="#FBF7EE" />
        </View>
        <View className="flex-1">
          <StyledText
            variant="extrabold"
            className="text-xs mb-0.5"
            style={{ color: text }}
          >
            {t(`common:reports.insight.${type}`)} · {title}
          </StyledText>
          <StyledText
            variant="medium"
            className="text-sm leading-5"
            style={{ color: text }}
          >
            {message}
          </StyledText>
        </View>
      </View>
    </View>
  );
}
