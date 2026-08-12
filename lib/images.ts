import { File, Directory, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

export async function requestCameraPermissions(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === ImagePicker.PermissionStatus.GRANTED;
}

export async function requestLibraryPermissions(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === ImagePicker.PermissionStatus.GRANTED;
}

export async function pickProductImage(): Promise<string | null> {
  const hasPermission = await requestLibraryPermissions();
  if (!hasPermission) {
    throw new Error('Permission to access photo library is required');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const firstAsset = result.assets[0];
  return firstAsset ? firstAsset.uri : null;
}

export async function takeProductPhoto(): Promise<string | null> {
  const hasPermission = await requestCameraPermissions();
  if (!hasPermission) {
    throw new Error('Permission to access camera is required');
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const firstAsset = result.assets[0];
  return firstAsset ? firstAsset.uri : null;
}

const IMAGE_DIR_NAME = 'product_images';

export async function ensureImageDirectory(): Promise<void> {
  const dir = new Directory(Paths.document, IMAGE_DIR_NAME);
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
}

/**
 * Copies a temporary URI (from camera or library) to the permanent app documents directory.
 * Returns the relative path to be stored in SQLite.
 */
export async function saveProductImageLocal(tempUri: string): Promise<string> {
  await ensureImageDirectory();

  // Extract file extension, guarding against content:// URIs and URIs
  // without a dot-extension (e.g. Android media content URIs where
  // `.split('.')` returns the whole URI as the single token).
  const rawExtension = tempUri.split('.').pop()?.split('?')[0] ?? '';
  const extension = /^[a-zA-Z0-9]{1,6}$/.test(rawExtension)
    ? rawExtension
    : 'jpg';
  const filename = `prod_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}.${extension}`;
  const relativePath = `${IMAGE_DIR_NAME}/${filename}`;

  const tempFile = new File(tempUri);
  const destFile = new File(Paths.document, relativePath);

  await tempFile.copy(destFile);

  return relativePath;
}

/**
 * Prepends FileSystem.documentDirectory to a relative path stored in SQLite.
 * Returns null if path is falsy.
 */
export function getProductImageUri(
  relativeImagePath: string | null | undefined,
): string | null {
  if (!relativeImagePath) return null;

  // If it's already an absolute or network path, return as is
  if (
    relativeImagePath.startsWith('file://') ||
    relativeImagePath.startsWith('http://') ||
    relativeImagePath.startsWith('https://') ||
    relativeImagePath.startsWith('content://')
  ) {
    return relativeImagePath;
  }

  return new File(Paths.document, relativeImagePath).uri;
}

/**
 * Deletes a product image from the local filesystem.
 */
export async function deleteLocalProductImage(
  relativeImagePath: string | null | undefined,
): Promise<void> {
  if (!relativeImagePath) return;

  // Don't try to delete web URIs
  if (
    relativeImagePath.startsWith('http://') ||
    relativeImagePath.startsWith('https://')
  ) {
    return;
  }

  const absoluteUri = getProductImageUri(relativeImagePath);
  if (!absoluteUri) return;

  try {
    const file = new File(absoluteUri);
    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.error('Error deleting local product image:', error);
  }
}
