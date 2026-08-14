import * as Crypto from 'expo-crypto';

export async function generateSalt(): Promise<string> {
  let randomBytes: Uint8Array;
  if (typeof Crypto.getRandomBytesAsync === 'function') {
    randomBytes = await Crypto.getRandomBytesAsync(16);
  } else if (typeof (Crypto as any).getRandomBytes === 'function') {
    randomBytes = (Crypto as any).getRandomBytes(16);
  } else {
    throw new Error('No secure random source available for salt generation');
  }
  return Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${pin}:${salt}`,
  );
}

export function generateRecoveryCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude ambiguous chars (0, O, 1, I)
  let result = '';
  const bytes = new Uint8Array(8);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 8; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < 8; i++) {
    result += chars[bytes[i]! % chars.length];
  }
  return `${result.slice(0, 4)}-${result.slice(4)}`;
}

export function normalizeCode(code: string): string {
  return code.replace(/[^A-Z0-9]/gi, '').toUpperCase();
}

export async function hashRecoveryCode(
  code: string,
  salt: string,
): Promise<string> {
  const normalized = normalizeCode(code);
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${normalized}:${salt}`,
  );
}

export async function verifyPin(
  pin: string,
  salt: string,
  expectedHash: string,
): Promise<boolean> {
  return (await hashPin(pin, salt)) === expectedHash;
}

export async function verifyRecoveryCode(
  code: string,
  salt: string,
  expectedHash: string,
): Promise<boolean> {
  return (await hashRecoveryCode(code, salt)) === expectedHash;
}

export async function verifyHash(
  input: string,
  salt: string,
  expectedHash: string,
): Promise<boolean> {
  const calculatedHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${input}:${salt}`,
  );
  return calculatedHash === expectedHash;
}


