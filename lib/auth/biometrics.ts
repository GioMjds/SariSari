import * as LocalAuthentication from 'expo-local-authentication';
import { t } from 'i18next';

export type BiometricLabel = 'face' | 'fingerprint' | 'iris' | 'none';

export interface BiometricCapability {
  available: boolean;
  enrolled: boolean;
  label: BiometricLabel;
}

export type BiometricAuthResult =
  'success' | 'cancelled' | 'fallback' | 'unavailable' | 'failed';

let promptActive = false;

export const isBiometricPromptActive = (): boolean => promptActive;

const pickLabel = (
  types: LocalAuthentication.AuthenticationType[],
): BiometricLabel => {
  if (
    types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
  ) {
    return 'face';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'fingerprint';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return 'iris';
  }
  return 'none';
};

export const getBiometricCapability =
  async (): Promise<BiometricCapability> => {
    try {
      const available = await LocalAuthentication.hasHardwareAsync();
      if (!available) {
        return {
          available: false,
          enrolled: false,
          label: 'none',
        };
      }

      const [enrolled, types] = await Promise.all([
        LocalAuthentication.isEnrolledAsync(),
        LocalAuthentication.supportedAuthenticationTypesAsync(),
      ]);
      return {
        available: true,
        enrolled,
        label: pickLabel(types),
      };
    } catch {
      return {
        available: false,
        enrolled: false,
        label: 'none',
      };
    }
  };

const mapError = (error: string | undefined): BiometricAuthResult => {
  switch (error) {
    case 'user_cancel':
    case 'system_cancel':
    case 'app_cancel':
      return 'cancelled';
    case 'user_fallback':
      return 'fallback';
    case 'not_available':
    case 'not_enrolled':
    case 'passcode_not_set':
    // A hard OS lockout has to fall through to the PIN rather than read as a
    // wrong finger, or the owner is locked out of their own shop.
    case 'lockout':
    case 'lockout_permanent':
      return 'unavailable';
    default:
      return 'failed';
  }
};

export const authenticateOwner = async (
  reason: string,
): Promise<BiometricAuthResult> => {
  promptActive = true;
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: t('biometrics.cancel_label', { ns: 'settings' }),
      disableDeviceFallback: true,
    });
    if (result.success) {
      return 'success';
    }
    return mapError(result.error);
  } catch {
    return 'unavailable';
  } finally {
    promptActive = false;
  }
};
