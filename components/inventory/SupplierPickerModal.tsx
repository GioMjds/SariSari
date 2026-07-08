import { useState } from 'react';
import {
  Modal,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { useSuppliers } from '@/hooks/useSuppliers';
import { Supplier } from '@/types';
import { useTranslation } from 'react-i18next';

interface SupplierPickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedSupplierId: string | null;
  onSelect: (supplier: Supplier | null) => void;
}

export function SupplierPickerModal({
  visible,
  onClose,
  selectedSupplierId,
  onSelect,
}: SupplierPickerModalProps) {
  const { t } = useTranslation('inventory');
  const [search, setSearch] = useState('');
  const [isAddingInline, setIsAddingInline] = useState(false);
  const [newName, setNewName] = useState('');
  const [newContact, setNewContact] = useState('');

  const { getAllSuppliersQuery, insertSupplierMutation } = useSuppliers();
  const suppliers = getAllSuppliersQuery.data || [];

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase().trim()),
  );

  const handleAddSupplierInline = async () => {
    if (!newName.trim() || insertSupplierMutation.isPending) return;

    try {
      const newSupplier = await insertSupplierMutation.mutateAsync({
        name: newName.trim(),
        contact: newContact.trim() || null,
        notes: null,
      });

      onSelect(newSupplier);
      setIsAddingInline(false);
      setNewName('');
      setNewContact('');
      onClose();
    } catch {
      // handled by mutation / toast
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <View className="flex-1 justify-end bg-black/50">
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={onClose}
          />
          <View className="w-full bg-paper-50 rounded-t-2xl p-6 shadow-modal border-t border-ink-100 max-h-[80%] pb-10">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <StyledText variant="extrabold" className="text-lg text-ink-900">
                {t('selectSupplier')}
              </StyledText>
              <TouchableOpacity onPress={onClose} className="p-1">
                <FontAwesome name="times" size={20} color="#7A7165" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View className="flex-row items-center bg-white border border-ink-200 rounded-xl px-3 mb-4 shadow-sm">
              <FontAwesome
                name="search"
                size={14}
                color="#A89F90"
                className="mr-2"
              />
              <TextInput
                placeholder={t('searchSuppliersPlaceholder')}
                value={search}
                onChangeText={setSearch}
                placeholderTextColor="#A89F90"
                className="flex-1 py-2.5 font-stack-sans text-sm text-ink-900"
              />
            </View>

            {/* List */}
            {getAllSuppliersQuery.isLoading ? (
              <ActivityIndicator
                size="small"
                color="#E85A1F"
                className="py-6"
              />
            ) : (
              <FlatList
                data={filteredSuppliers}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListHeaderComponent={
                  <>
                    {/* Add Inline Button */}
                    <TouchableOpacity
                      onPress={() => setIsAddingInline(true)}
                      className="flex-row items-center py-3.5 px-2 border-b border-ink-100 mb-1"
                    >
                      <FontAwesome
                        name="plus-circle"
                        size={18}
                        color="#E85A1F"
                        className="mr-3"
                      />
                      <StyledText
                        variant="semibold"
                        className="text-persimmon-600 text-sm"
                      >
                        {t('inlineAddSupplier')}
                      </StyledText>
                    </TouchableOpacity>

                    {/* No Supplier option */}
                    <TouchableOpacity
                      onPress={() => {
                        onSelect(null);
                        onClose();
                      }}
                      className="flex-row items-center justify-between py-3.5 px-2 border-b border-ink-100"
                    >
                      <StyledText
                        variant={
                          selectedSupplierId === null ? 'extrabold' : 'medium'
                        }
                        className={
                          selectedSupplierId === null
                            ? 'text-persimmon-600'
                            : 'text-ink-700'
                        }
                      >
                        {t('noSupplier')}
                      </StyledText>
                      {selectedSupplierId === null && (
                        <FontAwesome name="check" size={14} color="#E85A1F" />
                      )}
                    </TouchableOpacity>
                  </>
                }
                renderItem={({ item }) => {
                  const isSelected = item.id === selectedSupplierId;
                  return (
                    <TouchableOpacity
                      onPress={() => {
                        onSelect(item);
                        onClose();
                      }}
                      className="flex-row items-center justify-between py-3.5 px-2 border-b border-ink-100"
                    >
                      <View className="flex-1 mr-3">
                        <StyledText
                          variant={isSelected ? 'extrabold' : 'medium'}
                          className={
                            isSelected
                              ? 'text-persimmon-600 text-sm'
                              : 'text-ink-800 text-sm'
                          }
                        >
                          {item.name}
                        </StyledText>
                        {item.contact ? (
                          <StyledText
                            variant="regular"
                            className="text-ink-500 text-xs mt-0.5"
                          >
                            {item.contact}
                          </StyledText>
                        ) : null}
                      </View>
                      {isSelected && (
                        <FontAwesome name="check" size={14} color="#E85A1F" />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Nested Add Supplier Modal */}
      <Modal
        visible={isAddingInline}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAddingInline(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <View className="flex-1 justify-center items-center px-6 bg-black/60">
            <View className="bg-white rounded-2xl p-6 w-full max-w-sm border border-ink-100 shadow-modal">
              {/* Header */}
              <View className="flex-row items-center justify-between mb-4">
                <StyledText
                  variant="extrabold"
                  className="text-base text-ink-900"
                >
                  {t('addSupplier')}
                </StyledText>
                <TouchableOpacity
                  onPress={() => setIsAddingInline(false)}
                  className="p-1"
                >
                  <FontAwesome name="times" size={16} color="#7A7165" />
                </TouchableOpacity>
              </View>

              {/* Form fields */}
              <View className="gap-4 mb-6">
                <View>
                  <StyledText
                    variant="semibold"
                    className="text-ink-700 text-xs mb-1.5"
                  >
                    {t('labelName')} *
                  </StyledText>
                  <TextInput
                    placeholder="e.g. Distributor Representative"
                    value={newName}
                    onChangeText={setNewName}
                    placeholderTextColor="#A89F90"
                    className="bg-ink-50 border border-ink-100 rounded-xl px-3.5 py-2.5 font-stack-sans text-sm text-ink-900"
                  />
                </View>
                <View>
                  <StyledText
                    variant="semibold"
                    className="text-ink-700 text-xs mb-1.5"
                  >
                    {t('labelContact')}
                  </StyledText>
                  <TextInput
                    placeholder="e.g. Phone number"
                    value={newContact}
                    onChangeText={setNewContact}
                    placeholderTextColor="#A89F90"
                    className="bg-ink-50 border border-ink-100 rounded-xl px-3.5 py-2.5 font-stack-sans text-sm text-ink-900"
                  />
                </View>
              </View>

              {/* Action buttons */}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setIsAddingInline(false)}
                  className="flex-1 bg-ink-100 border border-ink-200 rounded-xl py-3 items-center justify-center"
                >
                  <StyledText
                    variant="semibold"
                    className="text-ink-700 text-sm"
                  >
                    {t('common:cancel')}
                  </StyledText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddSupplierInline}
                  disabled={!newName.trim() || insertSupplierMutation.isPending}
                  className={`flex-1 rounded-xl py-3 items-center justify-center ${
                    newName.trim() ? 'bg-persimmon-500' : 'bg-ink-200'
                  }`}
                >
                  {insertSupplierMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <StyledText
                      variant="extrabold"
                      className="text-white text-sm"
                    >
                      {t('common:save')}
                    </StyledText>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
