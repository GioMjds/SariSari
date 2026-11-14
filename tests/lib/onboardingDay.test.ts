import {
  cartHasExtras,
  cartMatches,
  cartTotal,
  createDaySeed,
  dayReducer,
  firstUnfinishedBeat,
  outcomeParams,
  scriptFor,
  type DayAction,
  type DayState,
} from '@/lib/onboardingDay';
import { formatPesos, type Pesos } from '@/lib/money';
import type { BeatId } from '@/constants/onboardingDay';

const run = (state: DayState, actions: DayAction[]) =>
  actions.reduce(dayReducer, state);

const add = (id: 'kopiko' | 'pandesal' | 'luckyMe' | 'cokeMismo', n: number) =>
  Array.from({ length: n }, (): DayAction => ({ type: 'addToCart', id }));

const cashDone = () =>
  run(createDaySeed(), [
    ...add('kopiko', 2),
    ...add('pandesal', 1),
    { type: 'checkoutCash', tendered: 50 as Pesos },
  ]);

const utangDone = () =>
  run(cashDone(), [
    ...add('luckyMe', 2),
    ...add('cokeMismo', 1),
    { type: 'checkoutUtang', suki: 'nena' },
  ]);

describe('onboarding day reducer', () => {
  it('seeds the sample store', () => {
    const s = createDaySeed();
    expect(s.products.kopiko).toEqual({ stock: 5, price: 15 });
    expect(s.sukiBalances.nena).toBe(0);
    expect(s.sales).toEqual({ total: 0, items: 0, utangOut: 0 });
    expect(s.cart).toEqual([]);
    expect(s.beatDone).toEqual({
      cash: false,
      utang: false,
      restock: false,
      close: false,
    });
    expect(s.receipts).toEqual({ cash: null, utang: null });
  });

  it('adds and removes cart lines one at a time', () => {
    const s = run(createDaySeed(), [
      ...add('kopiko', 2),
      { type: 'removeFromCart', id: 'kopiko' },
    ]);
    expect(s.cart).toEqual([{ id: 'kopiko', qty: 1 }]);
    const empty = dayReducer(s, { type: 'removeFromCart', id: 'kopiko' });
    expect(empty.cart).toEqual([]);
  });

  it('caps the cart at available stock', () => {
    const s = run(createDaySeed(), add('kopiko', 9));
    expect(s.cart).toEqual([{ id: 'kopiko', qty: 5 }]);
  });

  it('matches the cart only against the exact scripted order', () => {
    const exact = run(createDaySeed(), [
      ...add('kopiko', 2),
      ...add('pandesal', 1),
    ]);
    expect(cartMatches(exact.cart, 'cash')).toBe(true);
    expect(cartHasExtras(exact.cart, 'cash')).toBe(false);

    const extra = dayReducer(exact, { type: 'addToCart', id: 'luckyMe' });
    expect(cartMatches(extra.cart, 'cash')).toBe(false);
    expect(cartHasExtras(extra.cart, 'cash')).toBe(true);
  });

  it('rings a cash sale: change, stock, totals, receipt', () => {
    const s = cashDone();
    expect(s.products.kopiko.stock).toBe(3);
    expect(s.products.pandesal.stock).toBe(29);
    expect(s.sales).toEqual({ total: 38, items: 3, utangOut: 0 });
    expect(s.receipts.cash).toEqual({ total: 38, change: 12 });
    expect(s.cart).toEqual([]);
    expect(s.beatDone.cash).toBe(true);
  });

  it('rejects cash checkout on a wrong cart or a short tender', () => {
    const wrong = run(createDaySeed(), [
      ...add('kopiko', 1),
      { type: 'checkoutCash', tendered: 50 as Pesos },
    ]);
    expect(wrong.beatDone.cash).toBe(false);
    expect(wrong.products.kopiko.stock).toBe(5);

    const short = run(createDaySeed(), [
      ...add('kopiko', 2),
      ...add('pandesal', 1),
      { type: 'checkoutCash', tendered: 20 as Pesos },
    ]);
    expect(short.beatDone.cash).toBe(false);
    expect(short.cart).toHaveLength(2);
  });

  it('puts the utang sale on Aling Nena and the day totals', () => {
    const s = utangDone();
    expect(s.sukiBalances.nena).toBe(64);
    expect(s.sales).toEqual({ total: 102, items: 6, utangOut: 64 });
    expect(s.receipts.utang).toEqual({ total: 64 });
    expect(s.receipts.cash).toEqual({ total: 38, change: 12 });
    expect(s.beatDone.utang).toBe(true);
  });

  it('restocks a low item once and ignores repeats', () => {
    const s = dayReducer(utangDone(), {
      type: 'restock',
      id: 'kopiko',
      qty: 24,
    });
    expect(s.products.kopiko.stock).toBe(27);
    expect(s.beatDone.restock).toBe(true);
    const again = dayReducer(s, { type: 'restock', id: 'kopiko', qty: 24 });
    expect(again).toBe(s);
  });

  it('rejects restocking an item that is not low, or a bad quantity', () => {
    const seed = createDaySeed();
    expect(dayReducer(seed, { type: 'restock', id: 'kopiko', qty: 24 })).toBe(
      seed,
    );
    const low = cashDone();
    expect(dayReducer(low, { type: 'restock', id: 'kopiko', qty: 0 })).toBe(
      low,
    );
    expect(dayReducer(low, { type: 'restock', id: 'kopiko', qty: 1.5 })).toBe(
      low,
    );
  });

  it('records a partial payment once and rejects overpayment', () => {
    const owed = utangDone();
    const over = dayReducer(owed, {
      type: 'receivePayment',
      suki: 'nena',
      amount: 65 as Pesos,
    });
    expect(over).toBe(owed);

    const paid = dayReducer(owed, {
      type: 'receivePayment',
      suki: 'nena',
      amount: 40 as Pesos,
    });
    expect(paid.sukiBalances.nena).toBe(24);
    expect(paid.sales.utangOut).toBe(24);
    expect(paid.beatDone.close).toBe(true);

    const again = dayReducer(paid, {
      type: 'receivePayment',
      suki: 'nena',
      amount: 10 as Pesos,
    });
    expect(again).toBe(paid);
  });

  it('autoplay reaches the same state as doing each beat by hand', () => {
    const beats: BeatId[] = ['cash', 'utang', 'restock', 'close'];
    const auto = beats.reduce(
      (s, beat) => dayReducer(s, { type: 'autoplay', beat }),
      createDaySeed(),
    );
    const manual = beats.reduce(
      (s, beat) => run(s, scriptFor(beat)),
      createDaySeed(),
    );
    expect(auto).toEqual(manual);
    expect(auto.beatDone).toEqual({
      cash: true,
      utang: true,
      restock: true,
      close: true,
    });
  });

  it('autoplay repairs a messy cart and is a no-op on a done beat', () => {
    const messy = run(createDaySeed(), add('cokeMismo', 3));
    const fixed = dayReducer(messy, { type: 'autoplay', beat: 'cash' });
    expect(fixed.beatDone.cash).toBe(true);
    expect(fixed.products.cokeMismo.stock).toBe(10);
    expect(dayReducer(fixed, { type: 'autoplay', beat: 'cash' })).toBe(fixed);
  });

  it('names the first unfinished beat, or null once the day is done', () => {
    expect(firstUnfinishedBeat(createDaySeed())).toBe('cash');
    expect(firstUnfinishedBeat(cashDone())).toBe('utang');
    expect(firstUnfinishedBeat(utangDone())).toBe('restock');
    const all = (['restock', 'close'] as BeatId[]).reduce(
      (s, beat) => dayReducer(s, { type: 'autoplay', beat }),
      utangDone(),
    );
    expect(firstUnfinishedBeat(all)).toBeNull();
  });

  it('keeps every money value an integer', () => {
    const s = dayReducer(utangDone(), { type: 'autoplay', beat: 'close' });
    for (const n of [
      s.sales.total,
      s.sales.utangOut,
      s.sukiBalances.nena,
      cartTotal(s),
    ]) {
      expect(Number.isInteger(n)).toBe(true);
    }
  });

  it('builds outcome params from per-beat receipts, not day totals', () => {
    const s = utangDone();
    expect(outcomeParams('cash', s)).toEqual({
      total: formatPesos(38),
      change: formatPesos(12),
    });
    expect(outcomeParams('utang', s)).toEqual({ total: formatPesos(64) });
    const restocked = dayReducer(s, { type: 'autoplay', beat: 'restock' });
    expect(outcomeParams('restock', restocked)).toEqual({ stock: '27' });
    const closed = dayReducer(restocked, { type: 'autoplay', beat: 'close' });
    expect(outcomeParams('close', closed)).toEqual({
      balance: formatPesos(24),
    });
  });
});
