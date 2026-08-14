import en from '@/locales/en/common.json';
import tl from '@/locales/tl/common.json';

const REQUIRED_MORE_KEYS = [
  'moreHomeEyebrow',
  'moreHomeTitle',
  'moreHomeSubtitle',
  'moreHomeCashLabel',
  'moreHomeCashLoading',
  'moreHomeCashEmpty',
  'moreHomeCashSummary',
  'moreHomeCashError',
  'moreHomeCashOpenAction',
  'moreHomeCashReviewAction',
  'moreHomeCashCheckAction',
  'moreHomeCashHint',
  'moreHomeReportsLabel',
  'moreHomeReportsSub',
  'moreHomeReportsHint',
  'moreHomeStoreDataSection',
  'moreHomeBackupLabel',
  'moreHomeBackupLoading',
  'moreHomeBackupEmpty',
  'moreHomeBackupLatest',
  'moreHomeBackupError',
  'moreHomeBackupHint',
  'moreHomeSettingsLabel',
  'moreHomeSettingsSub',
  'moreHomeSettingsHint',
  'moreBackA11y',
  'backupTitle',
  'backupSubtitle',
  'backupCloudSection',
  'backupCloudSectionSub',
  'backupLocalSection',
  'backupLocalSectionSub',
] as const;

const REMOVED_DIRECTORY_KEYS = [
  'moreHomeDailyOps',
  'moreHomeCustomers',
  'moreHomeReportsSection',
  'moreHomeCashFinances',
  'moreHomeStoreData',
  'moreHomeAboutHelp',
  'moreHomeHeroCashSession',
  'moreHomeHeroNewSale',
  'moreHomeHeroRecordExpense',
  'moreHomeTilePos',
  'moreHomeTileReceipts',
  'moreHomeTileProducts',
  'moreHomeTileStockMovements',
  'moreHomeTileRestock',
  'moreHomeTileDamaged',
  'moreHomeTileAllCustomers',
  'moreHomeTileUtang',
  'moreHomeTileCollection',
  'moreHomeTileInsights',
  'moreHomeTileAlmanac',
  'moreHomeTileSalesTrend',
  'moreHomeTileTopProducts',
  'moreHomeTileStockMovement',
  'moreHomeTileSukiAging',
  'moreHomeTileCashbook',
  'moreHomeTileCashMovements',
  'moreHomeTileGastos',
  'moreHomeTileStoreProfile',
  'moreHomeTileLanguage',
  'moreHomeTileBackup',
  'moreHomeTileDeveloperReset',
  'moreHomeBusinessReviewSection',
  'moreHomeStoreSetupSection',
  'moreHomeDataSafetySection',
  'moreHomeAppSection',
  'moreHomeExpensesLabel',
  'moreHomeExpensesSub',
  'moreHomeStoreProfileLabel',
  'moreHomeStoreProfileSub',
  'moreHomeLanguageLabel',
  'moreHomeLanguageSub',
  'moreHomeHelpLabel',
  'moreHomeHelpSub',
  'moreHomeAboutLabel',
  'moreHomeAboutSub',
] as const;

describe('More localization contract', () => {
  it.each(REQUIRED_MORE_KEYS)('defines %s in English and Tagalog', (key) => {
    expect(en).toHaveProperty(key);
    expect(tl).toHaveProperty(key);
    expect(en[key]).not.toHaveLength(0);
    expect(tl[key]).not.toHaveLength(0);
  });

  it('keeps interpolation placeholders aligned', () => {
    expect(en.moreHomeCashSummary).toContain('{{expenses}}');
    expect(en.moreHomeCashSummary).toContain('{{drawings}}');
    expect(tl.moreHomeCashSummary).toContain('{{expenses}}');
    expect(tl.moreHomeCashSummary).toContain('{{drawings}}');
    expect(en.moreHomeBackupLatest).toContain('{{when}}');
    expect(tl.moreHomeBackupLatest).toContain('{{when}}');
  });

  it.each(REMOVED_DIRECTORY_KEYS)('removes obsolete key %s', (key) => {
    expect(en).not.toHaveProperty(key);
    expect(tl).not.toHaveProperty(key);
  });
});
