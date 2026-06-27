// components/settings/backup/RestorePickerModal.tsx
// Modal picker that lets the user choose a snapshot to restore. Spec §8.
//
// Phase 1: Local tab only. Phase 2 enables the Cloud tab when
// `useCloudBackups()` returns ≥1 entry.
//
// The picker is a controlled modal — `visible` + `onClose` rather than
// the global modal store, because it carries selection state that lives
// across renders and shouldn't survive a remount.

import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { Modal } from '@/components/ui/Modal';
import { RestoreConfirmDialog } from './RestoreConfirmDialog';
import type { CloudBackup, Snapshot } from '@/lib/backup';

type Tab = 'local' | 'cloud';

type RestorePickerModalProps = {
  visible: boolean;
  snapshots: Snapshot[];
  cloudBackups: CloudBackup[];
  selected: Snapshot | CloudBackup | null;
  onSelect: (item: Snapshot | CloudBackup) => void;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  confirming: boolean;
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatStamp = (isoStamp: string): string => {
  const m = isoStamp.match(
    /^(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})-(\d{3})$/,
  );
  if (!m) return isoStamp;
  const [, y, mo, d, hh, mm, ss] = m;
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const dt = new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(hh),
    Number(mm),
    Number(ss),
  );
  return `${monthNames[dt.getMonth()]} ${dt.getDate()}, ${hh}:${mm}`;
};

export function RestorePickerModal({
  visible,
  snapshots,
  cloudBackups,
  selected,
  onSelect,
  onClose,
  onConfirm,
  confirming,
}: RestorePickerModalProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('local');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleConfirmPress = () => {
    if (!selected) return;
    setConfirmOpen(true);
  };

  const handleConfirmYes = async () => {
    setConfirmOpen(false);
    await onConfirm();
  };

  return (
    <>
      <Modal
        visible={visible}
        onClose={onClose}
        title={t('common:restorePickerTitle')}
        icon="history"
        size="md"
        closeOnOverlay={!confirming}
      >
        {/* Tabs */}
        <View className="flex-row bg-warm-100 rounded-xl p-1 mb-3">
          <Pressable
            onPress={() => setTab('local')}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === 'local' }}
            className={`flex-1 py-2 rounded-lg items-center ${
              tab === 'local' ? 'bg-paper-50' : ''
            }`}
          >
            <StyledText
              variant={tab === 'local' ? 'extrabold' : 'semibold'}
              className={`text-xs uppercase ${
                tab === 'local' ? 'text-persimmon-600' : 'text-ink-500'
              }`}
              style={{ letterSpacing: 0.8 }}
            >
              {t('common:restorePickerTabLocal', {
                count: snapshots.length,
              })}
            </StyledText>
          </Pressable>
          <Pressable
            onPress={() => setTab('cloud')}
            disabled={cloudBackups.length === 0}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === 'cloud' }}
            className={`flex-1 py-2 rounded-lg items-center ${
              tab === 'cloud' ? 'bg-paper-50' : ''
            } ${cloudBackups.length === 0 ? 'opacity-50' : ''}`}
          >
            <StyledText
              variant={tab === 'cloud' ? 'extrabold' : 'semibold'}
              className={`text-xs uppercase ${
                tab === 'cloud' ? 'text-persimmon-600' : 'text-ink-500'
              }`}
              style={{ letterSpacing: 0.8 }}
            >
              {t('common:restorePickerTabCloud', {
                count: cloudBackups.length,
              })}
            </StyledText>
          </Pressable>
        </View>

        {/* Tab content */}
        {tab === 'local' ? (
          snapshots.length === 0 ? (
            <View className="py-8 items-center">
              <StyledText variant="regular" className="text-sm text-ink-400">
                {t('common:localSnapshotsEmpty')}
              </StyledText>
            </View>
          ) : (
            <ScrollView
              className="max-h-72"
              showsVerticalScrollIndicator={false}
            >
              {snapshots.map((snap) => {
                const filename = snap.path.split('/').pop() ?? '';
                const isoStamp = filename
                  .replace(/^sarisari_snapshot_/, '')
                  .replace(/\.db$/, '');
                const isSelected =
                selected != null &&
                'path' in selected &&
                selected.path === snap.path;
                return (
                  <Pressable
                    key={snap.path}
                    onPress={() => onSelect(snap)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={formatStamp(isoStamp)}
                    className={`flex-row items-center px-3 py-3 rounded-xl mb-2 border ${
                      isSelected
                        ? 'bg-persimmon-50 border-persimmon-500'
                        : 'bg-paper-50 border-warm-100'
                    } active:opacity-80`}
                  >
                    <View
                      className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
                        isSelected
                          ? 'bg-persimmon-500 border-persimmon-500'
                          : 'border-ink-200'
                      }`}
                    >
                      {isSelected ? (
                        <FontAwesome name="check" size={10} color="#FBF7EE" />
                      ) : null}
                    </View>
                    <View className="flex-1">
                      <StyledText
                        variant={isSelected ? 'extrabold' : 'semibold'}
                        className="text-sm text-ink-700"
                      >
                        {formatStamp(isoStamp)}
                      </StyledText>
                      <StyledText
                        variant="regular"
                        className="text-xs text-ink-400 mt-0.5"
                      >
                        {t('common:localSnapshotsAutoLabel')} ·{' '}
                        {formatBytes(snap.bytes)}
                      </StyledText>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )
        ) : cloudBackups.length === 0 ? (
          <View className="py-8 items-center">
            <FontAwesome name="cloud" size={32} color="#9C8E7E" />
            <StyledText
              variant="regular"
              className="text-sm text-ink-400 mt-3 text-center"
            >
              {t('common:restorePickerCloudEmpty')}
            </StyledText>
          </View>
        ) : (
          <ScrollView
            className="max-h-72"
            showsVerticalScrollIndicator={false}
          >
            {cloudBackups.map((backup) => {
              const dt = new Date(backup.metadata.updatedAt);
              const monthNames = [
                'Jan',
                'Feb',
                'Mar',
                'Apr',
                'May',
                'Jun',
                'Jul',
                'Aug',
                'Sep',
                'Oct',
                'Nov',
                'Dec',
              ];
              const stamp = `${monthNames[dt.getMonth()]} ${dt.getDate()}, ${String(
                dt.getHours(),
              ).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
              const isSelected =
                selected != null &&
                'fileId' in selected &&
                selected.fileId === backup.fileId;
              return (
                <Pressable
                  key={backup.fileId}
                  onPress={() => onSelect(backup)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={stamp}
                  className={`flex-row items-center px-3 py-3 rounded-xl mb-2 border ${
                    isSelected
                      ? 'bg-persimmon-50 border-persimmon-500'
                      : 'bg-paper-50 border-warm-100'
                  } active:opacity-80`}
                >
                  <View
                    className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
                      isSelected
                        ? 'bg-persimmon-500 border-persimmon-500'
                        : 'border-ink-200'
                    }`}
                  >
                    {isSelected ? (
                      <FontAwesome name="check" size={10} color="#FBF7EE" />
                    ) : null}
                  </View>
                  <View className="flex-1">
                    <StyledText
                      variant={isSelected ? 'extrabold' : 'semibold'}
                      className="text-sm text-ink-700"
                    >
                      {stamp}
                    </StyledText>
                    <StyledText
                      variant="regular"
                      className="text-xs text-ink-400 mt-0.5"
                    >
                      {backup.metadata.storeName ||
                        t('common:cloudBackupSectionTitle')}
                      {backup.metadata.salesCount
                        ? ` · ${backup.metadata.salesCount} sales`
                        : ''}
                    </StyledText>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* Warning footer + restore button */}
        <View className="mt-3 pt-3 border-t border-warm-100">
          <View className="flex-row items-start mb-3">
            <FontAwesome
              name="exclamation-triangle"
              size={14}
              color="#C77B0E"
              style={{ marginTop: 2, marginRight: 8 }}
            />
            <StyledText
              variant="regular"
              className="text-xs text-ink-500 flex-1"
            >
              {t('common:restorePickerConfirmMessage')}
            </StyledText>
          </View>

          <Pressable
            onPress={handleConfirmPress}
            disabled={!selected || confirming}
            accessibilityRole="button"
            accessibilityLabel={t('common:restorePickerConfirmAction')}
            className={`rounded-xl py-3 items-center ${
              !selected
                ? 'bg-warm-200'
                : confirming
                  ? 'bg-semantic-danger border border-persimmon-300'
                  : 'bg-semantic-danger'
            }`}
          >
            <StyledText
              variant="extrabold"
              className={`text-sm uppercase ${
                !selected ? 'text-ink-400' : 'text-white'
              }`}
              style={{ letterSpacing: 0.8 }}
            >
              {confirming
                ? t('common:restoreInProgress')
                : t('common:restorePickerConfirmAction')}
            </StyledText>
          </Pressable>
        </View>
      </Modal>

      <RestoreConfirmDialog
        visible={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmYes}
      />
    </>
  );
}
