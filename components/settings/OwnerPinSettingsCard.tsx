import { useState, useEffect } from 'react';
import { View, TextInput, Pressable, Switch, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { isOwnerPinConfigured } from '@/database/auth';
import { getAppSetting, setAppSetting } from '@/database/settings';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToastStore } from '@/stores';
import { useAppSetting, useSetAppSetting } from '@/hooks/useAppSetting';
import {
  authenticateOwner,
  getBiometricCapability,
  type BiometricCapability,
} from '@/lib/auth/biometrics';
import { OwnerPinSetupModal } from '@/components/auth/OwnerPinSetupModal';
import { OwnerPinRecoveryModal } from '@/components/auth/OwnerPinRecoveryModal';
import { StyledText } from '@/components/elements/StyledText';

const DEFAULT_PESOS_LIMIT = '50';
const DEFAULT_PERCENT_LIMIT = '10';

type ToggleRowProps = {
  testID: string;
  title: string;
  hint: string;
  value: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
};

function ToggleRow({
  testID,
  title,
  hint,
  value,
  disabled,
  onChange,
}: ToggleRowProps) {
  return (
    <View
      style={{ minHeight: 56 }}
      className="px-4 py-3 flex-row items-center border-t border-paper-300"
    >
      <View className="flex-1 mr-3">
        <StyledText variant="semibold" className="text-sm text-ink-700">
          {title}
        </StyledText>
        <StyledText variant="regular" className="text-sm text-ink-600 mt-0.5">
          {hint}
        </StyledText>
      </View>
      <Switch
        testID={testID}
        value={value}
        disabled={disabled}
        accessibilityLabel={title}
        onValueChange={onChange}
      />
    </View>
  );
}

type LimitRowProps = {
  label: string;
  value: string;
  onChange: (next: string) => void;
  onCommit: () => void;
};

function LimitRow({ label, value, onChange, onCommit }: LimitRowProps) {
  return (
    <View className="flex-row items-center justify-between mb-3">
      <StyledText
        variant="regular"
        className="text-sm text-ink-700 flex-1 mr-3"
      >
        {label}
      </StyledText>
      <TextInput
        value={value}
        onChangeText={(text) => onChange(text.replace(/[^0-9]/g, ''))}
        onBlur={onCommit}
        keyboardType="number-pad"
        accessibilityLabel={label}
        style={{ width: 88, minHeight: 44 }}
        className="border border-paper-300 bg-paper-100 rounded-xl text-center text-base text-ink-900"
      />
    </View>
  );
}

export const OwnerPinSettingsCard: React.FC = () => {
  const { t } = useTranslation('settings');
  const addToast = useToastStore((s) => s.addToast);
  const { isPinConfigured, setIsPinConfigured } = useAuthStore();
  const [showSetup, setShowSetup] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const { value: biometricRaw } = useAppSetting('biometric_unlock_enabled');
  const biometricEnabled = biometricRaw === '1';
  const { mutateAsync: setBiometricEnabled } = useSetAppSetting(
    'biometric_unlock_enabled',
  );
  const { value: launchLockRaw } = useAppSetting('app_launch_lock_enabled');
  const launchLockEnabled = launchLockRaw === '1';
  const { mutateAsync: setLaunchLockEnabled } = useSetAppSetting(
    'app_launch_lock_enabled',
  );
  const [capability, setCapability] = useState<BiometricCapability>({
    available: false,
    enrolled: false,
    label: 'none',
  });
  const [pesosLimit, setPesosLimit] = useState(DEFAULT_PESOS_LIMIT);
  const [percentLimit, setPercentLimit] = useState(DEFAULT_PERCENT_LIMIT);
  const [savedPesos, setSavedPesos] = useState(DEFAULT_PESOS_LIMIT);
  const [savedPercent, setSavedPercent] = useState(DEFAULT_PERCENT_LIMIT);

  useEffect(() => {
    isOwnerPinConfigured().then(setIsPinConfigured);
    getBiometricCapability().then(setCapability);
    getAppSetting('owner_pin_discount_threshold_pesos').then((v) => {
      if (v) {
        setPesosLimit(v);
        setSavedPesos(v);
      }
    });
    getAppSetting('owner_pin_discount_threshold_percent').then((v) => {
      if (v) {
        setPercentLimit(v);
        setSavedPercent(v);
      }
    });
  }, [setIsPinConfigured]);

  const handleSaveThresholds = async () => {
    if (pesosLimit === savedPesos && percentLimit === savedPercent) return;

    const percent = Number.parseInt(percentLimit, 10);
    const pesosOk = /^\d+$/.test(pesosLimit);
    const percentOk = /^\d+$/.test(percentLimit) && percent <= 100;
    if (!pesosOk || !percentOk) {
      setPesosLimit(savedPesos);
      setPercentLimit(savedPercent);
      addToast({ message: t('threshold_invalid'), variant: 'danger' });
      return;
    }

    try {
      await setAppSetting('owner_pin_discount_threshold_pesos', pesosLimit);
      await setAppSetting('owner_pin_discount_threshold_percent', percentLimit);
      setSavedPesos(pesosLimit);
      setSavedPercent(percentLimit);
      addToast({ message: t('saved'), variant: 'success' });
    } catch {
      setPesosLimit(savedPesos);
      setPercentLimit(savedPercent);
      addToast({ message: t('save_failed'), variant: 'danger' });
    }
  };

  const handleBiometricToggle = async (next: boolean) => {
    if (!next) {
      await setBiometricEnabled('0');
      return;
    }
    Alert.alert(t('biometrics.risk_title'), t('biometrics.risk_body'), [
      { text: t('biometrics.risk_cancel'), style: 'cancel' },
      {
        text: t('biometrics.risk_confirm'),
        onPress: async () => {
          const result = await authenticateOwner(
            t('biometrics.reason_default'),
          );
          if (result === 'success') {
            await setBiometricEnabled('1');
          }
        },
      },
    ]);
  };

  const handleLaunchLockToggle = async (next: boolean) => {
    await setLaunchLockEnabled(next ? '1' : '0');
  };

  const biometricDisabledReason: string | null = !isPinConfigured
    ? t('biometrics.requires_pin')
    : !capability.available
      ? t('biometrics.not_available')
      : !capability.enrolled
        ? t('biometrics.not_enrolled')
        : null;

  const launchLockDisabledReason: string | null = !isPinConfigured
    ? t('biometrics.requires_pin')
    : null;

  return (
    <View>
      <View
        style={{ minHeight: 56 }}
        className="px-4 py-3 flex-row items-center justify-between"
      >
        <View className="flex-row items-center">
          <StyledText variant="semibold" className="text-sm text-ink-700">
            {t('pin.status_label')}
          </StyledText>
        </View>
        <View
          className={`px-3 py-1 rounded-full ${
            isPinConfigured ? 'bg-sage-50' : 'bg-paper-200'
          }`}
        >
          <StyledText
            variant="semibold"
            className={`text-sm ${
              isPinConfigured ? 'text-sage-700' : 'text-ink-700'
            }`}
          >
            {isPinConfigured
              ? t('pin.status_configured')
              : t('pin.status_not_configured')}
          </StyledText>
        </View>
      </View>

      <View className="px-4 pb-4 flex-row gap-3">
        {!isPinConfigured ? (
          <Pressable
            onPress={() => setShowSetup(true)}
            accessibilityRole="button"
            style={{ minHeight: 48 }}
            className="flex-1 bg-persimmon-600 rounded-2xl items-center justify-center active:opacity-80"
          >
            <StyledText variant="semibold" className="text-sm text-white">
              {t('pin.btn_setup')}
            </StyledText>
          </Pressable>
        ) : (
          <>
            <Pressable
              onPress={() => setShowSetup(true)}
              accessibilityRole="button"
              style={{ minHeight: 48 }}
              className="flex-1 bg-paper-100 border border-paper-300 rounded-2xl items-center justify-center active:opacity-70"
            >
              <StyledText variant="semibold" className="text-sm text-ink-800">
                {t('pin.btn_change')}
              </StyledText>
            </Pressable>
            <Pressable
              onPress={() => setShowRecovery(true)}
              accessibilityRole="button"
              style={{ minHeight: 48 }}
              className="flex-1 bg-paper-100 border border-paper-300 rounded-2xl items-center justify-center active:opacity-70"
            >
              <StyledText variant="semibold" className="text-sm text-ink-800">
                {t('pin.btn_reset')}
              </StyledText>
            </Pressable>
          </>
        )}
      </View>

      <ToggleRow
        testID="biometric-toggle"
        title={t('biometrics.toggle_use_biometrics')}
        hint={
          biometricDisabledReason ?? t('biometrics.toggle_use_biometrics_help')
        }
        value={biometricEnabled}
        disabled={biometricDisabledReason !== null}
        onChange={(v) => {
          void handleBiometricToggle(v);
        }}
      />
      <ToggleRow
        testID="launch-lock-toggle"
        title={t('biometrics.toggle_launch_lock')}
        hint={
          launchLockDisabledReason ?? t('biometrics.toggle_launch_lock_help')
        }
        value={launchLockEnabled}
        disabled={launchLockDisabledReason !== null}
        onChange={(v) => {
          void handleLaunchLockToggle(v);
        }}
      />

      <View className="px-4 pt-4 pb-1 border-t border-paper-300">
        <StyledText variant="semibold" className="text-sm text-ink-700 mb-3">
          {t('thresholds_title')}
        </StyledText>
        <LimitRow
          label={t('threshold_pesos')}
          value={pesosLimit}
          onChange={setPesosLimit}
          onCommit={handleSaveThresholds}
        />
        <LimitRow
          label={t('threshold_percent')}
          value={percentLimit}
          onChange={setPercentLimit}
          onCommit={handleSaveThresholds}
        />
      </View>

      <OwnerPinSetupModal
        visible={showSetup}
        onSuccess={() => {
          setShowSetup(false);
          setIsPinConfigured(true);
        }}
        onCancel={() => setShowSetup(false)}
      />
      <OwnerPinRecoveryModal
        visible={showRecovery}
        onSuccess={() => setShowRecovery(false)}
        onCancel={() => setShowRecovery(false)}
      />
    </View>
  );
};
