import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { Modal } from '@/components/ui/Modal';
import {
  changeAppLanguage,
  getCurrentLanguage,
  SupportedLanguage,
} from '@/lib/i18n';
import { t } from 'i18next';

type LanguagePickerDialogProps = {
  visible: boolean;
  onClose: () => void;
};

/**
 * LanguagePickerDialog — modal picker for switching the app's
 * translation between English and Tagalog. Wraps the project's
 * standard `Modal` shell and renders a custom two-row radio list
 * inside it (the stock `buttons[]` API is action-oriented and not
 * the right fit for a selection control).
 *
 * Selecting a language persists to AsyncStorage and updates i18next
 * immediately, so every screen using `useTranslation` re-renders
 * without navigation.
 */
export function LanguagePickerDialog({
  visible,
  onClose,
}: LanguagePickerDialogProps) {
  const { t } = useTranslation();
  const activeLang = getCurrentLanguage();

  const handleSelect = async (lang: SupportedLanguage) => {
    if (lang === activeLang) {
      onClose();
      return;
    }
    await changeAppLanguage(lang);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={t('common:languagePickerTitle')}
      description={t('common:languagePickerSubtitle')}
      icon="globe"
      size="md"
      showCloseButton={false}
    >
      <View className="gap-2 mt-2">
        <LanguageRow
          label={t('common:languageEnglish')}
          flag="🇺🇸"
          active={activeLang === 'en'}
          onPress={() => handleSelect('en')}
        />
        <LanguageRow
          label={t('common:languageTagalog')}
          flag="🇵🇭"
          active={activeLang === 'tl'}
          onPress={() => handleSelect('tl')}
        />
      </View>
    </Modal>
  );
}

function LanguageRow({
  label,
  flag,
  active,
  onPress,
}: {
  label: string;
  flag: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      className={`flex-row items-center justify-between px-4 py-4 rounded-xl border ${
        active
          ? 'bg-persimmon-50 border-persimmon-500'
          : 'bg-paper-50 border-ink-100'
      }`}
    >
      <View className="flex-row items-center">
        <StyledText variant="medium" className="text-2xl mr-3">
          {flag}
        </StyledText>
        <View>
          <StyledText
            variant={active ? 'extrabold' : 'semibold'}
            className={`text-base ${active ? 'text-persimmon-600' : 'text-ink-900'}`}
          >
            {label}
          </StyledText>
          {active ? (
            <StyledText
              variant="medium"
              className="text-[11px] text-persimmon-600 mt-0.5"
            >
              {t('common:languageActive')}
            </StyledText>
          ) : null}
        </View>
      </View>
      <View
        className={`w-6 h-6 rounded-full items-center justify-center border ${
          active
            ? 'bg-persimmon-500 border-persimmon-500'
            : 'bg-white border-ink-200'
        }`}
      >
        {active ? <FontAwesome name="check" size={12} color="#FBF7EE" /> : null}
      </View>
    </Pressable>
  );
}
