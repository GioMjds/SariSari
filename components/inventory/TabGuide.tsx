import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';

interface TabGuideProps {
  guideId: string;
  steps: string[];
}

const seenKey = (id: string) => `tab_guide_seen_${id}`;

// Shows step-by-step help expanded on first visit, then collapses to a "How to use" link.
export function TabGuide({ guideId, steps }: TabGuideProps) {
  const { t } = useTranslation('inventory');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(seenKey(guideId))
      .then((seen) => setOpen(!seen))
      .catch(() => {});
  }, [guideId]);

  const close = () => {
    setOpen(false);
    AsyncStorage.setItem(seenKey(guideId), '1').catch(() => {});
  };

  if (!open) {
    return (
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t('guideShow')}
        className="flex-row items-center gap-x-1.5 self-start py-2 min-h-[40px]"
      >
        <FontAwesome name="question-circle" size={14} color="#B45A1E" />
        <StyledText variant="semibold" className="text-xs text-cinnamon-600">
          {t('guideShow')}
        </StyledText>
      </Pressable>
    );
  }

  return (
    <View
      accessibilityRole="summary"
      className="bg-paper-50 border border-ink-200 rounded-2xl p-3 mb-2 gap-y-1.5"
    >
      <StyledText variant="extrabold" className="text-sm text-ink-900">
        {t('guideTitle')}
      </StyledText>
      {steps.map((step, i) => (
        <StyledText key={i} variant="regular" className="text-xs text-ink-700">
          {i + 1}. {step}
        </StyledText>
      ))}
      <Pressable
        onPress={close}
        accessibilityRole="button"
        className="self-end bg-ink-900 rounded-full px-4 py-2 mt-1 min-h-[40px] justify-center"
      >
        <StyledText variant="extrabold" className="text-xs text-paper-50">
          {t('guideGotIt')}
        </StyledText>
      </Pressable>
    </View>
  );
}
