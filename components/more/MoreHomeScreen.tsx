import { useTranslation } from 'react-i18next';
import { Href, router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { MoreGroupSection } from './MoreGroupSection';
import { MoreHeroStrip } from './MoreHeroStrip';
import { MoreIconSection } from './MoreIconSection';
import { MoreLinkRow } from './MoreLinkRow';
import { MoreTile } from './MoreTile';
import { MoreTileGrid } from './MoreTileGrid';
import { withFeatureGuard } from '@/components/withFeatureGuard';

const routes = {
  cashSession: '/(edit-forms)/cash-session',
  pos: '/(tabs)/sales/pos',
  receipts: '/(tabs)/sales/receipts',
  products: '/(tabs)/inventory/products',
  stockMovements: '/(tabs)/inventory/movements',
  restock: '/(tabs)/inventory/recommendations',
  damaged: '/(tabs)/inventory/damaged',
  allCustomers: '/(tabs)/customers/all',
  credit: '/(tabs)/customers/credit',
  creditOverdue: '/(tabs)/customers/credit',
  insights: '/(tabs)/customers/insights',
  almanac: '/(tabs)/home/today',
  salesTrend: '/(tabs)/home/today?section=trend',
  topProducts: '/(tabs)/home/today?section=top',
  stockSection: '/(tabs)/home/today?section=stock',
  sukiAging: '/(tabs)/home/today?section=aging',
  cashbook: '/(tabs)/home/today?section=cashbook',
  cashEntries: '/(tabs)/more/cash-entries',
  gastos: '/gastos-kaha',
  settings: '/(tabs)/more/settings',
  collection: '/(tabs)/customers/collection',
} satisfies Record<string, Href>;

function MoreTab() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-paper-200">
      <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>
        {/* Hero strip */}
        <View className="px-4 pt-1 pb-5">
          <MoreHeroStrip>
            <MoreTile
              label={t('common:moreHomeHeroCashSession')}
              icon="money"
              onPress={() => router.push(routes.cashSession)}
              accent="paper"
            />
            <MoreTile
              label={t('common:moreHomeHeroNewSale')}
              icon="shopping-cart"
              onPress={() => router.push(routes.pos)}
              accent="paper"
            />
            <MoreTile
              label={t('common:moreHomeHeroRecordExpense')}
              icon="minus-circle"
              onPress={() => router.push(routes.cashEntries)}
              accent="paper"
            />
          </MoreHeroStrip>
        </View>

        {/* Daily operations */}
        <MoreIconSection title={t('common:moreHomeDailyOps')}>
          <MoreTileGrid>
            <MoreTile
              label={t('common:moreHomeTilePos')}
              icon="shopping-cart"
              onPress={() => router.push(routes.pos)}
              accent="persimmon"
            />
            <MoreTile
              label={t('common:moreHomeTileReceipts')}
              icon="file-text-o"
              onPress={() => router.push(routes.receipts)}
              accent="persimmon"
            />
            <MoreTile
              label={t('common:moreHomeTileProducts')}
              icon="cube"
              onPress={() => router.push(routes.products)}
              accent="warm"
            />
            <MoreTile
              label={t('common:moreHomeTileStockMovements')}
              icon="exchange"
              onPress={() => router.push(routes.stockMovements)}
              accent="warm"
            />
            <MoreTile
              label={t('common:moreHomeTileRestock')}
              icon="lightbulb-o"
              onPress={() => router.push(routes.restock)}
              accent="warm"
            />
            <MoreTile
              label={t('common:moreHomeTileDamaged')}
              icon="trash"
              onPress={() => router.push(routes.damaged)}
              accent="warm"
            />
          </MoreTileGrid>
        </MoreIconSection>

        {/* Customers & credit */}
        <MoreIconSection title={t('common:moreHomeCustomers')}>
          <MoreTileGrid>
            <MoreTile
              label={t('common:moreHomeTileAllCustomers')}
              icon="users"
              onPress={() => router.push(routes.allCustomers)}
              accent="cinnamon"
            />
            <MoreTile
              label={t('common:moreHomeTileUtang')}
              icon="credit-card"
              onPress={() => router.push(routes.credit)}
              accent="cinnamon"
            />
            <MoreTile
              label={t('common:moreHomeTileCollection')}
              icon="bell"
              onPress={() => router.push(routes.creditOverdue)}
              accent="cinnamon"
            />
            <MoreTile
              label={t('common:moreHomeTileInsights')}
              icon="line-chart"
              onPress={() => router.push(routes.insights)}
              accent="cinnamon"
            />
          </MoreTileGrid>
        </MoreIconSection>

        {/* Reports */}
        <MoreIconSection title={t('common:moreHomeReportsSection')}>
          <MoreTileGrid>
            <MoreTile
              label={t('common:moreHomeTileAlmanac')}
              icon="newspaper-o"
              onPress={() => router.push(routes.almanac)}
              accent="sage"
            />
            <MoreTile
              label={t('common:moreHomeTileSalesTrend')}
              icon="bar-chart"
              onPress={() => router.push(routes.salesTrend)}
              accent="sage"
            />
            <MoreTile
              label={t('common:moreHomeTileTopProducts')}
              icon="trophy"
              onPress={() => router.push(routes.topProducts)}
              accent="sage"
            />
            <MoreTile
              label={t('common:moreHomeTileStockMovement')}
              icon="archive"
              onPress={() => router.push(routes.stockSection)}
              accent="sage"
            />
            <MoreTile
              label={t('common:moreHomeTileSukiAging')}
              icon="hourglass-half"
              onPress={() => router.push(routes.sukiAging)}
              accent="sage"
            />
            <MoreTile
              label={t('common:moreHomeTileCashbook')}
              icon="book"
              onPress={() => router.push(routes.cashbook)}
              accent="sage"
            />
          </MoreTileGrid>
        </MoreIconSection>

        {/* Cash & finances */}
        <MoreIconSection title={t('common:moreHomeCashFinances')}>
          <MoreTileGrid>
            <MoreTile
              label={t('common:moreHomeTileCashMovements')}
              icon="money"
              onPress={() => router.push(routes.cashEntries)}
              accent="warm"
            />
            <MoreTile
              label={t('common:moreHomeTileGastos')}
              icon="book"
              onPress={() => router.push(routes.gastos)}
              accent="warm"
            />
          </MoreTileGrid>
        </MoreIconSection>

        {/* Store & data */}
        <MoreIconSection title={t('common:moreHomeStoreData')}>
          <MoreTileGrid>
            <MoreTile
              label={t('common:moreHomeTileStoreProfile')}
              icon="home"
              onPress={() => router.push(routes.settings)}
              accent="paper"
            />
            <MoreTile
              label={t('common:moreHomeTileLanguage')}
              icon="globe"
              onPress={() => router.push(routes.settings)}
              accent="paper"
            />
            <MoreTile
              label={t('common:moreHomeTileBackup')}
              icon="cloud"
              onPress={() => router.push(routes.settings)}
              accent="paper"
            />
          </MoreTileGrid>
        </MoreIconSection>

        {/* About & help */}
        <MoreGroupSection title={t('common:moreHomeAboutHelp')}>
          <MoreLinkRow
            label={t('common:moreHomeHelpLabel')}
            subtitle={t('common:moreHomeHelpSub')}
            icon="question-circle"
            onPress={() => router.push(routes.settings)}
          />
          <MoreLinkRow
            label={t('common:moreHomeAboutLabel')}
            subtitle={t('common:moreHomeAboutSub')}
            icon="info-circle"
            onPress={() => router.push(routes.settings)}
          />
        </MoreGroupSection>
      </ScrollView>
    </View>
  );
}

export const MoreHomeScreen = withFeatureGuard(MoreTab, !__DEV__);
