import {
	DateRangeFilter,
	PaymentTypeFilter,
	SalesFilterState,
} from '@/constants/filters';
import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import StyledText from '../elements/StyledText';

/**
 * FilterChips — inline chip strip that lives directly above the receipt
 * list. One-tap access to common filters; the "More" chip opens the
 * full SalesFilterModal for the long-tail options.
 *
 * Active states are colour-coded by category so the eye can scan:
 *   date    → cinnamon
 *   cash    → sage
 *   utang   → persimmon
 *
 * NOTE: class names are assembled via the lookup tables `BASE_CHIP` /
 * `DATE_ACTIVE` / `PAY_ACTIVE` so NativeWind's static-analysis compiler
 * can pick them up reliably. Dynamic template-literal classNames are
 * known to silently drop classes that aren't seen at build time.
 */

interface FilterChipsProps {
	filters: SalesFilterState;
	onChange: (next: SalesFilterState) => void;
	onOpenMore: () => void;
}

interface DateChipDef {
	value: DateRangeFilter;
	label: string;
}

interface PaymentChipDef {
	value: PaymentTypeFilter;
	label: string;
	icon?: keyof typeof FontAwesome.glyphMap;
}

const DATE_CHIPS: DateChipDef[] = [
	{ value: 'all', label: 'All' },
	{ value: 'today', label: 'Today' },
	{ value: 'yesterday', label: 'Yesterday' },
	{ value: 'last7days', label: 'Last 7d' },
	{ value: 'last30days', label: 'Last 30d' },
	{ value: 'thisMonth', label: 'This Month' },
	{ value: 'lastMonth', label: 'Last Month' },
];

const PAYMENT_CHIPS: PaymentChipDef[] = [
	{ value: 'all', label: 'All Pay' },
	{ value: 'cash', label: 'Cash', icon: 'money' },
	{ value: 'credit', label: 'Utang', icon: 'credit-card' },
];

// Static class strings — keep all possible classes present somewhere in
// source so NativeWind's compiler emits them. The component then picks
// one of these strings at render time.
const CHIP_BASE = 'mr-2 px-4 py-2 rounded-pill border';
const CHIP_INACTIVE = 'bg-paper-50 border-ink-200';

const DATE_CHIP_ACTIVE = 'bg-cinnamon-500 border-cinnamon-500';
const DATE_CHIP_TEXT_ACTIVE = 'text-paper-50';
const DATE_CHIP_TEXT_INACTIVE = 'text-ink-700';

const PAY_CHIP_ACTIVE_BY_VALUE: Record<
	PaymentTypeFilter,
	string
> = {
	all: 'bg-cinnamon-500 border-cinnamon-500',
	cash: 'bg-sage-500 border-sage-500',
	credit: 'bg-persimmon-500 border-persimmon-500',
};

const PAY_CHIP_BASE = 'mr-2 flex-row items-center px-4 py-2 rounded-pill border';

const CHIP_SHADOW = {
	shadowColor: '#564E45',
	shadowOffset: { width: 0, height: 2 },
	shadowOpacity: 0.06,
	shadowRadius: 6,
	elevation: 2,
};

export default function FilterChips({
	filters,
	onChange,
	onOpenMore,
}: FilterChipsProps) {
	const hasActive =
		filters.paymentType !== 'all' || filters.dateRange !== 'all';

	return (
		<View className="mb-3">
			{/* ─── When eyebrow ─── */}
			<View className="px-4 mb-1.5">
				<StyledText
					variant="extrabold"
					className="label-caps text-ink-400"
				>
					When
				</StyledText>
			</View>

			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={{ paddingHorizontal: 16 }}
				style={{ flexGrow: 0 }}
			>
				{DATE_CHIPS.map((chip) => {
					const isActive = filters.dateRange === chip.value;
					const wrapClass = isActive
						? `${CHIP_BASE} ${DATE_CHIP_ACTIVE}`
						: `${CHIP_BASE} ${CHIP_INACTIVE}`;
					const textClass = `text-sm ${
						isActive ? DATE_CHIP_TEXT_ACTIVE : DATE_CHIP_TEXT_INACTIVE
					}`;
					return (
						<TouchableOpacity
							key={chip.value}
							activeOpacity={0.85}
							onPress={() =>
								onChange({ ...filters, dateRange: chip.value })
							}
							className={wrapClass}
							style={isActive ? CHIP_SHADOW : undefined}
						>
							<StyledText
								variant={isActive ? 'extrabold' : 'medium'}
								className={textClass}
							>
								{chip.label}
							</StyledText>
						</TouchableOpacity>
					);
				})}
			</ScrollView>

			{/* ─── How paid eyebrow ─── */}
			<View className="px-4 mt-3 mb-1.5">
				<StyledText
					variant="extrabold"
					className="label-caps text-ink-400"
				>
					How paid
				</StyledText>
			</View>

			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={{
					paddingHorizontal: 16,
					alignItems: 'center',
				}}
				style={{ flexGrow: 0 }}
			>
				{PAYMENT_CHIPS.map((chip) => {
					const isActive = filters.paymentType === chip.value;
					const wrapClass = isActive
						? `${PAY_CHIP_BASE} ${PAY_CHIP_ACTIVE_BY_VALUE[chip.value]}`
						: `${PAY_CHIP_BASE} ${CHIP_INACTIVE}`;
					const textClass = `text-sm ${
						isActive ? DATE_CHIP_TEXT_ACTIVE : DATE_CHIP_TEXT_INACTIVE
					}`;
					return (
						<TouchableOpacity
							key={chip.value}
							activeOpacity={0.85}
							onPress={() =>
								onChange({ ...filters, paymentType: chip.value })
							}
							className={wrapClass}
							style={isActive ? CHIP_SHADOW : undefined}
						>
							{chip.icon ? (
								<FontAwesome
									name={chip.icon}
									size={12}
									color={isActive ? '#FBF7EE' : '#564E45'}
									style={{ marginRight: 6 }}
								/>
							) : null}
							<StyledText
								variant={isActive ? 'extrabold' : 'medium'}
								className={textClass}
							>
								{chip.label}
							</StyledText>
						</TouchableOpacity>
					);
				})}

				{/* More chip — opens the full modal for long-tail options */}
				<TouchableOpacity
					activeOpacity={0.85}
					onPress={onOpenMore}
					className={`${PAY_CHIP_BASE} ${CHIP_INACTIVE}`}
				>
					<FontAwesome
						name="ellipsis-h"
						size={14}
						color="#564E45"
						style={{ marginRight: 6 }}
					/>
					<StyledText
						variant="medium"
						className={`text-sm ${DATE_CHIP_TEXT_INACTIVE}`}
					>
						More
					</StyledText>
					{hasActive ? (
						<View className="ml-2 w-2 h-2 rounded-full bg-persimmon-500" />
					) : null}
				</TouchableOpacity>
			</ScrollView>
		</View>
	);
}