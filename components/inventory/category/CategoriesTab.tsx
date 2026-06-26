import { StyledText } from '@/components/elements';
import { CategoryCard } from './CategoryCard';
import { useCategories } from '@/hooks';
import { CategoryWithCount } from '@/types';
import { Alert } from '@/utils';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  TextInput,
  View,
  Platform,
  KeyboardAvoidingView,
  TouchableOpacity,
} from 'react-native';
import { MotiView } from 'moti';

interface CategoryFormData {
  name: string;
}

export function CategoriesTab() {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryWithCount | null>(null);

  const { handleSubmit, control, reset } = useForm({
    mode: 'onBlur',
    defaultValues: {
      name: '',
    },
  });

  const router = useRouter();

  const {
    getCategoriesWithCountQuery,
    insertCategoryMutation,
    updateCategoryMutation,
    deleteCategoryMutation,
  } = useCategories();

  const {
    data: categories = [],
    isLoading,
    refetch,
  } = getCategoriesWithCountQuery;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleAddCategory = () => {
    reset({ name: '' });
    setShowAddModal(true);
  };

  const handleEditCategory = (category: CategoryWithCount) => {
    setSelectedCategory(category);
    reset({ name: category.name });
    setShowEditModal(true);
  };

  const handleDeleteCategory = (category: CategoryWithCount) => {
    setSelectedCategory(category);
    if (category.product_count > 0) {
      Alert.alert(
        'Category Has Products',
        `This category has ${category.product_count} product(s). Deleting it will remove the category from all products. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete Anyway',
            style: 'destructive',
            onPress: () => setShowDeleteModal(true),
          },
        ],
      );
    } else {
      setShowDeleteModal(true);
    }
  };

  const handleCategoryPress = (category: CategoryWithCount) => {
    router.push(`/(edit-forms)/category/${category.id}` as any);
  };

  const handleOpenActionSheet = (category: CategoryWithCount) => {
    setSelectedCategory(category);
  };

  const handleCloseActionSheet = () => {
    setSelectedCategory(null);
  };

  const handleSheetViewProducts = () => {
    if (!selectedCategory) return;
    const id = selectedCategory.id;
    setSelectedCategory(null);
    router.push(`/(edit-forms)/category/${id}` as any);
  };

  const handleSheetEdit = () => {
    if (!selectedCategory) return;
    const cat = selectedCategory;
    setSelectedCategory(null);
    handleEditCategory(cat);
  };

  const handleSheetDelete = () => {
    if (!selectedCategory) return;
    const cat = selectedCategory;
    setSelectedCategory(null);
    handleDeleteCategory(cat);
  };

  const submitAddCategory = async (data: CategoryFormData) => {
    if (!data.name.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    await insertCategoryMutation.mutateAsync({ name: data.name.trim() });
    setShowAddModal(false);
  };

  const submitEditCategory = async (data: CategoryFormData) => {
    if (!selectedCategory) return;
    if (!data.name.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    await updateCategoryMutation.mutateAsync({
      id: selectedCategory.id,
      name: data.name.trim(),
    });
    setShowEditModal(false);
  };

  const confirmDelete = async () => {
    if (!selectedCategory) return;

    await deleteCategoryMutation.mutateAsync(selectedCategory.id);
    setShowDeleteModal(false);
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center py-12">
        <ActivityIndicator size="large" color="#E85A1F" />
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Redesigned Categories Stats Card */}
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 320 }}
        className="px-4 pt-3 pb-2"
      >
        <View className="bg-white rounded-2xl p-4 flex-row items-center justify-between border border-ink-100 shadow-sm">
          <View>
            <StyledText
              variant="semibold"
              className="text-ink-400 text-xs uppercase tracking-wider mb-1"
            >
              Total Categories
            </StyledText>
            <StyledText variant="extrabold" className="text-ink-900 text-2xl">
              {categories.length}
            </StyledText>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleAddCategory}
            className="bg-persimmon-500 rounded-pill px-5 py-3 flex-row items-center gap-2 shadow-persimmon-glow"
          >
            <FontAwesome name="plus" size={14} color="#FBF7EE" />
            <StyledText variant="extrabold" className="text-paper-50 text-sm">
              Add Category
            </StyledText>
          </TouchableOpacity>
        </View>
      </MotiView>

      {/* Categories List with stagger animation */}
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              type: 'timing',
              duration: 320,
              delay: 100 + (index % 5) * 50,
            }}
          >
            <CategoryCard
              category={item}
              onPress={handleCategoryPress}
              onMore={handleOpenActionSheet}
            />
          </MotiView>
        )}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#E85A1F"
            colors={['#E85A1F']}
          />
        }
        ListEmptyComponent={
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 400 }}
            className="flex-1 justify-center items-center px-8 mt-24"
          >
            <FontAwesome
              name="folder-open"
              size={64}
              color="#E85A1F"
              style={{ opacity: 0.3 }}
            />
            <StyledText
              variant="semibold"
              className="text-ink-700 text-lg mt-4 text-center"
            >
              No categories yet
            </StyledText>
            <StyledText
              variant="regular"
              className="text-ink-500 text-sm mt-2 text-center"
            >
              Create categories to organize your products
            </StyledText>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleAddCategory}
              className="bg-persimmon-500 rounded-pill px-6 py-3 mt-6 shadow-persimmon-glow"
            >
              <StyledText variant="extrabold" className="text-white text-base">
                Add Category
              </StyledText>
            </TouchableOpacity>
          </MotiView>
        }
      />

      {/* Action Sheet Modal (Overflow menu) */}
      <Modal
        visible={!!selectedCategory && !showAddModal && !showEditModal && !showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseActionSheet}
        statusBarTranslucent
      >
        <Pressable
          className="flex-1 justify-end"
          onPress={handleCloseActionSheet}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        >
          <Pressable
            className="bg-white rounded-t-3xl p-6 pb-10"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="items-center mb-4">
              <View className="w-12 h-1 bg-ink-200 rounded-full mb-4" />
              <StyledText
                variant="extrabold"
                className="text-ink-900 text-lg text-center"
              >
                {selectedCategory?.name}
              </StyledText>
              <StyledText
                variant="regular"
                className="text-ink-500 text-xs text-center mt-1"
              >
                Select action to perform
              </StyledText>
            </View>

            <View className="gap-2">
              {/* Action: View Products */}
              <TouchableOpacity
                onPress={handleSheetViewProducts}
                activeOpacity={0.7}
                className="flex-row items-center py-4 px-4 bg-paper-100 rounded-xl border border-ink-100"
              >
                <FontAwesome
                  name="list-alt"
                  size={18}
                  color="#E85A1F"
                  className="mr-3 w-6 text-center"
                />
                <StyledText
                  variant="semibold"
                  className="text-ink-800 text-base"
                >
                  View Products
                </StyledText>
              </TouchableOpacity>

              {/* Action: Edit Category Name */}
              <TouchableOpacity
                onPress={handleSheetEdit}
                activeOpacity={0.7}
                className="flex-row items-center py-4 px-4 bg-paper-100 rounded-xl border border-ink-100"
              >
                <FontAwesome
                  name="pencil"
                  size={18}
                  color="#4A2610"
                  className="mr-3 w-6 text-center"
                />
                <StyledText
                  variant="extrabold"
                  className="text-cinnamon-500 text-base"
                >
                  Edit Category Name
                </StyledText>
              </TouchableOpacity>

              {/* Action: Delete Category */}
              <TouchableOpacity
                onPress={handleSheetDelete}
                activeOpacity={0.7}
                className="flex-row items-center py-4 px-4 bg-red-50 rounded-xl border border-red-200"
              >
                <FontAwesome
                  name="trash"
                  size={18}
                  color="#C22D2D"
                  className="mr-3 w-6 text-center"
                />
                <StyledText
                  variant="extrabold"
                  className="text-semantic-danger text-base"
                >
                  Delete Category
                </StyledText>
              </TouchableOpacity>

              {/* Divider */}
              <View className="h-[1px] bg-ink-100 my-2" />

              {/* Action: Cancel */}
              <TouchableOpacity
                onPress={handleCloseActionSheet}
                activeOpacity={0.7}
                className="flex-row items-center py-4 px-4 bg-ink-100 rounded-xl border border-ink-200"
              >
                <FontAwesome
                  name="times"
                  size={18}
                  color="#564E45"
                  className="mr-3 w-6 text-center"
                />
                <StyledText
                  variant="semibold"
                  className="text-ink-700 text-base"
                >
                  Cancel
                </StyledText>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add Category Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <Pressable
            className="flex-1 justify-end"
            onPress={() => setShowAddModal(false)}
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
          >
            <Pressable
              className="bg-white rounded-t-3xl p-6 max-h-[80%] w-full border-t border-ink-100"
              onPress={(e) => e.stopPropagation()}
            >
              <StyledText
                variant="extrabold"
                className="text-ink-900 text-xl mb-4"
              >
                Add Category
              </StyledText>

              {/* Name Input */}
              <View className="mb-6">
                <StyledText
                  variant="semibold"
                  className="text-ink-700 text-sm mb-2"
                >
                  Category Name *
                </StyledText>
                <Controller
                  control={control}
                  name="name"
                  rules={{ required: true }}
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      placeholder="e.g., Beverages"
                      value={value}
                      onChangeText={onChange}
                      className="bg-ink-50 border border-ink-100 rounded-xl px-4 py-3 font-stack-sans text-base text-ink-900"
                      placeholderTextColor="#A89F90"
                    />
                  )}
                />
              </View>

              {/* Buttons */}
              <View className="gap-3 mt-2">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleSubmit(submitAddCategory)}
                  disabled={insertCategoryMutation.isPending}
                  className="bg-persimmon-500 rounded-xl py-3.5 shadow-persimmon-glow"
                >
                  {insertCategoryMutation.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <StyledText
                      variant="extrabold"
                      className="text-white text-center text-base"
                    >
                      Add Category
                    </StyledText>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowAddModal(false)}
                  className="bg-ink-100 border border-ink-200 rounded-xl py-3.5"
                >
                  <StyledText
                    variant="semibold"
                    className="text-ink-700 text-center text-base"
                  >
                    Cancel
                  </StyledText>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <Pressable
            className="flex-1 justify-end"
            onPress={() => setShowEditModal(false)}
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
          >
            <Pressable
              className="bg-white rounded-t-3xl p-6 max-h-[80%] w-full border-t border-ink-100"
              onPress={(e) => e.stopPropagation()}
            >
              <StyledText
                variant="extrabold"
                className="text-ink-900 text-xl mb-4"
              >
                Edit Category
              </StyledText>

              {/* Name Input */}
              <View className="mb-6">
                <StyledText
                  variant="semibold"
                  className="text-ink-700 text-sm mb-2"
                >
                  Category Name *
                </StyledText>
                <Controller
                  control={control}
                  name="name"
                  rules={{ required: true }}
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      placeholder="e.g., Beverages"
                      value={value}
                      onChangeText={onChange}
                      className="bg-ink-50 border border-ink-100 rounded-xl px-4 py-3 font-stack-sans text-base text-ink-900"
                      placeholderTextColor="#A89F90"
                    />
                  )}
                />
              </View>

              {/* Buttons */}
              <View className="gap-3 mt-2">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleSubmit(submitEditCategory)}
                  disabled={updateCategoryMutation.isPending}
                  className="bg-persimmon-500 rounded-xl py-3.5 shadow-persimmon-glow"
                >
                  {updateCategoryMutation.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <StyledText
                      variant="extrabold"
                      className="text-white text-center text-base"
                    >
                      Save Changes
                    </StyledText>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowEditModal(false)}
                  className="bg-ink-100 border border-ink-200 rounded-xl py-3.5"
                >
                  <StyledText
                    variant="semibold"
                    className="text-ink-700 text-center text-base"
                  >
                    Cancel
                  </StyledText>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View
          className="flex-1 justify-center items-center px-6"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        >
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm border border-ink-100">
            <View className="items-center mb-4">
              <View className="bg-red-50 rounded-full p-4 mb-3">
                <FontAwesome
                  name="exclamation-triangle"
                  size={32}
                  color="#C13030"
                />
              </View>
              <StyledText
                variant="extrabold"
                className="text-ink-900 text-xl mb-2 text-center"
              >
                Delete Category?
              </StyledText>
              <StyledText
                variant="regular"
                className="text-ink-500 text-sm text-center"
              >
                {`Are you sure you want to delete "${selectedCategory?.name || ''}"?`}
              </StyledText>
              {selectedCategory && selectedCategory.product_count > 0 && (
                <StyledText
                  variant="semibold"
                  className="text-semantic-danger text-sm mt-2 text-center"
                >
                  This will remove the category from{' '}
                  {selectedCategory.product_count} product(s).
                </StyledText>
              )}
            </View>
            <View className="gap-3">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={confirmDelete}
                disabled={deleteCategoryMutation.isPending}
                className="bg-semantic-danger rounded-xl py-3.5 active:opacity-70"
              >
                {deleteCategoryMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <StyledText
                    variant="extrabold"
                    className="text-white text-center text-base"
                  >
                    Yes, Delete Category
                  </StyledText>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowDeleteModal(false)}
                className="bg-ink-100 border border-ink-200 rounded-xl py-3.5"
              >
                <StyledText
                  variant="semibold"
                  className="text-ink-700 text-center text-base"
                >
                  Cancel
                </StyledText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
