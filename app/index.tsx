import { StyledText } from '@/components/elements';
import { loadOnboardingState } from '@/lib';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EntryGate() {
	const router = useRouter();
	const [checking, setChecking] = useState<boolean>(true);

	useEffect(() => {
		const run = async () => {
			const state = await loadOnboardingState();
			if (state?.completed) {
				router.replace('/(tabs)');
			} else {
				router.replace('/onboarding/index' as any);
			}
			setChecking(false);
		};
		run();
	}, [router]);

	return (
		<SafeAreaView className="flex-1 bg-background items-center justify-center">
			<View className="items-center">
				<ActivityIndicator size="large" color="#7A1CAC" />
				<StyledText variant="medium" className="text-text-secondary mt-3">
					Loading your store...
				</StyledText>
			</View>
		</SafeAreaView>
	);
}
