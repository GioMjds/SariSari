import { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { isOwnerPinConfigured } from '@/database/auth';
import { getAppSetting, setAppSetting } from '@/database/settings';
import { useAuthStore } from '@/stores/useAuthStore';
import { OwnerPinSetupModal } from '@/components/auth/OwnerPinSetupModal';
import { OwnerPinRecoveryModal } from '@/components/auth/OwnerPinRecoveryModal';
import { StyledText } from '@/components/elements/StyledText';

export const OwnerPinSettingsCard: React.FC = () => {
  const { t } = useTranslation('settings');
  const { isPinConfigured, setIsPinConfigured } = useAuthStore();
  const [showSetup, setShowSetup] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [pesosLimit, setPesosLimit] = useState('50');
  const [percentLimit, setPercentLimit] = useState('10');

  useEffect(() => {
    isOwnerPinConfigured().then(setIsPinConfigured);
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
    backgroundColor: '#2563EB',
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
});
