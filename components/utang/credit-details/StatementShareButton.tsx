import { buildStatement } from '@/lib';
import { CreditTransaction, CustomerWithDetails } from '@/types';
import { useTranslation } from 'react-i18next';
import { Pressable, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { shareCreditStatementPdf } from '@/lib/pdfGenerator';
import * as Haptics from 'expo-haptics';
import { Alert } from '@/utils';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

export function StatementShareButton({
  customer,
  credits,
  storeName,
  disabled,
}: {
  customer: CustomerWithDetails;
  credits: CreditTransaction[];
  storeName: string;
  disabled?: boolean;
}) {
  const { t } = useTranslation();

  const handleShareText = async () => {
    const text = buildStatement({ storeName, customer, credits });
    try {
      await Share.share({
        message: text,
        title: `Statement for ${customer.name}`,
      });
    } catch {
      await Clipboard.setStringAsync(text);
    }
  };

  const handleSharePdf = async () => {
    await shareCreditStatementPdf({
      storeName,
      customerName: customer.name,
      credits,
      totalBalance: customer.outstanding_balance,
    });
  };

  const handlePress = () => {
    Haptics.selectionAsync().catch(() => {});

    Alert.alert(
      t('common:shareStatementTitle', 'Share Statement'),
      t(
        'common:shareStatementMessage',
        'Choose how you want to share the statement with your suki:',
      ),
      [
        {
          text: t('common:shareAsText', 'Share as Text (SMS/Chat)'),
          onPress: handleShareText,
        },
        {
          text: t('common:shareAsPdf', 'Share as PDF Resibo'),
          onPress: handleSharePdf,
        },
        {
          text: t('common:cancel', 'Cancel'),
          style: 'cancel',
        },
      ],
    );
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="Share statement"
      className={`press-scale flex-1 rounded-xl py-2.5 flex-row items-center justify-center bg-paper-100 border ${
        disabled ? 'border-ink-200 opacity-50' : 'border-ink-300'
      }`}
    >
      <FontAwesome
        name="share-square-o"
        size={12}
        color={disabled ? '#7A7165' : '#623418'}
      />
      <StyledText
        variant="extrabold"
        className={`text-xs ml-1.5 ${
          disabled ? 'text-ink-400' : 'text-cinnamon-700'
        }`}
      >
        {t('common:statement', 'Statement')}
      </StyledText>
    </Pressable>
  );
}
