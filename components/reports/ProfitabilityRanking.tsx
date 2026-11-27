import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui';
import { formatCurrency } from '@/utils';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

/**
 * ProfitabilityRanking — A horizontal "profit ribbon" that ranks
 * products by tubo (per-piece profit). Each product gets a row
 * with a horizontal bar whose length encodes the profit per unit,
 * and a right-aligned total profit figure.
 *
 * The shape matches the `ProductProfitability` row from
 * `db/reports.ts` but is declared locally so this UI file doesn't
 * need to know about the data layer (and so the layering rule in
 * AGENTS.md — `db/` never imports from `components/` — holds in
 * both directions).
 */
type ProfitabilityRow = {
	id: number;
	name: string;
	unitsSold: number;
	totalProfit: number;
	profitPerUnit: number;
	marginPercent: number;
};

type ProfitabilityRankingProps = {
	products: ProfitabilityRow[];
};

export const ProfitabilityRanking = memo(function ProfitabilityRanking({ products }: ProfitabilityRankingProps) {
	const { t } = useTranslation();
	if (products.length === 0) {
		return (
			<View className="py-4 items-center">
				<StyledText variant="extrabold" className="text-sm text-ink-500 mb-1">
					{t('common:reports.top.noProfitTitle')}
				</StyledText>
				<StyledText variant="medium" className="text-ink-500 text-xs text-center">
					{t('common:reports.top.noProfitBody')}
				</StyledText>
			</View>
		);
	}

	const maxPerUnit = Math.max(
		...products.map((p) => p.profitPerUnit ?? 0),
		1,
	);

	return (
		<View>
			<View className="mb-3 flex-row items-center justify-between">
				<StyledText variant="medium" className="text-xs text-ink-500">
					{t('common:reports.top.tuboPerPiece')}
				</StyledText>
				<StyledText variant="semibold" className="text-xs text-ink-700">
					{t('common:reports.top.total', {
						amount: formatCurrency(products.reduce((s, p) => s + p.totalProfit, 0)),
					})}
				</StyledText>
			</View>

			{products.map((product, index) => {
				const rawWidthPct = ((product.profitPerUnit ?? 0) / maxPerUnit) * 100;
				const widthPct = Math.max(0, Math.min(rawWidthPct, 100));
				const isLead = index === 0;

				return (
					<View
						key={product.id}
						className={
							index > 0
								? 'mt-3 pt-3 border-t border-dashed border-ink-200'
								: ''
						}
					>
						<View className="flex-row items-baseline justify-between">
							<View className="flex-row items-baseline flex-1 mr-3">
								<StyledText
									variant="black"
									className={`mr-2 ${isLead ? 'text-sage-700' : 'text-ink-400'}`}
									style={{
										fontSize: 14,
										lineHeight: 16,
										letterSpacing: 0.4,
									}}
								>
									{String(index + 1).padStart(2, '0')}
								</StyledText>
								<View className="flex-1">
									<StyledText
										variant="semibold"
										className="text-ink-900 text-sm"
										numberOfLines={1}
									>
										{product.name}
									</StyledText>
									<StyledText
										variant="medium"
										className="text-ink-500 text-xs mt-0.5"
									>
										{t('common:reports.top.units', { count: product.unitsSold })} ·{' '}
										{t('common:reports.top.margin', { pct: product.marginPercent.toFixed(1) })}
									</StyledText>
								</View>
							</View>
							<View className="items-end">
								<MoneyText
									value={product.totalProfit}
									size="md"
									variant="success"
									className="text-sm"
								/>
								<StyledText
									variant="medium"
									className="text-sage-600 text-xs mt-0.5"
								>
									{t('common:reports.top.perPiece', {
										amount: formatCurrency(product.profitPerUnit ?? 0),
									})}
								</StyledText>
							</View>
						</View>

						<View className="mt-2 flex-row items-center gap-2">
							<View className="flex-1 h-1.5 bg-ink-100 rounded-full overflow-hidden">
								<View
									className="h-full rounded-full bg-sage-500"
									style={{ width: `${widthPct}%` }}
								/>
							</View>
						</View>
					</View>
				);
			})}
		</View>
	);
});