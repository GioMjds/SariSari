import { db } from '@/configs';
import {
  generateSalt,
  hashPin,
  generateRecoveryCode,
  hashRecoveryCode,
  verifyPin,
  verifyRecoveryCode,
} from '@/lib/auth/crypto';

export interface AuthSettingsRow {
  id: number;
  pin_hash: string;
  pin_salt: string;
  recovery_code_hash: string;
  recovery_code_salt: string;
  created_at: number;
  updated_at: number;
}

export const initAuthTable = async (): Promise<void> => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS auth_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      pin_hash TEXT NOT NULL,
      pin_salt TEXT NOT NULL,
      recovery_code_hash TEXT NOT NULL,
      recovery_code_salt TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
};

export const isOwnerPinConfigured = async (): Promise<boolean> => {

  const row = await db.getFirstAsync<AuthSettingsRow>(
    'SELECT id FROM auth_settings WHERE id = 1',
  );
  return Boolean(row);
};

export const setupOwnerPin = async (
  pin: string,
): Promise<{ recoveryCode: string }> => {
  const now = Date.now();
  const pinSalt = await generateSalt();
  const pinHash = await hashPin(pin, pinSalt);

  const recoveryCode = generateRecoveryCode();
  const recoverySalt = await generateSalt();
  const recoveryHash = await hashRecoveryCode(recoveryCode, recoverySalt);

  await db.runAsync(
    `INSERT INTO auth_settings (id, pin_hash, pin_salt, recovery_code_hash, recovery_code_salt, created_at, updated_at)
     VALUES (1, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       pin_hash = excluded.pin_hash,
       pin_salt = excluded.pin_salt,
       recovery_code_hash = excluded.recovery_code_hash,
       recovery_code_salt = excluded.recovery_code_salt,
       updated_at = excluded.updated_at`,
    [pinHash, pinSalt, recoveryHash, recoverySalt, now, now],
  );

  return { recoveryCode };
};

export const verifyOwnerPin = async (pin: string): Promise<boolean> => {
  const row = await db.getFirstAsync<AuthSettingsRow>(
    'SELECT pin_hash, pin_salt FROM auth_settings WHERE id = 1',
  );
  if (!row) return false;
  return await verifyPin(pin, row.pin_salt, row.pin_hash);
};

export const verifyAndResetOwnerPinWithRecoveryCode = async (
  code: string,
  newPin: string,
): Promise<boolean> => {
  const row = await db.getFirstAsync<AuthSettingsRow>(
    'SELECT recovery_code_hash, recovery_code_salt FROM auth_settings WHERE id = 1',
  );
  if (!row) return false;

  const codeValid = await verifyRecoveryCode(
    code,
    row.recovery_code_salt,
    row.recovery_code_hash,
  );
  if (!codeValid) return false;

  const now = Date.now();
  const newPinSalt = await generateSalt();
  const newPinHash = await hashPin(newPin, newPinSalt);

  await db.runAsync(
    `UPDATE auth_settings SET pin_hash = ?, pin_salt = ?, updated_at = ? WHERE id = 1`,
    [newPinHash, newPinSalt, now],
  );
  return true;
};

export const changeOwnerPin = async (
  currentPin: string,
  newPin: string,
): Promise<boolean> => {
  const isValid = await verifyOwnerPin(currentPin);
  if (!isValid) return false;

  const now = Date.now();
  const newPinSalt = await generateSalt();
  const newPinHash = await hashPin(newPin, newPinSalt);

  await db.runAsync(
    `UPDATE auth_settings SET pin_hash = ?, pin_salt = ?, updated_at = ? WHERE id = 1`,
    [newPinHash, newPinSalt, now],
  );
  return true;
};
