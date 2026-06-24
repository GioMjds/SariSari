import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui';
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

export function ProfitabilityRanking({ products }: ProfitabilityRankingProps) {
	if (products.length === 0) {
		return (
			<View className="py-4 items-center">
				<StyledText
					variant="extrabold"
					className="text-label text-ink-300 mb-1"
					style={{ letterSpacing: 1.6 }}
				>
					NO PROFIT DATA YET
				</StyledText>
				<StyledText variant="medium" className="text-ink-400 text-xs">
					Add cost prices to products to see the most profitable items.
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
				<StyledText
					variant="extrabold"
					className="text-label text-ink-400"
					style={{ letterSpacing: 1.4 }}
				>
					TUBO PER PIECE · ₱
				</StyledText>
				<StyledText
					variant="medium"
					className="text-mono text-ink-500 text-[10px]"
				>
					TOTAL ₱{products.reduce((s, p) => s + p.totalProfit, 0).toFixed(0)}
				</StyledText>
			</View>

			{products.map((product, index) => {
				const widthPct = ((product.profitPerUnit ?? 0) / maxPerUnit) * 100;
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
										className="text-ink-500 text-[11px] mt-0.5"
									>
										{product.unitsSold} units · {product.marginPercent.toFixed(1)}% margin
									</StyledText>
								</View>
							</View>
							<View className="items-end">
								<MoneyText
									value={product.totalProfit}
									fromPesos
									size="md"
									variant="success"
									className="text-sm"
								/>
								<StyledText
									variant="medium"
									className="text-sage-600 text-[10px] mt-0.5"
								>
									+₱{(product.profitPerUnit ?? 0).toFixed(0)}/pc
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
}