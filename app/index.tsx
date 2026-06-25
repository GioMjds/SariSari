import { StyledText } from '@/components/elements';
import { loadOnboardingState } from '@/lib';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Image, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { SARI_READY_ASSET } from '@/constants/onboardingTour.assets';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export default function EntryGate() {
	const router = useRouter();
	const reducedMotion = useReducedMotion();

	useEffect(() => {
		let isMounted = true;
		console.log(JSON.stringify({ event: 'entry_gate_check_start' }));

		const run = async () => {
			const startTime = Date.now();
			try {
				const state = await loadOnboardingState();
				
				// Ensure at least 1000ms delay for welcoming animation to play out
				const elapsed = Date.now() - startTime;
				const remainingDelay = Math.max(0, 1000 - elapsed);
				if (remainingDelay > 0) {
					await new Promise((resolve) => setTimeout(resolve, remainingDelay));
				}

				if (!isMounted) return;

				let targetRoute: '/onboarding' | '/(tabs)' = '/onboarding';
				let reason = 'onboarding_incomplete';

				if (process.env.EXPO_PUBLIC_FORCE_ONBOARDING === 'true') {
					targetRoute = '/onboarding';
					reason = 'force_onboarding';
				} else if (state?.completed) {
					targetRoute = '/(tabs)';
					reason = 'onboarding_completed';
				}

				console.log(
					JSON.stringify({
						event: 'entry_gate_redirect',
						target: targetRoute,
						reason,
					})
				);

				router.replace(targetRoute);
			} catch (error) {
				const elapsed = Date.now() - startTime;
				const remainingDelay = Math.max(0, 1000 - elapsed);
				if (remainingDelay > 0) {
					await new Promise((resolve) => setTimeout(resolve, remainingDelay));
				}

				if (!isMounted) return;
				console.error(
					JSON.stringify({
						event: 'entry_gate_error',
						error: error instanceof Error ? error.message : 'Unknown error',
					})
				);
				// Fallback safely to onboarding on error
				router.replace('/onboarding');
			}
		};

		run();

		return () => {
			isMounted = false;
		};
	}, [router]);

	return (
		<SafeAreaView className="flex-1 bg-paper-200 justify-between items-center py-12 px-6">
			{/* Top Branding Header */}
			<MotiView
				from={{ opacity: 0, translateY: reducedMotion ? 0 : -20 }}
				animate={{ opacity: 1, translateY: 0 }}
				transition={{ type: 'timing', duration: 600, delay: 100 }}
				className="items-center mt-6"
			>
				<StyledText
					variant="black"
					className="text-persimmon-500 text-display tracking-tight text-center"
				>
					SariSari
				</StyledText>
				<StyledText
					variant="semibold"
					className="text-cinnamon-400 text-label uppercase tracking-widest mt-1 text-center"
				>
					Tindahan Manager
				</StyledText>
			</MotiView>

			{/* Center Illustration with Floating Effect */}
			<View className="items-center justify-center my-6">
				<MotiView
					from={{ opacity: 0, scale: reducedMotion ? 1 : 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{
						type: 'timing',
						duration: 800,
						delay: 200,
					}}
					style={{ width: 220, height: 220 }}
				>
					<MotiView
						from={{ translateY: reducedMotion ? 0 : -4 }}
						animate={{ translateY: reducedMotion ? 0 : 4 }}
						transition={{
							type: 'timing',
							duration: 1800,
							loop: !reducedMotion,
						}}
						style={{ width: '100%', height: '100%' }}
					>
						<Image
							source={SARI_READY_ASSET}
							resizeMode="contain"
							accessibilityIgnoresInvertColors
							className="w-full h-full"
						/>
					</MotiView>
				</MotiView>
			</View>

			{/* Welcome & Progress Indicator */}
			<View className="items-center w-full px-8 mb-8">
				<MotiView
					from={{ opacity: 0, translateY: reducedMotion ? 0 : 15 }}
					animate={{ opacity: 1, translateY: 0 }}
					transition={{ type: 'timing', duration: 600, delay: 400 }}
					className="items-center mb-6"
				>
					<StyledText
						variant="extrabold"
						className="text-ink-900 text-h2 text-center"
					>
						Maligayang pagdating!
					</StyledText>
					<StyledText
						variant="regular"
						className="text-ink-600 text-body text-center mt-1"
					>
						Inihahanda ang iyong tindahan...
					</StyledText>
				</MotiView>

				{/* Loading Progress Bar */}
				<MotiView
					from={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ type: 'timing', duration: 600, delay: 500 }}
					className="w-48 h-1.5 bg-paper-300 rounded-full overflow-hidden shadow-card"
				>
					<MotiView
						from={{ width: '0%' }}
						animate={{ width: '100%' }}
						transition={{
							type: 'timing',
							duration: 1000,
						}}
						className="h-full bg-persimmon-500 rounded-full"
					/>
				</MotiView>
			</View>

			{/* App Values Footer */}
			<MotiView
				from={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ type: 'timing', duration: 800, delay: 800 }}
				className="items-center"
			>
				<StyledText
					variant="medium"
					className="text-cinnamon-400/60 text-caption tracking-wider text-center"
				>
					Mabilis • Offline • Para sa Tindahan
				</StyledText>
			</MotiView>
		</SafeAreaView>
	);
}
