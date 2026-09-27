import { useTabBarBottomOffset } from '@/components/layout';
import { goBackToMore, MoreDetailHeader } from '@/components/more';
import {
  CloudBackupSection,
  LocalSnapshotsSection,
} from '@/components/settings/backup';
import { SettingsSection } from '@/components/settings/SettingsPrimitives';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

export default function BackupScreen() {
  const { t } = useTranslation();
  const bottomOffset = useTabBarBottomOffset();

  return (
    <View className="flex-1 bg-paper-200">
      <MoreDetailHeader
        title={t('common:backupTitle')}
        subtitle={t('common:backupSubtitle')}
        onBack={goBackToMore}
        backAccessibilityLabel={t('common:moreBackA11y')}
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomOffset + 16 }}
        showsVerticalScrollIndicator={false}
      >
        <SettingsSection
          title={t('common:backupCloudSection')}
          subtitle={t('common:backupCloudSectionSub')}
        >
          <CloudBackupSection />
        </SettingsSection>
        <SettingsSection
          title={t('common:backupLocalSection')}
          subtitle={t('common:backupLocalSectionSub')}
        >
          <LocalSnapshotsSection />
        </SettingsSection>
      </ScrollView>
    </View>
  );
}
