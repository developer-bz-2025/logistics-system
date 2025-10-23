import { DiffResult, PrItemDto, PrSnapshot } from './models';

function compareScalar<T>(label: string, a: T, b: T, changed: DiffResult['changedFields']) {
  if (a !== b) changed.push({ field: label, from: a, to: b });
}

export function diffPr(original: PrSnapshot, proposed: PrSnapshot): DiffResult {
  const changedFields: DiffResult['changedFields'] = [];
  compareScalar('code', original.code, proposed.code, changedFields);
  compareScalar('date', original.date, proposed.date, changedFields);

  const keyOf = (i: PrItemDto) => `${i.fixed_item_id}:${i.supplier_id}`;

  const oMap = new Map(original.items.map(i => [keyOf(i), i]));
  const pMap = new Map(proposed.items.map(i => [keyOf(i), i]));

  const added: PrItemDto[] = [];
  const removed: PrItemDto[] = [];
  const modified: DiffResult['items']['modified'] = [];

  // Added + Modified
  for (const [k, p] of pMap) {
    const o = oMap.get(k);
    if (!o) {
      added.push(p);
    } else {
      const diffs: Array<{ field: keyof PrItemDto; from: any; to: any }> = [];
      (['qty','unit_price','total'] as (keyof PrItemDto)[]).forEach(f => {
        if (o[f] !== p[f]) diffs.push({ field: f, from: o[f], to: p[f] });
      });
      if (diffs.length) modified.push({ key: k, from: o, to: p, diffs });
    }
  }

  // Removed
  for (const [k, o] of oMap) {
    if (!pMap.has(k)) removed.push(o);
  }

  const totals = {
    original: original.total_price,
    proposed: proposed.total_price,
    delta: proposed.total_price - original.total_price,
  };

  return { changedFields, items: { added, removed, modified }, totals };
}
