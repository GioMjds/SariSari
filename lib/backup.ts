import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as Updates from 'expo-updates';
import { Alert } from 'react-native';

const DB_NAME = 'sarisari.db';
const DB_DIR = `${FileSystem.documentDirectory}SQLite/`;
const DB_PATH = `${DB_DIR}${DB_NAME}`;

// The base64-encoded string for the first 16 bytes of a valid SQLite database:
// "SQLite format 3\0" -> Hex: 53 51 4c 69 74 65 20 66 6f 72 6d 61 74 20 33 00
// Base64: U1FMaXRlIGZvcm1hdCAzAA==
const SQLITE_HEADER_B64 = 'U1FMaXRlIGZvcm1hdCAzAA==';

/**
 * Exports the local SQLite database to the device's sharing sheet.
 * The file is copied to a temporary location with a date stamp, shared,
 * and then cleaned up.
 */
export async function exportBackup(t: any): Promise<boolean> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(DB_PATH);
    if (!fileInfo.exists) {
      Alert.alert(
        t('common:backupErrorTitle', 'Error'),
        t('common:backupNoDatabase', 'No database found to backup.')
      );
      return false;
    }

    // Ensure sharing is available
    const isSharingAvailable = await Sharing.isAvailableAsync();
    if (!isSharingAvailable) {
      Alert.alert(
        t('common:backupErrorTitle', 'Error'),
        t('common:sharingNotAvailable', 'Sharing is not available on this device.')
      );
      return false;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const tempBackupPath = `${FileSystem.cacheDirectory}sarisari_backup_${timestamp}.db`;

    // Copy DB to temp cache directory for sharing
    await FileSystem.copyAsync({
      from: DB_PATH,
      to: tempBackupPath,
    });

    await Sharing.shareAsync(tempBackupPath, {
      dialogTitle: t('common:backupShareTitle', 'Export SariSari Backup'),
      mimeType: 'application/octet-stream',
      UTI: 'public.database',
    });

    // Clean up cache file asynchronously
    FileSystem.deleteAsync(tempBackupPath, { idempotent: true }).catch((err) => {
      console.warn('Failed to delete temp backup file:', err);
    });

    return true;
  } catch (error) {
    console.error('Backup export failed:', error);
    Alert.alert(
      t('common:backupErrorTitle', 'Error'),
      t('common:backupExportFailed', 'Failed to export backup file.')
    );
    return false;
  }
}

/**
 * Prompts the user to pick a backup file, validates it is a SQLite database,
 * and replaces the current database with it. The app is then reloaded.
 */
export async function importRestore(
  t: any,
  onConfirm: () => Promise<void> | void
): Promise<boolean> {
  try {
    // 1. Pick file
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return false;
    }

    const pickedUri = result.assets[0].uri;

    // 2. Validate file exists and size is > 0
    const pickedInfo = await FileSystem.getInfoAsync(pickedUri);
    if (!pickedInfo.exists || pickedInfo.size === 0) {
      Alert.alert(
        t('common:restoreErrorTitle', { defaultValue: 'Restore Error' }),
        t('common:restoreInvalidFile', { defaultValue: 'Selected file is empty or missing.' })
      );
      return false;
    }

    // 3. Read first 16 bytes and verify SQLite header
    const headerB64 = await FileSystem.readAsStringAsync(pickedUri, {
      encoding: FileSystem.EncodingType.Base64,
      position: 0,
      length: 16,
    });

    if (headerB64 !== SQLITE_HEADER_B64) {
      Alert.alert(
        t('common:restoreErrorTitle', { defaultValue: 'Restore Error' }),
        t('common:restoreInvalidFormat', { defaultValue: 'The selected file is not a valid SariSari database backup.' })
      );
      return false;
    }

    // 4. Confirm destructive overwrite
    Alert.alert(
      t('common:restoreConfirmTitle', { defaultValue: 'Confirm Restore' }),
      t('common:restoreConfirmMessage', {
        defaultValue: 'This will replace all your current inventory, POS sales, and suki utang. This cannot be undone. The app will reload to apply changes.',
      }),
      [
        { text: t('common:cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
        {
          text: t('common:restoreConfirmAction', { defaultValue: 'Restore & Reload' }),
          style: 'destructive',
          onPress: async () => {
            try {
              if (onConfirm) await onConfirm();

              // Ensure SQLite directory exists
              const dirInfo = await FileSystem.getInfoAsync(DB_DIR);
              if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(DB_DIR, { intermediates: true });
              }

              // Deleting SQLite WAL and SHM files to prevent corruption from the active connection
              await FileSystem.deleteAsync(`${DB_PATH}-wal`, { idempotent: true });
              await FileSystem.deleteAsync(`${DB_PATH}-shm`, { idempotent: true });

              // Copy selected file to active SQLite path
              await FileSystem.copyAsync({
                from: pickedUri,
                to: DB_PATH,
              });

              // Clean up picked file in cache
              await FileSystem.deleteAsync(pickedUri, { idempotent: true }).catch(() => {});

              // Reload JS bundle to restart db connection and run migrations
              try {
                await Updates.reloadAsync();
              } catch (reloadErr) {
                console.warn('Updates.reloadAsync failed, alerting user to restart manually', reloadErr);
                Alert.alert(
                  t('common:restoreSuccessTitle', { defaultValue: 'Restore Complete' }),
                  t('common:restoreSuccessManualRestart', {
                    defaultValue: 'Database restored successfully! Please close and reopen the app to apply the changes.',
                  })
                );
              }
            } catch (err) {
              console.error('Failed to copy database file:', err);
              Alert.alert(
                t('common:restoreErrorTitle', { defaultValue: 'Restore Error' }),
                t('common:restoreFailed', { defaultValue: 'Failed to overwrite database. Please try again.' })
              );
            }
          },
        },
      ]
    );

    return true;
  } catch (error) {
    console.error('Restore failed:', error);
    Alert.alert(
      t('common:restoreErrorTitle', { defaultValue: 'Restore Error' }),
      t('common:restoreFailedGeneric', { defaultValue: 'An unexpected error occurred during restore.' })
    );
    return false;
  }
}
