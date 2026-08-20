import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'biometric_unlock_enabled';

export type BiometricAvailability = {
  available: boolean;
  enrolled: boolean;
  fingerprint: boolean;
  facialRecognition: boolean;
  iris: boolean;
};

export async function getBiometricAvailability(): Promise<BiometricAvailability> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();

  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

  return {
    available: hasHardware && enrolled,
    enrolled,
    fingerprint: types.includes(
      LocalAuthentication.AuthenticationType.FINGERPRINT,
    ),
    facialRecognition: types.includes(
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
    ),
    iris: types.includes(LocalAuthentication.AuthenticationType.IRIS),
  };
}

export async function authenticateWithBiometrics() {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();

  if (!hasHardware) {
    return {
      success: false,
      reason: 'BIOMETRICS_NOT_SUPPORTED',
    };
  }

  const enrolled = await LocalAuthentication.isEnrolledAsync();

  if (!enrolled) {
    return {
      success: false,
      reason: 'BIOMETRICS_NOT_ENROLLED',
    };
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock SariSari',
    promptSubtitle: 'Please verify your identity',
    promptDescription: 'Use biometrics to unlock the app and access your store',
    cancelLabel: 'Cancel',
    disableDeviceFallback: true,
    biometricsSecurityLevel: 'strong',
  });

  if (result.success) {
    return { success: true };
  }

  return {
    success: false,
    reason: result.error,
  };
}

export async function enableBiometricUnlock() {
  await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
}

export async function disableBiometricUnlock() {
  await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
}

export async function isBiometricUnlockEnabled(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);

  return value === 'true';
}
