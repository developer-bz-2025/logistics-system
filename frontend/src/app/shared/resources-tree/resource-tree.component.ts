// resource-tree.component.ts
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { TypeNode } from 'src/app/core/services/resources.service';
import { ResourcesService } from 'src/app/core/services/resources.service';

@Component({
  selector: 'app-resource-tree',
  templateUrl: './resource-tree.component.html',
//   styleUrls: ['./resource-tree.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResourceTreeComponent {
  // Inputs
  @Input() tree: TypeNode[] = [];
  @Input() typeColors: Record<string, string> = {};
  @Input() visColors: Record<string, string> = {};
  /** Optional: pass a URL resolver from the parent (e.g., to prepend file base). */
  // @Input() resolveUrl?: (u: string | null | undefined) => string | null;

  constructor(private rs:ResourcesService){}

 resolveUrl(u:any){
this.rs.resolveUrl(u);
 }

  // Local UI state
  activeTypeIndex = 0;
  opened: { category_id: number | null; category_name: string } | null = null;

  // Derived getters
  get activeTypeNode() {
    return this.tree?.[this.activeTypeIndex] ?? null;
  }
  get selectedCategory() {
    const a = this.activeTypeNode;
    const o = this.opened;
    return a && o ? a.categories?.find(c => c.category_id === o.category_id) ?? null : null;
  }

  // Actions
  selectTab(i: number) { this.activeTypeIndex = i; this.opened = null; }
  openFolder(cat: { category_id: number | null; category_name: string }) { this.opened = cat; }
  closeFolder() { this.opened = null; }

  // Helpers
  iconForType(type?: string): string {
    switch ((type || '').toLowerCase()) {
      case 'document': return '📄';
      case 'policy': return '📑';
      case 'reports': return '📑';
      case 'training materials': return '📑';
      case 'system link': return '🖥️';
      case 'useful link': return '🔗';
      default: return '📦';
    }
  }
  visColor(v: string) { return this.visColors[v] || this.visColors['Other'] || '#6b7280'; }
  accentForType(type?: string) {
    const c = this.typeColors[type ?? 'Other'] || '#6b7280';
    return c + '22';
  }

  /** Use parent resolver if provided; otherwise return the raw value (or null). */
  // hrefFor(u: string | null | undefined): string | null {
  //   return this.resolveUrl ? this.resolveUrl(u) : (u ?? null);
  // }

  hrefFor(u: string | null | undefined): string | null {
    return this.rs.resolveUrl(u); // <-- uses your existing ResourcesService implementation
  }
}
