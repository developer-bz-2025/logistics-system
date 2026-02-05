import { Injectable } from '@angular/core';
import { PrRow as PRDto, PrItem as PRItemDto } from '../models/pr';

@Injectable({ providedIn: 'root' })
export class DiffService {

  buildSummary(original: PRDto, current: any): string[] {
    const lines: string[] = [];
    const fmt = (d: any) => (d ? String(d).slice(0, 10) : '');

    // Header changes
    const oldDate = fmt(original.pr_date);
    const newDate = fmt(current.pr_date);
    if (oldDate !== newDate) lines.push(`PR Date: ${oldDate} → ${newDate}`);
    if (original.pr_code !== current.pr_code) lines.push(`PR Code: ${original.pr_code} → ${current.pr_code}`);

    // detect location change 
    const oldLocId = (original as any)?.location_id ?? (original as any)?.location?.id ?? null;
    const newLocId = (current as any)?.location_id ?? (current as any)?.location?.id ?? null;
    if (oldLocId !== newLocId) {
      const oldLocName = (original as any)?.location_name ?? (original as any)?.location?.name ?? (oldLocId ? `#${oldLocId}` : '—');
      const newLocName = (current as any)?.location_name ?? (current as any)?.location?.name ?? (newLocId ? `#${newLocId}` : '—');
      lines.push(`Location: ${oldLocName} → ${newLocName}`);
    }

    const origItems = (original.items ?? []);
    const curItems = (current.items ?? []) as Array<{
      pr_item_id?: number | null;
      fixed_item_id: number;
      fixed_item_name?: string;
      supplier_id: number;
      supplier_name?: string;
      unit_cost: number;
    }>;

    // Index originals by pr_item_id (DB id). This avoids collisions on fixed_item_id.
    const origById = new Map<number, typeof origItems[number]>();
    for (const oi of origItems) {
      if (oi && typeof oi.pr_item_id === 'number') {
        // If your original model uses "id" for the item id, map it here instead:
        // origById.set(oi.id, oi);
        origById.set(oi.pr_item_id as any, oi as any);
      }
    }

    // 1) Compare each original row to current by pr_item_id
    for (const oi of origItems) {
      const id: any = (oi as any).pr_item_id; // or oi.id if that's your field
      if (typeof id !== 'number') {
        // Original without id? treat defensively (unlikely)
        continue;
      }
      const ci = curItems.find(it => it.pr_item_id === id);

      const nameOld = oi.fixed_item_name ?? `#${oi.fixed_item_id}`;

      if (!ci) {
        // Missing now → removed
        lines.push(`Item ${nameOld}: Removed`);
        continue;
      }

      const nameNew = ci.fixed_item_name ?? nameOld;
      const supOld = oi.supplier_name ?? `#${oi.supplier_id}`;
      const supNew = ci.supplier_name ?? `#${ci.supplier_id}`;

      // Item (catalog) changed?
      if (oi.fixed_item_id !== ci.fixed_item_id) {
        lines.push(`Item ${nameOld}: Changed to ${nameNew}`);
      }

      // Supplier changed?
      if (oi.supplier_id !== ci.supplier_id) {
        lines.push(`Item ${nameNew}: Supplier ${supOld} → ${supNew}`);
      }

      // Price changed?
      const oldPrice = Number(oi.unit_cost).toFixed(2);
      const newPrice = Number(ci.unit_cost).toFixed(2);
      if (oldPrice !== newPrice) {
        lines.push(`Item ${nameNew}: Price ${oi.unit_cost} → ${ci.unit_cost}`);
      }
    }

    // 2) Additions = any current row that has no pr_item_id OR pr_item_id not in originals
    for (const ci of curItems) {
      const isNew = ci.pr_item_id == null || !origById.has(Number(ci.pr_item_id));
      if (isNew) {
        const name = ci.fixed_item_name ?? `#${ci.fixed_item_id}`;
        lines.push(`Item ${name}: Added`);
      }
    }

    return lines.length ? lines : ['No changes detected yet.'];
  }

  // buildSummary(original: PRDto, current: any): string[] {
  //   const lines: string[] = [];

  //   // if (original.pr_date !== current.pr_date)
  //   //   lines.push(`PR Date: ${original.pr_date} → ${current.pr_date}`);

  //   const fmt = (d: any) => (d ? String(d).slice(0, 10) : '');

  //   const oldDate = fmt(original.pr_date);
  //   const newDate = fmt(current.pr_date);

  //   if (oldDate !== newDate) {
  //     lines.push(`PR Date: ${oldDate} → ${newDate}`);
  //   }

  //   if (original.pr_code !== current.pr_code)
  //     lines.push(`PR Code: ${original.pr_code} → ${current.pr_code}`);

  //   const origItems = original.items ?? [];
  //   const curItems = (current.items ?? []) as any[];

  //   const origByFixed = new Map(origItems.map(i => [i.fixed_item_id, i]));
  //   const curByFixed = new Map(curItems.map((i: any) => [i.fixed_item_id, i]));

  //   for (const it of origItems) {
  //     const cur = curByFixed.get(it.fixed_item_id);
  //     const itemNameOld = it.fixed_item_name ?? `#${it.fixed_item_id}`;
  //     if (!cur) { lines.push(`Item ${itemNameOld}: Removed`); continue; }

  //     const itemNameNew = cur.fixed_item_name ?? itemNameOld;
  //     const supOld = it.supplier_name ?? `#${it.supplier_id}`;
  //     const supNew = cur.supplier_name ?? `#${cur.supplier_id}`;

  //     if (it.supplier_id !== cur.supplier_id)
  //       lines.push(`Item ${itemNameNew}: Supplier ${supOld} → ${supNew}`);

  //     if (Number(it.unit_cost).toFixed(2) !== Number(cur.unit_cost).toFixed(2))
  //       lines.push(`Item ${itemNameNew}: Price ${it.unit_cost} → ${cur.unit_cost}`);
  //   }

  //   for (const it of curItems) {
  //     if (!origByFixed.get(it.fixed_item_id)) {
  //       const itemName = it.fixed_item_name ?? `#${it.fixed_item_id}`;
  //       lines.push(`Item ${itemName}: Added`);
  //     }
  //   }

  //   return lines.length ? lines : ['No changes detected yet.'];
  // }
}
