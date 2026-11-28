import {
  createEmptiesType,
  createSupplier,
  getEmptiesBalances,
  initCashMovementsView,
  initCashTables,
  initCorrectionsTable,
  initCreditsTable,
  initDigitalServicesTables,
  initFinancialEntriesTable,
  initInventoryTable,
  initProductsTable,
  initSalesTables,
  initSettingsTable,
  initSuppliersTable,
  previewSwapCount,
  recordSwapCount,
  runMigrations,
} from '@/database';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';

let mockUuid = 0;
jest.mock('expo-crypto', () => ({ randomUUID: () => `empties-${++mockUuid}` }));

describe('supplier empties ledger', () => {
  beforeAll(async () => {
    await initProductsTable();
    await initInventoryTable();
    await initSalesTables();
    await initCreditsTable();
    await initCorrectionsTable();
    await initSettingsTable();
    await initCashTables();
    await initSuppliersTable();
    await initDigitalServicesTables();
    await initFinancialEntriesTable();
    await runMigrations();
    await initCashMovementsView();
  });
  beforeEach(() => {
    resetMockDb();
  });

  const seed = async (deposit = 10) => {
    const s = await createSupplier({ name: 'Agent', contact: null, notes: null, paymentTermsDays: null });
    const emptiesId = await createEmptiesType(s.id, '1L bottle', deposit);
    return { supplierId: s.id, emptiesId };
  };

  it('receiving 10 full and handing back 7 with 3 on hand has no shortfall', async () => {
    const { supplierId, emptiesId } = await seed();
    const r = await recordSwapCount({ emptiesId, receivedFull: 10, handedBack: 7, physicalCount: 3 });
    expect(r).toEqual({ expectedOwed: 3, shortfall: 0, shortfallPesos: 0 });
    expect((await getEmptiesBalances(supplierId))[0]!.owed).toBe(3);
  });

  it('counting 2 when 3 are expected gives a shortfall of 1 deposit and resets the balance', async () => {
    const { supplierId, emptiesId } = await seed(10);
    const r = await recordSwapCount({ emptiesId, receivedFull: 10, handedBack: 7, physicalCount: 2 });
    expect(r).toEqual({ expectedOwed: 3, shortfall: 1, shortfallPesos: 10 });
    expect((await getEmptiesBalances(supplierId))[0]!.owed).toBe(2);
  });

  it('preview does not write', async () => {
    const { supplierId, emptiesId } = await seed();
    await previewSwapCount({ emptiesId, receivedFull: 5, handedBack: 0, physicalCount: 5 });
    expect((await getEmptiesBalances(supplierId))[0]!.owed).toBe(0);
  });

  it('a count above expected is a surplus: no pesos at risk', async () => {
    const { emptiesId } = await seed();
    const r = await recordSwapCount({ emptiesId, receivedFull: 4, handedBack: 0, physicalCount: 6 });
    expect(r.shortfall).toBe(-2);
    expect(r.shortfallPesos).toBe(0);
  });

  it('rejects non-integer or negative counts and bad deposits', async () => {
    const { supplierId, emptiesId } = await seed();
    await expect(
      recordSwapCount({ emptiesId, receivedFull: 1.5, handedBack: 0, physicalCount: 0 }),
    ).rejects.toThrow();
    await expect(
      recordSwapCount({ emptiesId, receivedFull: 0, handedBack: 0, physicalCount: -1 }),
    ).rejects.toThrow();
    await expect(createEmptiesType(supplierId, 'crate', 2.5)).rejects.toThrow();
  });
});
