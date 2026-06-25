import { StyledText } from '@/components/elements';
import { useAppInfo } from '@/hooks/useAppInfo';
import { useProfile } from '@/hooks/useProfile';
import { FontAwesome } from '@expo/vector-icons';
import { useCallback } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * SettingsScreen — what the app actually does today, not what it might do later.
 *
 * Three sections, each reflecting a real, currently-wired capability:
 *   1. Store      — store name + owner name, read-only labels from onboarding.
 *   2. App        — version + the local-only SQLite guarantee.
 *   3. About      — link to the public privacy policy.
 *
 * There is intentionally no Theme toggle, Language picker, Backup, Import,
 * or Export. Those are real features that need design before they ship; a
 * placeholder comment that lists them would make the app claim capabilities
 * it doesn't have.
 *
 * This component is rendered by both `/settings` (the regular route) and
 * `/(edit-forms)/settings` (the modal route), so the visual layer lives
 * here and the route folders decide presentation (modal vs full screen).
 */
export const SettingsScreen = () => {
	const { profile, loading: profileLoading } = useProfile();
	const { version, privacyPolicyUrl } = useAppInfo();

	const openPrivacyPolicy = useCallback(async () => {
		if (!privacyPolicyUrl) return;
		try {
			await Linking.openURL(privacyPolicyUrl);
		} catch (err) {
			console.warn('Could not open privacy policy URL', err);
		}
	}, [privacyPolicyUrl]);

	return (
		<SafeAreaView className="flex-1 bg-paper-200">
			{/* Header */}
			<View className="bg-cinnamon-500 px-5 pt-3 pb-6">
				<View className="flex-row items-center mb-3">
					<View className="w-8 h-8 rounded-full bg-persimmon-500 items-center justify-center mr-2">
						<StyledText variant="black" className="text-paper-50 text-xl font-extrabold">
							₱
						</StyledText>
					</View>
					<StyledText
						variant="extrabold"
						className="text-label text-paper-200 opacity-80"
						style={{ letterSpacing: 1.4 }}
					>
						SETTINGS
					</StyledText>
				</View>
				<View className="flex-row items-start justify-between">
					<View className="flex-1 mr-3">
						<StyledText
							variant="extrabold"
							className="text-h1 text-paper-50 text-3xl"
							style={{ letterSpacing: -0.28 }}
						>
							Settings
						</StyledText>
						<StyledText
							variant="regular"
							className="text-sm text-paper-200 opacity-90 mt-1"
						>
							Store, app, and about
						</StyledText>
					</View>
				</View>
			</View>

			<ScrollView contentContainerStyle={{ paddingBottom: 64 }}>
				{/* Section 1 — Store */}
				<SettingsSection title="Store" subtitle="From your onboarding profile">
					<SettingsRow
						label="Store name"
						value={profileLoading ? 'Loading…' : (profile?.storeName ?? '—')}
						icon="home"
					/>
					<SettingsRow
						label="Owner name"
						value={profileLoading ? 'Loading…' : (profile?.ownerName ?? '—')}
						icon="user"
					/>
				</SettingsSection>

				{/* Section 2 — App */}
				<SettingsSection title="App" subtitle="Built and shipped today">
					<SettingsRow
						label="App version"
						value={version}
						icon="info-circle"
					/>
					<SettingsRow
						label="Database"
						value="Local SQLite, on this device"
						icon="database"
						subtitle="Offline by default. No automatic backup yet — keep your device backed up through your phone's normal channels."
					/>
				</SettingsSection>

				{/* Section 3 — About */}
				<SettingsSection title="About" subtitle="Project & policies">
					<SettingsRow
						label="Privacy policy"
						value={privacyPolicyUrl ? 'Open' : 'Not configured'}
						icon="lock"
						interactive={!!privacyPolicyUrl}
						onPress={openPrivacyPolicy}
					/>
				</SettingsSection>

				<View className="px-6 pt-2 pb-6">
					<StyledText
						variant="regular"
						className="text-xs text-ink-400 text-center"
					>
						SariSari — a working prototype.
					</StyledText>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

type SettingsSectionProps = {
	title: string;
	subtitle?: string;
	children: React.ReactNode;
};

function SettingsSection({ title, subtitle, children }: SettingsSectionProps) {
	return (
		<View className="px-5 mt-6">
			<StyledText
				variant="extrabold"
				className="text-xs uppercase text-ink-400 mb-1"
				style={{ letterSpacing: 1.2 }}
			>
				{title}
			</StyledText>
			{subtitle ? (
				<StyledText variant="regular" className="text-xs text-ink-400 mb-2">
					{subtitle}
				</StyledText>
			) : null}
			<View className="bg-paper-50 rounded-2xl border border-warm-100 overflow-hidden">
				{children}
			</View>
		</View>
	);
}

type SettingsRowProps = {
	label: string;
	value: string;
	subtitle?: string;
	icon?: string;
	interactive?: boolean;
	onPress?: () => void;
};

function SettingsRow({
	label,
	value,
	subtitle,
	icon,
	interactive,
	onPress,
}: SettingsRowProps) {
	return (
		<Pressable
			onPress={onPress}
			disabled={!interactive}
			className="px-4 py-3 border-b border-warm-100 last:border-b-0 flex-row items-center active:opacity-80"
		>
			{icon ? (
				<View className="w-9 h-9 rounded-full bg-warm-100 items-center justify-center mr-3">
					<FontAwesome name={icon as any} size={15} color="#623418" />
				</View>
			) : null}
			<View className="flex-1">
				<StyledText variant="semibold" className="text-sm text-ink-700">
					{label}
				</StyledText>
				<StyledText variant="regular" className="text-sm text-ink-500 mt-0.5">
					{value}
				</StyledText>
				{subtitle ? (
					<StyledText
						variant="regular"
						className="text-xs text-ink-400 mt-1"
					>
						{subtitle}
					</StyledText>
				) : null}
			</View>
			{interactive ? (
				<FontAwesome name="chevron-right" size={14} color="#9C8E7E" />
			) : null}
		</Pressable>
	);
};