import StyledText from '@/components/elements/StyledText';
import { useProducts } from '@/hooks/useProducts';
import { Alert } from '@/utils/alert';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    ActivityIndicator,
    BackHandler,
    Platform,
    Pressable,
    ScrollView,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORIES = [
    'Snacks',
    'Drinks',
    'Household',
    'Frozen',
    'Cigarettes',
    'Other',
];

interface AddProductForm {
    productName: string;
    sku: string;
    bundleCost: string;
    piecesPerBundle: string;
    costPerPiece: string;
    price: string;
    initialStock: string;
    category: string;
}

export default function AddProduct() {
    const [autoGenerateSku, setAutoGenerateSku] = useState<boolean>(true);
    const [useBundlePricing, setUseBundlePricing] = useState<boolean>(false);

    const router = useRouter();

    const { insertProductMutation } = useProducts();

    const {
        handleSubmit,
        control,
        setValue,
        watch,
        formState: { isDirty },
    } = useForm<AddProductForm>({
        mode: 'onSubmit',
        defaultValues: {
            productName: '',
            sku: '',
            bundleCost: '',
            piecesPerBundle: '',
            costPerPiece: '',
            price: '',
            initialStock: '',
            category: '',
        },
    });

    const formValues = watch();

    const safeTrim = (s?: string) => (s ?? '').trim();

    const hasActualChanges =
        isDirty &&
        (safeTrim(formValues?.productName) !== '' ||
            safeTrim(formValues?.price) !== '' ||
            safeTrim(formValues?.costPerPiece) !== '' ||
            safeTrim(formValues?.bundleCost) !== '' ||
            safeTrim(formValues?.initialStock) !== '');

    // Auto-calculate cost per piece when bundle values change
    useEffect(() => {
        if (
            useBundlePricing &&
            formValues.bundleCost &&
            formValues.piecesPerBundle
        ) {
            const bundleCost = parseFloat(formValues.bundleCost);
            const pieces = parseInt(formValues.piecesPerBundle);
            if (!isNaN(bundleCost) && !isNaN(pieces) && pieces > 0) {
                const costPerPiece = bundleCost / pieces;
                setValue('costPerPiece', costPerPiece.toFixed(2));
            }
        }
    }, [
        formValues.bundleCost,
        formValues.piecesPerBundle,
        useBundlePricing,
        setValue,
    ]);

    // Generate SKU from product name
    const generateSku = (name: string) => {
        if (!name) return '';
        const parts = name.trim().split(' ');
        const prefix = parts
            .slice(0, 2)
            .map((p) => p.charAt(0).toUpperCase())
            .join('');
        const timestamp = Date.now().toString().slice(-4);
        return `${prefix}-${timestamp}`;
    };

    // Auto-generate SKU when product name changes
    const handleNameChange = (text: string) => {
        if (autoGenerateSku) setValue('sku', generateSku(text));
    };

    // Handle back navigation
    const handleBackPress = () => {
        if (hasActualChanges) {
            Alert.alert(
                'Unsaved Changes',
                'You have unsaved changes. Are you sure you want to discard them?',
                [
                    { text: "Don't Leave", style: 'cancel', onPress: () => {} },
                    {
                        text: 'Discard',
                        style: 'destructive',
                        onPress: () => router.back(),
                    },
                ]
            );
        } else {
            router.back();
        }
    };

    // Handle hardware back button
    useEffect(() => {
        const onBackPress = () => {
            if (hasActualChanges) {
                Alert.alert(
                    'Unsaved Changes',
                    'You have unsaved changes. Are you sure you want to discard them?',
                    [
                        {
                            text: "Don't Leave",
                            style: 'cancel',
                            onPress: () => {},
                        },
                        {
                            text: 'Discard',
                            style: 'destructive',
                            onPress: () => router.back(),
                        },
                    ]
                );
                return true;
            }
            return false;
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            onBackPress
        );

        return () => backHandler.remove();
    }, [hasActualChanges, router]);

    const onSubmit = async (data: AddProductForm) => {
        if (!data.productName.trim())
            throw new Error('Product name is required');
        if (!data.sku.trim()) throw new Error('SKU is required');
        if (!data.price || parseFloat(data.price) <= 0)
            throw new Error('Valid price is required');

        const priceValue = parseFloat(data.price);
        const stockValue = data.initialStock ? parseInt(data.initialStock) : 0;
        const costPriceValue = data.costPerPiece
            ? parseFloat(data.costPerPiece)
            : undefined;

        // Validate that cost price is less than selling price
        if (costPriceValue !== undefined && costPriceValue >= priceValue) {
            throw new Error('Cost price must be less than selling price');
        }

        // Insert product with initial stock and cost price
        await insertProductMutation.mutateAsync({
            name: data.productName.trim(),
            sku: data.sku.trim(),
            price: priceValue,
            quantity: stockValue,
            cost_price: costPriceValue,
        });

        router.push('/(tabs)');
    };

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            {/* Header */}
            <View className="bg-primary px-4 py-6 flex-row items-center">
                <TouchableOpacity
                    hitSlop={20}
                    activeOpacity={0.2}
                    onPress={handleBackPress}
                    className="mr-3"
                >
                    <FontAwesome name="arrow-left" size={20} color="#fff" />
                </TouchableOpacity>
                <StyledText variant="extrabold" className="text-white text-2xl">
                    Add Product
                </StyledText>
            </View>

            <KeyboardAwareScrollView
                enableOnAndroid
                extraScrollHeight={Platform.OS === 'ios' ? 100 : 80}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                    padding: 16,
                    paddingBottom: 32,
                    flexGrow: 1,
                }}
                className="flex-1"
            >
                {/* Product Name */}
                <View className="mb-4">
                    <StyledText
                        variant="semibold"
                        className="text-text-primary text-sm mb-2"
                    >
                        Product Name *
                    </StyledText>
                    <Controller
                        control={control}
                        name="productName"
                        render={({ field: { value, onChange } }) => (
                            <TextInput
                                placeholder="e.g., Lucky Me Pancit Canton"
                                value={value}
                                onChangeText={(text) => {
                                    onChange(text);
                                    handleNameChange(text);
                                }}
                                className="bg-white rounded-xl px-4 py-3 font-stack-sans text-base text-text-primary shadow-sm"
                                placeholderTextColor="#9ca3af"
                            />
                        )}
                    />
                </View>

                {/* SKU */}
                <View className="mb-4">
                    <View className="flex-row justify-between items-center mb-2">
                        <StyledText
                            variant="semibold"
                            className="text-text-primary text-sm"
                        >
                            SKU (Stock Keeping Unit) *
                        </StyledText>
                        <Pressable
                            onPress={() => setAutoGenerateSku(!autoGenerateSku)}
                            className="flex-row items-center active:opacity-50"
                        >
                            <View
                                className={`w-5 h-5 rounded border-2 mr-2 items-center justify-center ${
                                    autoGenerateSku
                                        ? 'bg-accent border-accent'
                                        : 'border-gray-300'
                                }`}
                            >
                                {autoGenerateSku && (
                                    <FontAwesome
                                        name="check"
                                        size={12}
                                        color="#fff"
                                    />
                                )}
                            </View>
                            <StyledText
                                variant="regular"
                                className="text-text-secondary text-xs"
                            >
                                Auto-generate
                            </StyledText>
                        </Pressable>
                    </View>
                    <Controller
                        control={control}
                        name="sku"
                        render={({ field: { value, onChange } }) => (
                            <TextInput
                                placeholder="e.g., PC-001"
                                value={value}
                                onChangeText={onChange}
                                className="bg-white rounded-xl px-4 py-3 font-stack-sans text-base text-text-primary shadow-sm"
                                placeholderTextColor="#9ca3af"
                                editable={!autoGenerateSku}
                                style={{
                                    opacity: autoGenerateSku ? 0.6 : 1,
                                }}
                            />
                        )}
                    />
                    {autoGenerateSku && (
                        <StyledText
                            variant="regular"
                            className="text-text-muted text-xs mt-1"
                        >
                            SKU will be auto-generated based on product name
                        </StyledText>
                    )}
                </View>

                {/* Cost Price Section */}
                <View className="bg-blue-50 rounded-xl p-4 mb-4">
                    <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center">
                            <FontAwesome
                                name="calculator"
                                size={16}
                                color="#3b82f6"
                                style={{ marginRight: 8 }}
                            />
                            <StyledText
                                variant="semibold"
                                className="text-blue-700 text-sm"
                            >
                                Cost Price (for Profit Tracking)
                            </StyledText>
                        </View>
                        <Pressable
                            onPress={() =>
                                setUseBundlePricing(!useBundlePricing)
                            }
                            className="flex-row items-center active:opacity-50"
                        >
                            <View
                                className={`w-5 h-5 rounded border-2 mr-2 items-center justify-center ${
                                    useBundlePricing
                                        ? 'bg-accent border-accent'
                                        : 'border-gray-300'
                                }`}
                            >
                                {useBundlePricing && (
                                    <FontAwesome
                                        name="check"
                                        size={12}
                                        color="#fff"
                                    />
                                )}
                            </View>
                            <StyledText
                                variant="regular"
                                className="text-blue-700 text-xs"
                            >
                                Bundle
                            </StyledText>
                        </Pressable>
                    </View>

                    {useBundlePricing ? (
                        <>
                            {/* Bundle Cost */}
                            <View className="mb-3">
                                <StyledText
                                    variant="medium"
                                    className="text-blue-700 text-xs mb-2"
                                >
                                    Total Bundle Cost (₱)
                                </StyledText>
                                <View className="bg-white rounded-xl px-4 py-3 flex-row items-center shadow-sm">
                                    <StyledText
                                        variant="medium"
                                        className="text-text-secondary text-base mr-2"
                                    >
                                        ₱
                                    </StyledText>
                                    <Controller
                                        control={control}
                                        name="bundleCost"
                                        render={({
                                            field: { value, onChange },
                                        }) => (
                                            <TextInput
                                                placeholder="0.00"
                                                value={value}
                                                onChangeText={onChange}
                                                keyboardType="decimal-pad"
                                                className="flex-1 font-stack-sans text-base text-text-primary"
                                                placeholderTextColor="#9ca3af"
                                            />
                                        )}
                                    />
                                </View>
                            </View>

                            {/* Pieces per Bundle */}
                            <View className="mb-3">
                                <StyledText
                                    variant="medium"
                                    className="text-blue-700 text-xs mb-2"
                                >
                                    Pieces per Bundle
                                </StyledText>
                                <Controller
                                    control={control}
                                    name="piecesPerBundle"
                                    render={({
                                        field: { value, onChange },
                                    }) => (
                                        <TextInput
                                            placeholder="10"
                                            value={value}
                                            onChangeText={onChange}
                                            keyboardType="number-pad"
                                            className="bg-white rounded-xl px-4 py-3 font-stack-sans text-base text-text-primary shadow-sm"
                                            placeholderTextColor="#9ca3af"
                                        />
                                    )}
                                />
                            </View>

                            {/* Auto-calculated Cost per Piece */}
                            <View>
                                <StyledText
                                    variant="medium"
                                    className="text-blue-700 text-xs mb-2"
                                >
                                    Cost per Piece (Auto-calculated)
                                </StyledText>
                                <View className="bg-white/60 rounded-xl px-4 py-3 flex-row items-center shadow-sm">
                                    <StyledText
                                        variant="medium"
                                        className="text-text-secondary text-base mr-2"
                                    >
                                        ₱
                                    </StyledText>
                                    <Controller
                                        control={control}
                                        name="costPerPiece"
                                        render={({ field: { value } }) => (
                                            <TextInput
                                                placeholder="0.00"
                                                value={value}
                                                editable={false}
                                                className="flex-1 font-stack-sans text-base text-text-primary"
                                                placeholderTextColor="#9ca3af"
                                            />
                                        )}
                                    />
                                </View>
                            </View>
                        </>
                    ) : (
                        <>
                            {/* Direct Cost per Piece */}
                            <View>
                                <StyledText
                                    variant="medium"
                                    className="text-blue-700 text-xs mb-2"
                                >
                                    Cost per Piece (₱)
                                </StyledText>
                                <View className="bg-white rounded-xl px-4 py-3 flex-row items-center shadow-sm">
                                    <StyledText
                                        variant="medium"
                                        className="text-text-secondary text-base mr-2"
                                    >
                                        ₱
                                    </StyledText>
                                    <Controller
                                        control={control}
                                        name="costPerPiece"
                                        render={({
                                            field: { value, onChange },
                                        }) => (
                                            <TextInput
                                                placeholder="5.00"
                                                value={value}
                                                onChangeText={onChange}
                                                keyboardType="decimal-pad"
                                                className="flex-1 font-stack-sans text-base text-text-primary"
                                                placeholderTextColor="#9ca3af"
                                            />
                                        )}
                                    />
                                </View>
                            </View>
                        </>
                    )}

                    <StyledText
                        variant="regular"
                        className="text-blue-600 text-xs mt-3 leading-4"
                    >
                        Please enter the price you paid you&apos;ve buy
                        originally. This helps track your actual profit.
                    </StyledText>
                </View>

                {/* Price */}
                <View className="mb-4">
                    <StyledText
                        variant="semibold"
                        className="text-text-primary text-sm mb-2"
                    >
                        Selling Price (₱) *
                    </StyledText>
                    <View className="bg-white rounded-xl px-4 py-3 flex-row items-center shadow-sm">
                        <StyledText
                            variant="medium"
                            className="text-text-secondary text-base mr-2"
                        >
                            ₱
                        </StyledText>
                        <Controller
                            control={control}
                            name="price"
                            render={({ field: { value, onChange } }) => (
                                <TextInput
                                    placeholder="0.00"
                                    value={value}
                                    onChangeText={onChange}
                                    keyboardType="decimal-pad"
                                    className="flex-1 font-stack-sans text-base text-text-primary"
                                    placeholderTextColor="#9ca3af"
                                />
                            )}
                        />
                    </View>

                    {/* Profit Preview */}
                    {formValues.costPerPiece &&
                        formValues.price &&
                        parseFloat(formValues.costPerPiece) > 0 &&
                        parseFloat(formValues.price) > 0 && (
                            <View className="bg-green-50 rounded-lg p-3 mt-2 flex-row items-center justify-between">
                                <View>
                                    <StyledText
                                        variant="regular"
                                        className="text-green-700 text-xs mb-1"
                                    >
                                        Profit per pcs:
                                    </StyledText>
                                    <StyledText
                                        variant="extrabold"
                                        className="text-green-700 text-lg"
                                    >
                                        ₱
                                        {(
                                            parseFloat(formValues.price) -
                                            parseFloat(formValues.costPerPiece)
                                        ).toFixed(2)}
                                    </StyledText>
                                </View>
                                {/* <View>
                                    <StyledText variant="regular" className="text-green-700 text-xs mb-1">
                                        Overall Profit:
                                    </StyledText>
                                    <StyledText variant="extrabold" className="text-green-700 text-lg">
                                        ₱{(parseFloat(formValues.price) - parseFloat(formValues.costPerPiece)).toFixed(2)}
                                    </StyledText>
                                </View> */}
                                <View className="items-end">
                                    <StyledText
                                        variant="regular"
                                        className="text-green-700 text-xs mb-1"
                                    >
                                        Markup
                                    </StyledText>
                                    <StyledText
                                        variant="extrabold"
                                        className="text-green-700 text-lg"
                                    >
                                        {(
                                            ((parseFloat(formValues.price) -
                                                parseFloat(
                                                    formValues.costPerPiece
                                                )) /
                                                parseFloat(
                                                    formValues.costPerPiece
                                                )) *
                                            100
                                        ).toFixed(1)}
                                        %
                                    </StyledText>
                                </View>
                            </View>
                        )}
                </View>

                {/* Initial Stock */}
                <View className="mb-4">
                    <StyledText
                        variant="semibold"
                        className="text-text-primary text-sm mb-2"
                    >
                        Initial Stock Quantity
                    </StyledText>
                    <Controller
                        control={control}
                        name="initialStock"
                        render={({ field: { value, onChange } }) => (
                            <TextInput
                                placeholder="0"
                                value={value}
                                onChangeText={onChange}
                                keyboardType="number-pad"
                                className="bg-white rounded-xl px-4 py-3 font-stack-sans text-base text-text-primary shadow-sm"
                                placeholderTextColor="#9ca3af"
                            />
                        )}
                    />
                    <StyledText
                        variant="regular"
                        className="text-text-muted text-xs mt-1"
                    >
                        You can leave this as 0 and add stock later via
                        Inventory
                    </StyledText>
                </View>

                {/* Category (Optional - UI only for now) */}
                <View className="mb-4">
                    <StyledText
                        variant="semibold"
                        className="text-text-primary text-sm mb-2"
                    >
                        Category (Optional)
                    </StyledText>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                    >
                        <View className="flex-row gap-2">
                            {CATEGORIES.map((category) => (
                                <Controller
                                    key={category}
                                    control={control}
                                    name="category"
                                    render={({
                                        field: { value, onChange },
                                    }) => (
                                        <Pressable
                                            onPress={() =>
                                                onChange(
                                                    value === category
                                                        ? ''
                                                        : category
                                                )
                                            }
                                            className={`px-4 py-2 rounded-xl ${
                                                value === category
                                                    ? 'bg-accent'
                                                    : 'bg-white border border-gray-200'
                                            } active:opacity-70`}
                                        >
                                            <StyledText
                                                variant="medium"
                                                className={`text-sm ${
                                                    value === category
                                                        ? 'text-white'
                                                        : 'text-text-secondary'
                                                }`}
                                            >
                                                {category}
                                            </StyledText>
                                        </Pressable>
                                    )}
                                />
                            ))}
                        </View>
                    </ScrollView>
                </View>

                {/* Submit Button */}
                <Pressable
                    onPress={handleSubmit(onSubmit)}
                    disabled={insertProductMutation.isPending}
                    className={`bg-accent rounded-xl py-4 items-center shadow-md active:opacity-70 ${
                        insertProductMutation.isPending ? 'opacity-50' : ''
                    }`}
                >
                    {insertProductMutation.isPending ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <StyledText
                            variant="extrabold"
                            className="text-white text-base"
                        >
                            Add Product
                        </StyledText>
                    )}
                </Pressable>

                {/* Cancel Button */}
                <TouchableOpacity
                    onPress={handleBackPress}
                    className="bg-gray-200 rounded-xl py-4 items-center mt-3 active:opacity-70"
                >
                    <StyledText
                        variant="semibold"
                        className="text-text-primary text-base"
                    >
                        Cancel
                    </StyledText>
                </TouchableOpacity>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
}
