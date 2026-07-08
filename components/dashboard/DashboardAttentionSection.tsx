import { memo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Href, Link } from 'expo-router';
import { MoneyText } from '@/components/ui';
import { StyledText } from '@/components/elements';
import { Customer, Product, SaleWithItems } from '@/types';
import { parseStoredTimestamp } from '@/utils';
import { formatDistanceToNow } from 'date-fns';
import { LOW_STOCK_THRESHOLD } from '@/constants/stocks';
import { useTranslation } from 'react-i18next';

interface DashboardAttentionSectionProps {
  stockAttention: AttentionProduct[];
  sukis: AttentionCustomer[];
  recentSales: AttentionSale[];
  onViewAllStock: () => void;
  onViewAllUtang: () => void;
  onViewAllSales: () => void;
}

interface AttentionProduct {
  product: Product;
  isOut: boolean;
}

interface AttentionCustomer {
  customer: Customer;
}

interface AttentionSale {
  sale: SaleWithItems;
}

/**
 * DashboardAttentionSection — three stacked mini-lists:
 *   1. Stock: top 3 low/out products, out-of-stock first.
 *   2. Utang: top 3 priority suki (overdue first, then balance).
 *   3. Recent sales: top 3 newest transactions.
 *
 * Each block has a "View all" affordance routing to its owning tab,
 * keeping the dashboard itself shallow while letting the owner dive
 * deeper when something grabs their attention.
 */
export const DashboardAttentionSection = memo(
  function DashboardAttentionSection({
    stockAttention,
    sukis,
    recentSales,
    onViewAllStock,
    onViewAllUtang,
    onViewAllSales,
  }: DashboardAttentionSectionProps) {
    const { t } = useTranslation();
    const showStock = stockAttention.length > 0;
    const showUtang = sukis.length > 0;
    const showSales = recentSales.length > 0;

    if (!showStock && !showUtang && !showSales) return null;

    return (
      <View className="px-4 mb-4">
        {showStock && (
          <AttentionBlock
            icon="cube"
            label={t('common:attentionStock')}
            tone="warning"
            count={stockAttention.length}
            onViewAll={onViewAllStock}
            viewAllHref="/inventory"
            viewAllLabel={t('common:viewAll')}
            viewAllA11y={t('common:viewAllA11y', {
              label: t('common:attentionStock').toLowerCase(),
            })}
          >
            {stockAttention.map((item, idx) => (
              <StockRow
                key={`stock-${item.product.id}`}
                item={item}
                isLast={idx === stockAttention.length - 1}
              />
            ))}
          </AttentionBlock>
        )}

        {showUtang && (
          <AttentionBlock
            icon="credit-card"
            label={t('common:attentionSukis')}
            tone="danger"
            count={sukis.length}
            onViewAll={onViewAllUtang}
            viewAllHref="/utang"
            viewAllLabel={t('common:viewAll')}
            viewAllA11y={t('common:viewAllA11y', {
              label: t('common:attentionSukis').toLowerCase(),
            })}
          >
            {sukis.map((item, idx) => (
              <SukiRow
                key={`suki-${item.customer.id}`}
                item={item}
                isLast={idx === sukis.length - 1}
              />
            ))}
          </AttentionBlock>
        )}

        {showSales && (
          <AttentionBlock
            icon="shopping-cart"
            label={t('common:attentionSales')}
            tone="ink"
            count={recentSales.length}
            onViewAll={onViewAllSales}
            viewAllHref="/sell"
            viewAllLabel={t('common:viewAll')}
            viewAllA11y={t('common:viewAllA11y', {
              label: t('common:attentionSales').toLowerCase(),
            })}
          >
            {recentSales.map((item, idx) => (
              <SaleRowMini
                key={`sale-${item.sale.id}`}
                item={item}
                isLast={idx === recentSales.length - 1}
              />
            ))}
          </AttentionBlock>
        )}
      </View>
    );
  },
);

type Tone = 'warning' | 'danger' | 'ink';

const TONE_ACCENT: Record<Tone, string> = {
  warning: '#C77B0E',
  danger: '#C13030',
  ink: '#564E45',
};

const TONE_LABEL: Record<Tone, string> = {
  warning: 'text-semantic-warning',
  danger: 'text-semantic-danger',
  ink: 'text-ink-700',
};

function AttentionBlock({
  icon,
  label,
  tone,
  count,
  onViewAll,
  viewAllLabel,
  viewAllA11y,
  children,
}: {
  icon: keyof typeof FontAwesome.glyphMap;
  label: string;
  tone: Tone;
  count: number;
  onViewAll: () => void;
  viewAllHref: Href;
  viewAllLabel: string;
  viewAllA11y: string;
  children: React.ReactNode;
}) {
  return (
    <View
      className="bg-paper-50 rounded-xl border border-ink-100 mb-3 overflow-hidden"
    >
      <View className="px-4 pt-3 pb-2 flex-row items-center justify-between border-b border-dashed border-ink-200">
        <View className="flex-row items-center">
          <View
            className="w-7 h-7 rounded-full items-center justify-center mr-2"
            style={{ backgroundColor: `${TONE_ACCENT[tone]}1F` }}
          >
            <FontAwesome name={icon} size={12} color={TONE_ACCENT[tone]} />
          </View>
          <StyledText
            variant="black"
            className="text-ink-900 text-sm"
            style={{ letterSpacing: 0.2 }}
          >
            {label}
          </StyledText>
          <StyledText
            variant="medium"
            className="text-mono text-ink-400 ml-1.5"
          >
            · {count}
          </StyledText>
        </View>
        <TouchableOpacity
          onPress={onViewAll}
          activeOpacity={0.7}
          accessibilityRole="link"
          accessibilityLabel={viewAllA11y}
          className="flex-row items-center press-scale"
        >
          <StyledText
            variant="extrabold"
            className={`text-xs ${TONE_LABEL[tone]}`}
          >
            {viewAllLabel}
          </StyledText>
          <FontAwesome
            name="chevron-right"
            size={10}
            color={TONE_ACCENT[tone]}
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>
      </View>
      <View className="px-4 pb-3">{children}</View>
    </View>
  );
}

function StockRow({
  item,
  isLast,
}: {
  item: AttentionProduct;
  isLast: boolean;
}) {
  const qty = item.product.quantity;
  const pillVariant: 'danger' | 'warning' | 'neutral' = item.isOut
    ? 'danger'
    : 'warning';
  const pillLabel = item.isOut ? `${qty} left` : `${qty} left`;
  return (
    <Link href={`/inventory?restock=${item.product.id}`} asChild>
      <TouchableOpacity
        activeOpacity={0.7}
        className={`flex-row items-center justify-between py-4 ${
          !isLast ? 'border-b border-dashed border-ink-200' : ''
        }`}
      >
        <View className="flex-1 mr-3">
          <StyledText
            variant="semibold"
            className="text-ink-900 text-sm"
            numberOfLines={1}
          >
            {item.product.name}
          </StyledText>
          <StyledText
            variant="regular"
            className="text-ink-500 text-xs mt-0.5"
            numberOfLines={1}
          >
            {item.product.sku}
          </StyledText>
        </View>
        <View
          className={`px-2 py-0.5 rounded-full ${
            pillVariant === 'danger'
              ? 'bg-semantic-danger-50'
              : 'bg-semantic-warning-50'
          }`}
        >
          <StyledText
            variant="extrabold"
            className={`text-[11px] ${
              pillVariant === 'danger'
                ? 'text-semantic-danger'
                : 'text-semantic-warning'
            }`}
          >
            {pillLabel}
          </StyledText>
        </View>
      </TouchableOpacity>
    </Link>
  );
}

function SukiRow({
  item,
  isLast,
}: {
  item: AttentionCustomer;
  isLast: boolean;
}) {
  const { customer } = item;
  const isOverdue = customer.tag === 'overdue';
  const lastActivity = parseStoredTimestamp(customer.last_transaction_date);
  return (
    <View
      className={`flex-row items-center justify-between py-4 ${
        !isLast ? 'border-b border-dashed border-ink-200' : ''
      }`}
    >
      <View className="flex-1 mr-3">
        <View className="flex-row items-center">
          {isOverdue && (
            <View className="w-1.5 h-1.5 rounded-full bg-semantic-danger mr-1.5" />
          )}
          <StyledText
            variant="semibold"
            className="text-ink-900 text-sm"
            numberOfLines={1}
          >
            {customer.name}
          </StyledText>
        </View>
        <StyledText
          variant="regular"
          className="text-ink-500 text-xs mt-0.5"
          numberOfLines={1}
        >
          {isOverdue
            ? 'Overdue'
            : lastActivity
              ? `Last activity ${formatDistanceToNow(lastActivity, { addSuffix: true })}`
              : 'No activity yet'}
        </StyledText>
      </View>
      <MoneyText
        value={customer.outstanding_balance}
        size="sm"
        variant="danger"
        className="text-sm"
      />
    </View>
  );
}

function SaleRowMini({
  item,
  isLast,
}: {
  item: AttentionSale;
  isLast: boolean;
}) {
  const { sale } = item;
  const isCredit = sale.payment_type === 'credit';
  const timestamp = parseStoredTimestamp(sale.timestamp);
  const itemsLabel = `${sale.items_count} ${sale.items_count === 1 ? 'item' : 'items'}`;
  return (
    <View
      className={`flex-row items-center justify-between py-4 ${
        !isLast ? 'border-b border-dashed border-ink-200' : ''
      }`}
    >
      <View className="flex-1 mr-3">
        <View className="flex-row items-center">
          <StyledText
            variant="semibold"
            className="text-ink-900 text-sm"
            numberOfLines={1}
          >
            {sale.customer_name ||
              (isCredit
                ? 'Utang sale'
                : `Sale #${String(sale.id).padStart(4, '0')}`)}
          </StyledText>
          <View
            className={`ml-2 px-2 py-0.5 rounded-full ${
              isCredit ? 'bg-semantic-warning-50' : 'bg-sage-50'
            }`}
          >
            <StyledText
              variant="extrabold"
              className={`text-[10px] ${
                isCredit ? 'text-semantic-warning' : 'text-sage-700'
              }`}
            >
              {isCredit ? 'UTANG' : 'CASH'}
            </StyledText>
          </View>
        </View>
        <StyledText
          variant="regular"
          className="text-ink-500 text-xs mt-0.5"
          numberOfLines={1}
        >
          {timestamp
            ? formatDistanceToNow(timestamp, { addSuffix: true })
            : 'Time unavailable'}{' '}
          · {itemsLabel}
        </StyledText>
      </View>
      <MoneyText value={sale.total} size="sm" className="text-sm" />
    </View>
  );
}
