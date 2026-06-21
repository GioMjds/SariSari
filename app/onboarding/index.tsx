import { StyledText } from '@/components/elements';
import { markOnboardingComplete } from '@/lib';
import { GUIDE_TIPS } from '@/constants';
import { useToastStore } from '@/stores';
import { OnboardingProfile } from '@/types';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Step = 'welcome' | 'info' | 'tips';

export default function OnboardingPage() {
    const [step, setStep] = useState<Step>('welcome');
    const [profile, setProfile] = useState<OnboardingProfile>({
        ownerName: '',
        storeName: '',
    });
    const [saving, setSaving] = useState<boolean>(false);

    const router = useRouter();
    const addToast = useToastStore((state) => state.addToast);

    const progress = useMemo(() => {
        if (step === 'welcome') return 0.33;
        if (step === 'info') return 0.66;
        return 1;
    }, [step]);

    const goNext = () => {
        if (step === 'welcome') setStep('info');
        else if (step === 'info') setStep('tips');
    };

    const goBack = () => {
        if (step === 'tips') setStep('info');
        else if (step === 'info') setStep('welcome');
    };

    const handleSave = async () => {
        if (!profile.ownerName.trim() || !profile.storeName.trim()) {
            addToast({
                message: 'Please add your name and store name',
                variant: 'error',
                duration: 1800,
                position: 'top-center',
            });
            return;
        }

        try {
            setSaving(true);
            await markOnboardingComplete({
                ownerName: profile.ownerName.trim(),
                storeName: profile.storeName.trim(),
            });
            addToast({
                message: 'Welcome! Your store is ready.',
                variant: 'success',
                duration: 1800,
                position: 'top-center',
            });
            router.replace('/(tabs)');
        } catch (_error) {
            addToast({
                message: 'Could not save onboarding data',
                variant: 'error',
                duration: 2000,
                position: 'top-center',
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <View className="flex-1 px-6 pt-10 pb-8">
                <View className="flex-row justify-between items-center mb-6">
                    <StyledText variant="extrabold" className="text-3xl text-primary">
                        Sari-Sari Setup
                    </StyledText>
                    <View className="flex-row items-center gap-2">
                        <View className="w-32 h-2 bg-white/70 rounded-full overflow-hidden">
                            <View
                                className="h-2 bg-secondary"
                                style={{ width: `${progress * 100}%` }}
                            />
                        </View>
                        <StyledText variant="medium" className="text-text-secondary text-sm">
                            {step === 'welcome' ? '1/3' : step === 'info' ? '2/3' : '3/3'}
                        </StyledText>
                    </View>
                </View>

                {step === 'welcome' && (
                    <View className="flex-1 justify-center">
                        <View className="bg-white rounded-3xl p-6 shadow-sm border border-white/60">
                            <StyledText variant="extrabold" className="text-2xl text-primary mb-3">
                                Welcome!
                            </StyledText>
                            <StyledText variant="medium" className="text-base text-text-secondary mb-4">
                                Let us set up your sari-sari store so you can track stocks and sales even without internet.
                            </StyledText>
                            <View className="bg-background rounded-2xl p-4">
                                <View className="flex-row items-center mb-3">
                                    <FontAwesome name="cloud-download" size={18} color="#7A1CAC" />
                                    <StyledText variant="medium" className="ml-3 text-text-primary">
                                        Offline-first, stored locally
                                    </StyledText>
                                </View>
                                <View className="flex-row items-center">
                                    <FontAwesome name="lock" size={18} color="#7A1CAC" />
                                    <StyledText variant="medium" className="ml-3 text-text-primary">
                                        Your data stays on your device
                                    </StyledText>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {step === 'info' && (
                    <View className="flex-1">
                        <StyledText variant="extrabold" className="text-2xl text-primary mb-2">
                            Tell us about you
                        </StyledText>
                        <StyledText variant="regular" className="text-text-secondary mb-6">
                            We will personalize summaries using your name and store.
                        </StyledText>

                        <View className="space-y-4">
                            <View>
                                <StyledText variant="medium" className="text-text-primary mb-2">
                                    Your name
                                </StyledText>
                                <TextInput
                                    value={profile.ownerName}
                                    onChangeText={(text) => setProfile((p) => ({ ...p, ownerName: text }))}
                                    placeholder="e.g. Aling Nena"
                                    className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-text-primary"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                            <View>
                                <StyledText variant="medium" className="text-text-primary mb-2">
                                    Store name
                                </StyledText>
                                <TextInput
                                    value={profile.storeName}
                                    onChangeText={(text) => setProfile((p) => ({ ...p, storeName: text }))}
                                    placeholder="e.g. Nena Sari-Sari"
                                    className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-text-primary"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                        </View>
                    </View>
                )}

                {step === 'tips' && (
                    <View className="flex-1">
                        <StyledText variant="extrabold" className="text-2xl text-primary mb-2">
                            Quick guide
                        </StyledText>
                        <StyledText variant="regular" className="text-text-secondary mb-4">
                            Here is how to get the most out of your app.
                        </StyledText>
                        <View className="space-y-3">
                            {GUIDE_TIPS.map((tip) => (
                                <View key={tip.title} className="bg-white border border-gray-200 rounded-2xl p-4 flex-row items-start gap-3">
                                    <View className="w-10 h-10 rounded-full bg-background items-center justify-center">
                                        <FontAwesome name={tip.icon as any} size={18} color="#7A1CAC" />
                                    </View>
                                    <View className="flex-1">
                                        <StyledText variant="semibold" className="text-text-primary text-base mb-1">
                                            {tip.title}
                                        </StyledText>
                                        <StyledText variant="regular" className="text-text-secondary text-sm leading-5">
                                            {tip.description}
                                        </StyledText>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                <View className="mt-8 flex-row gap-3">
                    {step !== 'welcome' ? (
                        <TouchableOpacity
                            onPress={goBack}
                            className="flex-1 border border-gray-300 rounded-2xl py-3 items-center"
                        >
                            <StyledText variant="medium" className="text-text-primary">
                                Back
                            </StyledText>
                        </TouchableOpacity>
                    ) : (
                        <View className="flex-1" />
                    )}

                    {step !== 'tips' ? (
                        <TouchableOpacity
                            onPress={goNext}
                            className="flex-1 bg-primary rounded-2xl py-3 items-center"
                        >
                            <StyledText variant="semibold" className="text-white">
                                Next
                            </StyledText>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={saving}
                            className="flex-1 bg-secondary rounded-2xl py-3 items-center"
                        >
                            {saving ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <StyledText variant="semibold" className="text-white">
                                    Save & Start
                                </StyledText>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}