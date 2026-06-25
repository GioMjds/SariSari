import { StyledText } from '@/components/elements';
import { useToastStore } from '@/stores';
import { MotiView } from 'moti';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type DatabaseErrorScreenProps = {
	/** Human-readable error message. */
	message: string;
	/** Re-run the database init path. Should be safe to call repeatedly. */
	onRetry: () => void | Promise<void>;
};

export const DatabaseErrorScreen = ({
	message,
	onRetry,
}: DatabaseErrorScreenProps) => {
	const [retrying, setRetrying] = useState(false);
	const addToast = useToastStore((s) => s.addToast);

	const handleRetry = useCallback(async () => {
		setRetrying(true);
		try {
			await onRetry();
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Unknown error';
			addToast({
				variant: 'danger',
				message: `Still failing: ${msg}`,
				duration: 4000,
			});
		} finally {
			setRetrying(false);
		}
	}, [onRetry, addToast]);

	return (
		<SafeAreaView className="flex-1 bg-paper-200">
			<ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
				<MotiView
					from={{ opacity: 0, translateY: 16 }}
					animate={{ opacity: 1, translateY: 0 }}
					transition={{ type: 'timing', duration: 480 }}
					className="px-7"
				>
					<View className="items-center mb-6">
						<View className="w-20 h-20 rounded-full bg-semantic-danger/10 items-center justify-center">
							<StyledText
								variant="black"
								className="text-semantic-danger text-3xl"
							>
								!
							</StyledText>
						</View>
					</View>

					<StyledText
						variant="extrabold"
						className="text-2xl text-ink-700 text-center mb-2"
					>
						We couldn&apos;t start the database
					</StyledText>

					<StyledText
						variant="regular"
						className="text-sm text-ink-500 text-center mb-8 px-2"
					>
						SariSari keeps your data on this device. If the local database
						can&apos;t open, none of the screens will work — but no data has been
						uploaded anywhere. Try again.
					</StyledText>

					<View className="bg-paper-50 border border-warm-100 rounded-2xl p-4 mb-6">
						<StyledText
							variant="semibold"
							className="text-xs uppercase text-ink-400 mb-2"
							style={{ letterSpacing: 1.2 }}
						>
							Error details
						</StyledText>
						<StyledText
							variant="regular"
							className="text-sm text-ink-700"
							style={{ fontFamily: 'StackSansText-Medium' }}
						>
							{message || 'Unknown error'}
						</StyledText>
					</View>

					<Pressable
						onPress={handleRetry}
						disabled={retrying}
						className={`bg-cinnamon-500 rounded-xl py-4 items-center shadow-md active:opacity-80 ${
							retrying ? 'opacity-60' : ''
						}`}
					>
						{retrying ? (
							<ActivityIndicator color="#FBF7EE" />
						) : (
							<StyledText
								variant="extrabold"
								className="text-paper-50 text-base"
							>
								Try again
							</StyledText>
						)}
					</Pressable>
				</MotiView>
			</ScrollView>
		</SafeAreaView>
	);
};