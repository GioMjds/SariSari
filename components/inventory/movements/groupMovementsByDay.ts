export interface MovementDaySection {
  title: string;
  date: Date;
  data: any[];
  totals: { in: number; out: number; net: number };
}

const dayKey = (ts: number) => {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

const isInbound = (m: any): boolean =>
  m.type === 'restock' ||
  (m.type === 'adjustment' && m.adjustment_sign === 'positive') ||
  m.type === 'receive';

const isOutbound = (m: any): boolean =>
  m.type === 'sale' ||
  (m.type === 'adjustment' && m.adjustment_sign === 'negative') ||
  m.type === 'damage';

const fmt = (d: Date) =>
  d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

export function groupMovementsByDay(movements: any[]): MovementDaySection[] {
  const buckets = new Map<
    number,
    { date: Date; rows: any[]; in: number; out: number }
  >();

  for (const m of movements) {
    const k = dayKey(m.timestamp);
    if (!buckets.has(k)) {
      buckets.set(k, { date: new Date(k), rows: [], in: 0, out: 0 });
    }
    const b = buckets.get(k)!;
    b.rows.push(m);
    if (isInbound(m)) b.in += m.quantity;
    if (isOutbound(m)) b.out += m.quantity;
  }

  return Array.from(buckets.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([k, b]) => ({
      title: fmt(b.date),
      date: b.date,
      data: b.rows.sort((x, y) => y.timestamp - x.timestamp),
      totals: { in: b.in, out: b.out, net: b.in - b.out },
    }));
}
