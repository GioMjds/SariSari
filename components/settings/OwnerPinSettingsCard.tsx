import { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { isOwnerPinConfigured } from '@/database/auth';
import { getAppSetting, setAppSetting } from '@/database/settings';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAppSetting, useSetAppSetting } from '@/hooks/useAppSetting';
import {
  authenticateOwner,
  getBiometricCapability,
  type BiometricCapability,
} from '@/lib/auth/biometrics';
import { OwnerPinSetupModal } from '@/components/auth/OwnerPinSetupModal';
import { OwnerPinRecoveryModal } from '@/components/auth/OwnerPinRecoveryModal';
import { StyledText } from '@/components/elements/StyledText';

export const OwnerPinSettingsCard: React.FC = () => {
  const { t } = useTranslation('settings');
  const { isPinConfigured, setIsPinConfigured } = useAuthStore();
  const [showSetup, setShowSetup] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const { value: biometricRaw } = useAppSetting('biometric_unlock_enabled');
  const biometricEnabled = biometricRaw === '1';
  const { mutateAsync: setBiometricEnabled } = useSetAppSetting('biometric_unlock_enabled');
  const { value: launchLockRaw } = useAppSetting('app_launch_lock_enabled');
  const launchLockEnabled = launchLockRaw === '1';
  const { mutateAsync: setLaunchLockEnabled } = useSetAppSetting('app_launch_lock_enabled');
  const [capability, setCapability] = useState<BiometricCapability>({
    available: false,
    enrolled: false,
    label: 'none',
  });
  const [showRiskConfirm, setShowRiskConfirm] = useState(false);
  const [pesosLimit, setPesosLimit] = useState('50');
  const [percentLimit, setPercentLimit] = useState('10');

  useEffect(() => {
    isOwnerPinConfigured().then(setIsPinConfigured);
    getBiometricCapability().then(setCapability);
    getAppSetting('owner_pin_discount_threshold_pesos').then((v) => {
      if (v) setPesosLimit(v);
    });
    getAppSetting('owner_pin_discount_threshold_percent').then((v) => {
      if (v) setPercentLimit(v);
    });
  }, [setIsPinConfigured]);

  const handleSaveThresholds = async () => {
    await setAppSetting('owner_pin_discount_threshold_pesos', pesosLimit);
    await setAppSetting('owner_pin_discount_threshold_percent', percentLimit);
  };

  const handleBiometricToggle = async (next: boolean) => {
    if (!next) {
      await setBiometricEnabled('0');
      return;
    }
    setShowRiskConfirm(true);
  };

  const handleRiskConfirmed = async () => {
    setShowRiskConfirm(false);
    const result = await authenticateOwner(t('biometrics.reason_default'));
    if (result === 'success') {
      await setBiometricEnabled('1');
    }
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
    <View style={styles.card}>
      <StyledText variant="semibold" style={styles.cardTitle}>
        Owner PIN Settings
      </StyledText>
      <View style={styles.statusRow}>
        <StyledText variant="regular" style={styles.statusLabel}>
          Status:
        </StyledText>
        <View
          style={[
            styles.badge,
            isPinConfigured ? styles.badgeSuccess : styles.badgeMuted,
          ]}
        >
          <StyledText variant="semibold" style={styles.badgeText}>
            {isPinConfigured
              ? t('pin.status_configured')
              : t('pin.status_not_configured')}
          </StyledText>
        </View>
      </View>

      <View style={styles.btnRow}>
        {!isPinConfigured ? (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => setShowSetup(true)}
          >
            <StyledText variant="semibold" style={styles.btnText}>
              {t('pin.btn_setup')}
            </StyledText>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => setShowSetup(true)}
            >
              <StyledText variant="semibold" style={styles.secondaryBtnText}>
                {t('pin.btn_change')}
              </StyledText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => setShowRecovery(true)}
            >
              <StyledText variant="semibold" style={styles.secondaryBtnText}>
                {t('pin.btn_reset')}
              </StyledText>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.toggleRow}>
        <View style={styles.toggleText}>
          <StyledText variant="semibold" style={styles.toggleTitle}>
            {t('biometrics.toggle_use_biometrics')}
          </StyledText>
          <StyledText variant="regular" style={styles.toggleSubtitle}>
            {biometricDisabledReason ?? t('biometrics.toggle_use_biometrics_help')}
          </StyledText>
        </View>
        <Switch
          testID="biometric-toggle"
          value={biometricEnabled}
          disabled={biometricDisabledReason !== null}
          onValueChange={(v) => { void handleBiometricToggle(v); }}
        />
      </View>

      <View style={styles.toggleRow}>
        <View style={styles.toggleText}>
          <StyledText variant="semibold" style={styles.toggleTitle}>
            {t('biometrics.toggle_launch_lock')}
          </StyledText>
          <StyledText variant="regular" style={styles.toggleSubtitle}>
            {launchLockDisabledReason ?? t('biometrics.toggle_launch_lock_help')}
          </StyledText>
        </View>
        <Switch
          testID="launch-lock-toggle"
          value={launchLockEnabled}
          disabled={launchLockDisabledReason !== null}
          onValueChange={(v) => { void handleLaunchLockToggle(v); }}
        />
      </View>

      <View style={styles.divider} />

      <StyledText variant="semibold" style={styles.sectionSubTitle}>
        Discount PIN Thresholds
      </StyledText>
      <View style={styles.fieldRow}>
        <StyledText variant="regular" style={styles.fieldLabel}>
          Max Discount (₱):
        </StyledText>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={pesosLimit}
          onChangeText={setPesosLimit}
          onBlur={handleSaveThresholds}
        />
      </View>
      <View style={styles.fieldRow}>
        <StyledText variant="regular" style={styles.fieldLabel}>
          Max Discount (%):
        </StyledText>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={percentLimit}
          onChangeText={setPercentLimit}
          onBlur={handleSaveThresholds}
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
      {showRiskConfirm ? (
        <View style={styles.riskOverlay}>
          <View style={styles.riskCard}>
            <StyledText variant="semibold" style={styles.riskTitle}>
              {t('biometrics.risk_title')}
            </StyledText>
            <StyledText variant="regular" style={styles.riskBody}>
              {t('biometrics.risk_body')}
            </StyledText>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => {
                void handleRiskConfirmed();
              }}
            >
              <StyledText variant="semibold" style={styles.btnText}>
                {t('biometrics.risk_confirm')}
              </StyledText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryBtn, { marginTop: 8 }]}
              onPress={() => setShowRiskConfirm(false)}
            >
              <StyledText variant="semibold" style={styles.secondaryBtnText}>
                {t('biometrics.risk_cancel')}
              </StyledText>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 12,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statusLabel: { fontSize: 14, color: '#4B5563', marginRight: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeSuccess: { backgroundColor: '#DCFCE7' },
  badgeMuted: { backgroundColor: '#F3F4F6' },
  badgeText: { fontSize: 12, color: '#166534' },
  btnRow: { flexDirection: 'row', gap: 8 },
  primaryBtn: {
    backgroundColor: '#E85A1F',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  btnText: { color: '#fff', fontSize: 13 },
  secondaryBtn: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  secondaryBtnText: { color: '#374151', fontSize: 13 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 },
  sectionSubTitle: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 10,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  fieldLabel: { fontSize: 13, color: '#4B5563' },
  input: {
    width: 80,
    height: 36,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  toggleText: { flex: 1, marginRight: 12 },
  toggleTitle: { fontSize: 14, color: '#1F2937', marginBottom: 2 },
  toggleSubtitle: { fontSize: 12, color: '#6B7280' },
  riskOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  riskCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 24,
  },
  riskTitle: { fontSize: 16, color: '#1F2937', marginBottom: 12 },
  riskBody: { fontSize: 13, color: '#4B5563', marginBottom: 24, lineHeight: 20 },
});
