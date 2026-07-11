import { StyledText } from '@/components/elements';
import { MotiView } from 'moti';
import { memo, useRef, type ReactNode } from 'react';
import { View } from 'react-native';

/**
 * BentoGrid — A non-uniform, asymmetric grid for high-impact KPI
 * tiles. Used on the General Reports screen to break the monotony
 * of a uniform 2x2 — the lead metric ("Total Sales") spans the
 * entire first row like a magazine cover headline.
 *
 * The grid is implemented with NativeWind flex primitives so it
 * inherits the existing `gap-3` rhythm from the rest of the app,
 * but the slot ordering and spans are bespoke.
 */
type BentoGridProps = {
	children: ReactNode[];
};

export function BentoGrid({ children }: BentoGridProps) {
	return <View className="gap-3">{children}</View>;
}

/**
 * BentoHero — the oversized first-row tile. The lead KPI; receives
 * the largest type and an editorial treatment. Designed to feel
 * like a magazine cover with a kicker, headline and dek.
 */
type BentoHeroProps = {
	kicker: string;
	headline: string;
	subline?: string;
	footer?: ReactNode;
	icon?: ReactNode;
	accent?: 'persimmon' | 'sage' | 'cinnamon' | 'ink';
	/** Changing this value triggers the entrance animation (e.g. pass the date-range key). */
	animationKey?: string;
};

const HERO_ACCENT_BG: Record<NonNullable<BentoHeroProps['accent']>, string> = {
	persimmon: 'bg-persimmon-500',
	sage: 'bg-sage-500',
	cinnamon: 'bg-cinnamon-500',
	ink: 'bg-ink-900',
};

export const BentoHero = memo(function BentoHero({
	kicker,
	headline,
	subline,
	footer,
	icon,
	accent = 'persimmon',
	animationKey,
}: BentoHeroProps) {
	return (
		<MotiView
			key={animationKey}
			from={{ opacity: 0, translateY: 12 }}
			animate={{ opacity: 1, translateY: 0 }}
			transition={{ type: 'timing', duration: 380 }}
			className={`rounded-card overflow-hidden ${HERO_ACCENT_BG[accent]} shadow-paper-lift`}
		>
			<View className="px-5 pt-4 pb-2 flex-row items-center justify-between">
				<View className="flex-row items-center">
					{icon && <View className="mr-2 opacity-90">{icon}</View>}
					<StyledText
						variant="extrabold"
						className="text-label text-paper-100 opacity-80"
						style={{ letterSpacing: 2 }}
					>
						{kicker}
					</StyledText>
				</View>
				<View className="opacity-80">
					<StyledText
						variant="extrabold"
						className="text-label text-paper-100"
						style={{ letterSpacing: 1.5 }}
					>
						No. 01
					</StyledText>
				</View>
			</View>

			<View className="px-5 pb-4">
				<StyledText
					variant="black"
					className="text-paper-50"
					style={{
						fontSize: 48,
						lineHeight: 50,
						letterSpacing: -1.4,
					}}
					numberOfLines={1}
					adjustsFontSizeToFit
				>
					{headline}
				</StyledText>
				{subline && (
					<StyledText
						variant="medium"
						className="text-paper-200 mt-1 opacity-90 text-sm"
					>
						{subline}
					</StyledText>
				)}
			</View>

			{footer && (
				<View className="bg-paper-50 px-5 py-3 border-t-2 border-dashed border-paper-100/40">
					{footer}
				</View>
			)}
		</MotiView>
	);
});

/**
 * BentoKPICard — secondary KPI tile. Used by the three non-hero
 * metrics in the Bento grid. Each variant gets a topical accent
 * strip on the left so they're distinguishable in a glance.
 */
type BentoKPICardProps = {
	kicker: string;
	headline: string;
	subline?: string;
	trend?: { value: string; positive: boolean };
	icon: ReactNode;
	accent: 'sage' | 'persimmon' | 'cinnamon' | 'ink';
	footer?: ReactNode;
};

const CARD_ACCENT_BAR: Record<BentoKPICardProps['accent'], string> = {
	sage: 'bg-sage-500',
	persimmon: 'bg-persimmon-500',
	cinnamon: 'bg-cinnamon-500',
	ink: 'bg-ink-900',
};

const CARD_ICON_BG: Record<BentoKPICardProps['accent'], string> = {
	sage: 'bg-sage-100',
	persimmon: 'bg-persimmon-100',
	cinnamon: 'bg-cinnamon-100',
	ink: 'bg-ink-100',
};

export const BentoKPICard = memo(function BentoKPICard({
	kicker,
	headline,
	subline,
	trend,
	icon,
	accent,
	footer,
}: BentoKPICardProps) {
	return (
		<View className="flex-1 rounded-card bg-paper-50 shadow-paper overflow-hidden flex-row">
			{/* Left accent rule — like the binding edge of a passport */}
			<View className={`w-1.5 ${CARD_ACCENT_BAR[accent]}`} />

			<View className="flex-1 p-4">
				<View className="flex-row items-start justify-between mb-2">
					<View
						className={`w-9 h-9 rounded-md items-center justify-center ${CARD_ICON_BG[accent]}`}
					>
						{icon}
					</View>
					{trend && (
						<View className="flex-row items-center">
							<StyledText
								variant="extrabold"
								className={`text-[10px] ${
									trend.positive ? 'text-sage-600' : 'text-semantic-danger'
								}`}
								style={{ letterSpacing: 1.2 }}
							>
								{trend.positive ? '▲' : '▼'} {trend.value}
							</StyledText>
						</View>
					)}
				</View>

				<StyledText
					variant="extrabold"
					className="text-label text-ink-400 mb-1"
					style={{ letterSpacing: 1.4 }}
				>
					{kicker}
				</StyledText>

				<StyledText
					variant="black"
					className="text-ink-900"
					style={{
						fontSize: 24,
						lineHeight: 28,
						letterSpacing: -0.6,
					}}
					numberOfLines={1}
					adjustsFontSizeToFit
				>
					{headline}
				</StyledText>

				{subline && (
					<StyledText
						variant="medium"
						className="text-ink-500 text-xs mt-0.5"
						numberOfLines={1}
					>
						{subline}
					</StyledText>
				)}

				{footer && (
					<View className="mt-3 pt-2 border-t border-dashed border-ink-200">
						{footer}
					</View>
				)}
			</View>
		</View>
	);
});