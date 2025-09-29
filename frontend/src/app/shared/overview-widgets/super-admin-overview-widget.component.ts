import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-super-admin-overview-widget',
  templateUrl: './super-admin-overview-widget.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SuperAdminOverviewWidgetComponent {
  // --- Hardcoded demo data (swap with real APIs later) ---
  kpis = [
    { label: 'Countries',  value: 7,   icon: '🌍',  bg: 'bg-green-50',   text: 'text-green-700' },
    { label: 'Entities',   value: 22,  icon: '🏛️', bg: 'bg-violet-50',  text: 'text-violet-700' },
    { label: 'Units',      value: 86,  icon: '🏢',  bg: 'bg-cyan-50',    text: 'text-cyan-700' },
    { label: 'Resources',  value: 3241,icon: '📦',  bg: 'bg-amber-50',   text: 'text-amber-700' },
    { label: 'Uploads (30d)', value: 412, icon: '⬆️', bg: 'bg-indigo-50', text: 'text-indigo-700' },
    { label: 'Active users (30d)', value: 587, icon: '🧑‍💼', bg: 'bg-slate-100', text: 'text-slate-700' },
  ];

  visMix = [
    { name: 'Global',   count: 640,  color: 'bg-amber-400'   },
    { name: 'Public',   count: 980,  color: 'bg-emerald-500' },
    { name: 'Internal', count: 1621, color: 'bg-indigo-500'  },
  ];

    // SVG constants (match your viewBox)
    private readonly W = 220;
    private readonly H = 44;
    private readonly PAD = 2;
  
    get trendPoints(): string {
      const w = this.W, h = this.H, pad = this.PAD;
      const max = Math.max(...this.trend, 1);
      const stepX = (w - pad * 2) / Math.max(this.trend.length - 1, 1);
      return this.trend
        .map((v, i) => {
          const x = pad + i * stepX;
          const y = (h - pad) - (v / max) * (h - pad * 2);
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');
    }
  
    get lastPointX(): number {
      if (!this.trend.length) return this.W / 2;
      const stepX = (this.W - this.PAD * 2) / Math.max(this.trend.length - 1, 1);
      return this.PAD + (this.trend.length - 1) * stepX;
    }
  
    get lastPointY(): number {
      if (!this.trend.length) return this.H / 2;
      const max = Math.max(...this.trend, 1);
      const v = this.trend[this.trend.length - 1];
      return (this.H - this.PAD) - (v / max) * (this.H - this.PAD * 2);
    }

  // 12-week uploads trend (dummy)
  trend: number[] = [12, 9, 15, 17, 13, 21, 19, 25, 22, 28, 24, 31];

  get visTotal(): number {
    return this.visMix.reduce((s, m) => s + m.count, 0) || 1;
  }
  pct(count: number, total: number): number {
    return Math.round((count / (total || 1)) * 100);
  }


}
