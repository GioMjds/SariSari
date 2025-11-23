import StyledText from '@/components/elements/StyledText';
import CategoryCard from '@/components/products/CategoryCard';
import { useCategories } from '@/hooks/useCategories';
import { CategoryWithCount } from '@/types/categories.types';
import { Alert } from '@/utils/alert';
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
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

interface CategoryFormData {
	name: string;
}

export default function CategoriesTab() {
	const [refreshing, setRefreshing] = useState(false);
	const [showAddModal, setShowAddModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [selectedCategory, setSelectedCategory] =
		useState<CategoryWithCount | null>(null);

	// use react-hook-form for the add/edit category forms

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
	} = getCategoriesWithCountQuery();

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
				]
			);
		} else {
			setShowDeleteModal(true);
		}
	};

	const handleCategoryPress = (category: CategoryWithCount) => {
		// Navigate to category detail screen using the category id
		router.push(`/(edit-forms)/category/${category.id}` as any);
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

		try {
			await updateCategoryMutation.mutateAsync({
				id: selectedCategory.id,
				name: data.name.trim(),
			});
			setShowEditModal(false);
		} catch (error) {
			// Error handled by mutation
		}
	};

	const confirmDelete = async () => {
		if (!selectedCategory) return;

		try {
			await deleteCategoryMutation.mutateAsync(selectedCategory.id);
			setShowDeleteModal(false);
		} catch (error) {
			// Error handled by mutation
		}
	};

	if (isLoading) {
		return (
			<View className="flex-1 justify-center items-center">
				<ActivityIndicator size="large" color="#7A1CAC" />
			</View>
		);
	}

	return (
		<View className="flex-1">
			{/* Stats Card */}
			<View className="px-4 pt-3 pb-2">
				<View className="bg-white rounded-xl p-4 flex-row items-center justify-between">
					<View>
						<StyledText
							variant="regular"
							className="text-secondary text-sm mb-1"
						>
							Total Categories
						</StyledText>
						<StyledText
							variant="extrabold"
							className="text-secondary text-2xl"
						>
							{categories.length}
						</StyledText>
					</View>
					<Pressable
						onPress={handleAddCategory}
						className="bg-accent rounded-xl px-4 py-3 flex-row items-center gap-2 active:opacity-70"
					>
						<FontAwesome name="plus" size={16} color="#fff" />
						<StyledText
							variant="semibold"
							className="text-white text-sm"
						>
							Add Category
						</StyledText>
					</Pressable>
				</View>
			</View>

			{/* Categories List */}
			<FlatList
				data={categories}
				keyExtractor={(item) => item.id.toString()}
				renderItem={({ item }) => (
					<CategoryCard
						category={item}
						onPress={handleCategoryPress}
						onEdit={handleEditCategory}
						onDelete={handleDeleteCategory}
					/>
				)}
				contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor="#7A1CAC"
					/>
				}
				ListEmptyComponent={
					<View
						className="flex-1 justify-center items-center px-8"
						style={{ marginTop: 230 }}
					>
						<FontAwesome
							name="folder-open"
							size={64}
							color="#AD49E1"
							style={{ opacity: 0.3 }}
						/>
						<StyledText
							variant="semibold"
							className="text-text-secondary text-lg mt-4 text-center"
						>
							No categories yet
						</StyledText>
						<StyledText
							variant="regular"
							className="text-text-muted text-sm mt-2 text-center"
						>
							Create categories to organize your products
						</StyledText>
						<Pressable
							onPress={handleAddCategory}
							className="bg-accent rounded-xl px-6 py-3 mt-6 active:opacity-70"
						>
							<StyledText
								variant="semibold"
								className="text-white text-base"
							>
								Add Category
							</StyledText>
						</Pressable>
					</View>
				}
			/>

			{/* Add Category Modal */}
			<Modal
				visible={showAddModal}
				transparent
				animationType="fade"
				onRequestClose={() => setShowAddModal(false)}
			>
				<Pressable
					className="flex-1 justify-end"
					onPress={() => setShowAddModal(false)}
					style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
				>
					<KeyboardAwareScrollView
						enableOnAndroid
						enableAutomaticScroll
						extraScrollHeight={280}
						keyboardShouldPersistTaps="handled"
						contentContainerStyle={{
							flexGrow: 1,
							justifyContent: 'flex-end',
						}}
					>
						<Pressable
							className="bg-white rounded-t-3xl p-6 max-h-[80%]"
							onPress={(e) => e.stopPropagation()}
						>
							<StyledText
								variant="extrabold"
								className="text-text-primary text-xl mb-4"
							>
								Add Category
							</StyledText>

							{/* Name Input */}
							<View className="mb-4">
								<StyledText
									variant="semibold"
									className="text-text-primary text-sm mb-2"
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
											className="bg-gray-50 rounded-xl px-4 py-3 font-stack-sans text-base text-text-primary"
											placeholderTextColor="#9ca3af"
										/>
									)}
								/>
							</View>

							{/* Buttons */}
							<View className="gap-3 mt-2">
								<Pressable
									onPress={handleSubmit(submitAddCategory)}
									disabled={insertCategoryMutation.isPending}
									className="bg-accent rounded-xl py-3 active:opacity-70"
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
								</Pressable>
								<Pressable
									onPress={() => setShowAddModal(false)}
									className="bg-gray-200 rounded-xl py-3 active:opacity-70"
								>
									<StyledText
										variant="semibold"
										className="text-text-primary text-center text-base"
									>
										Cancel
									</StyledText>
								</Pressable>
							</View>
						</Pressable>
					</KeyboardAwareScrollView>
				</Pressable>
			</Modal>

			{/* Edit Category Modal */}
			<Modal
				visible={showEditModal}
				transparent
				animationType="fade"
				onRequestClose={() => setShowEditModal(false)}
			>
				<Pressable
					className="flex-1 justify-end"
					onPress={() => setShowEditModal(false)}
					style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
				>
					<KeyboardAwareScrollView
						enableOnAndroid
						enableAutomaticScroll
						extraScrollHeight={280}
						keyboardShouldPersistTaps="handled"
						contentContainerStyle={{
							flexGrow: 1,
							justifyContent: 'flex-end',
						}}
					>
						<Pressable
							className="bg-white rounded-t-3xl p-6 max-h-[80%]"
							onPress={(e) => e.stopPropagation()}
						>
							<StyledText
								variant="extrabold"
								className="text-text-primary text-xl mb-4"
							>
								Edit Category
							</StyledText>

							{/* Name Input */}
							<View className="mb-4">
								<StyledText
									variant="semibold"
									className="text-text-primary text-sm mb-2"
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
											className="bg-gray-50 rounded-xl px-4 py-3 font-stack-sans text-base text-text-primary"
											placeholderTextColor="#9ca3af"
										/>
									)}
								/>
							</View>

							{/* Buttons */}
							<View className="gap-3 mt-2">
								<Pressable
									onPress={handleSubmit(submitEditCategory)}
									disabled={updateCategoryMutation.isPending}
									className="bg-accent rounded-xl py-3 active:opacity-70"
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
								</Pressable>
								<Pressable
									onPress={() => setShowEditModal(false)}
									className="bg-gray-200 rounded-xl py-3 active:opacity-70"
								>
									<StyledText
										variant="semibold"
										className="text-text-primary text-center text-base"
									>
										Cancel
									</StyledText>
								</Pressable>
							</View>
						</Pressable>
					</KeyboardAwareScrollView>
				</Pressable>
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
					<View className="bg-white rounded-2xl p-6 w-full max-w-sm">
						<View className="items-center mb-4">
							<View className="bg-red-100 rounded-full p-4 mb-3">
								<FontAwesome
									name="exclamation-triangle"
									size={32}
									color="#dc2626"
								/>
							</View>
							<StyledText
								variant="extrabold"
								className="text-text-primary text-xl mb-2 text-center"
							>
								Delete Category?
							</StyledText>
							<StyledText
								variant="regular"
								className="text-text-secondary text-sm text-center"
							>
								Are you sure you want to delete "
								{selectedCategory?.name}"?
							</StyledText>
							{selectedCategory &&
								selectedCategory.product_count > 0 && (
									<StyledText
										variant="semibold"
										className="text-red-600 text-sm mt-2 text-center"
									>
										This will remove the category from{' '}
										{selectedCategory.product_count}{' '}
										product(s).
									</StyledText>
								)}
						</View>
						<View className="gap-3">
							<Pressable
								onPress={confirmDelete}
								disabled={deleteCategoryMutation.isPending}
								className="bg-red-600 rounded-xl py-3 active:opacity-70"
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
							</Pressable>
							<Pressable
								onPress={() => setShowDeleteModal(false)}
								className="bg-gray-200 rounded-xl py-3 active:opacity-70"
							>
								<StyledText
									variant="semibold"
									className="text-text-primary text-center text-base"
								>
									Cancel
								</StyledText>
							</Pressable>
						</View>
					</View>
				</View>
			</Modal>
		</View>
	);
}
