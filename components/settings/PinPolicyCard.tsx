import { Pressable, Switch, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements/StyledText';
import { usePinPolicy } from '@/hooks/usePinPolicy';
import { useOwnerPinGuard } from '@/hooks/useOwnerPinGuard';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToastStore } from '@/stores';
import {
  PIN_ACTIONS,
  type PinAction,
  type PinActionId,
  type PinActionRisk,
} from '@/lib/auth/pin-actions';

const GROUPS: PinActionRisk[] = ['high', 'low', 'locked'];

export const PinPolicyCard: React.FC = () => {
  const { t } = useTranslation('settings');
  const addToast = useToastStore((s) => s.addToast);
  const isPinConfigured = useAuthStore((s) => s.isPinConfigured);
  const { runWithPinGuard } = useOwnerPinGuard();
  const { overrides, isReady, setOverride } = usePinPolicy();

  const save = async (id: PinActionId, enabled: boolean) => {
    try {
      await setOverride({ id, enabled });
    } catch {
      addToast({ message: t('save_failed'), variant: 'danger' });
    }
  };

  const toggle = (action: PinAction, next: boolean) => {
    void runWithPinGuard({
      actionId: 'pin_policy_change',
      title: t('pin_policy.guard_title'),
      actionDescription: t('pin_policy.guard_desc'),
      onApproved: () => save(action.id as PinActionId, next),
    });
  };

  // Wait for stored overrides so unloaded defaults are never shown or saved.
  if (!isReady) return null;

  return (
    <View>
      {GROUPS.map((risk) => (
        <View key={risk}>
          <StyledText
            variant="semibold"
            className="px-4 pt-3 pb-1 text-xs text-ink-500 uppercase"
          >
            {t(`pin_policy.group_${risk}`)}
          </StyledText>
          {PIN_ACTIONS.filter((a) => a.risk === risk).map((action) => {
            const locked = action.risk === 'locked';
            const reviewed = action.id in overrides;
            const value = overrides[action.id] ?? action.defaultEnabled;
            return (
              <View
                key={action.id}
                style={{ minHeight: 56 }}
                className="px-4 py-3 flex-row items-center border-t border-paper-300"
              >
                <View className="flex-1 mr-3">
                  <StyledText
                    variant="semibold"
                    className="text-sm text-ink-700"
                  >
                    {t(action.labelKey)}
                  </StyledText>
                  {locked ? (
                    <StyledText
                      variant="regular"
                      className="text-xs text-ink-500 mt-0.5"
                    >
                      {t('pin_policy.locked')}
                    </StyledText>
                  ) : null}
                </View>
                {!locked && !reviewed ? (
                  <Pressable
                    testID={`pin-policy-new-${action.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={t('pin_policy.keep_default_a11y')}
                    onPress={() =>
                      void save(action.id as PinActionId, action.defaultEnabled)
                    }
                    className="px-2 py-1 mr-3 rounded-full bg-persimmon-50"
                  >
                    <StyledText
                      variant="semibold"
                      className="text-xs text-persimmon-600"
                    >
                      {t('pin_policy.new_badge')}
                    </StyledText>
                  </Pressable>
                ) : null}
                {locked ? (
                  <FontAwesome name="lock" size={16} color="#7A7165" />
                ) : (
                  <Switch
                    testID={`pin-policy-switch-${action.id}`}
                    value={value}
                    disabled={!isPinConfigured}
                    accessibilityLabel={t(action.labelKey)}
                    onValueChange={(next) => toggle(action, next)}
                  />
                )}
              </View>
            );
          })}
        </View>
      ))}
      {!isPinConfigured ? (
        <StyledText
          variant="regular"
          className="px-4 py-3 text-sm text-ink-600 border-t border-paper-300"
        >
          {t('pin_policy.requires_pin')}
        </StyledText>
      ) : null}
    </View>
  );
};
