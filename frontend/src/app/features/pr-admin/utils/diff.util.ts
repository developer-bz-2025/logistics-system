import { Injectable } from '@angular/core';
import { PrRow as PRDto, PrItem as PRItemDto } from '../models/pr';

@Injectable({ providedIn: 'root' })
export class DiffService {
  buildSummary(original: PRDto, current: any): string[] {
    const lines: string[] = [];

    // if (original.pr_date !== current.pr_date)
    //   lines.push(`PR Date: ${original.pr_date} → ${current.pr_date}`);

    const fmt = (d: any) => (d ? String(d).slice(0, 10) : '');

    const oldDate = fmt(original.pr_date);
    const newDate = fmt(current.pr_date);

    if (oldDate !== newDate) {
      lines.push(`PR Date: ${oldDate} → ${newDate}`);
    }

    if (original.pr_code !== current.pr_code)
      lines.push(`PR Code: ${original.pr_code} → ${current.pr_code}`);

    const origItems = original.items ?? [];
    const curItems = (current.items ?? []) as any[];

    const origByFixed = new Map(origItems.map(i => [i.fixed_item_id, i]));
    const curByFixed = new Map(curItems.map((i: any) => [i.fixed_item_id, i]));

    for (const it of origItems) {
      const cur = curByFixed.get(it.fixed_item_id);
      const itemNameOld = it.fixed_item_name ?? `#${it.fixed_item_id}`;
      if (!cur) { lines.push(`Item ${itemNameOld}: Removed`); continue; }

      const itemNameNew = cur.fixed_item_name ?? itemNameOld;
      const supOld = it.supplier_name ?? `#${it.supplier_id}`;
      const supNew = cur.supplier_name ?? `#${cur.supplier_id}`;

      if (it.supplier_id !== cur.supplier_id)
        lines.push(`Item ${itemNameNew}: Supplier ${supOld} → ${supNew}`);

      if (Number(it.unit_cost).toFixed(2) !== Number(cur.unit_cost).toFixed(2))
        lines.push(`Item ${itemNameNew}: Price ${it.unit_cost} → ${cur.unit_cost}`);
    }

    for (const it of curItems) {
      if (!origByFixed.get(it.fixed_item_id)) {
        const itemName = it.fixed_item_name ?? `#${it.fixed_item_id}`;
        lines.push(`Item ${itemName}: Added`);
      }
    }

    return lines.length ? lines : ['No changes detected yet.'];
  }
}
