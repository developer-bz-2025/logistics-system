import { Component, OnInit } from '@angular/core';
import { AssetService } from 'src/app/core/services/category.service';

type Card = {
  key: 'furniture' | 'appliances' | 'machine' | 'vehicle' | 'electronics' | 'it' | 'computer';
  label: string;
  count: number;
  tint: 'indigo' | 'green' | 'violet' | 'orange' | 'rose' | 'teal' | 'cyan';
};

@Component({
  selector: 'app-dashboard-cards',
  templateUrl: './dashboard-cards.component.html',
  styleUrls: ['./dashboard-cards.component.scss']
})
export class DashboardCardsComponent implements OnInit {

  cards: Card[] = [
    { key: 'furniture',  label: 'Furniture',    count: 0, tint: 'indigo' },
    { key: 'appliances', label: 'Appliances',   count: 0,  tint: 'green'  },
    { key: 'machine',   label: 'Machines',     count: 0,  tint: 'violet' },
    { key: 'vehicle',   label: 'Vehicles',     count: 0,    tint: 'orange' },
    { key: 'electronics',label: 'Electronics',  count: 0,  tint: 'rose'   },
    { key: 'computer',  label: 'Computers',    count: 0,  tint: 'cyan'   },
    { key: 'it',         label: 'IT Equipment', count: 0, tint: 'teal'   },
  ];

  isLoading = true;

  constructor(private assetService: AssetService) {}

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  private loadDashboardStats(): void {
    this.isLoading = true;
    this.assetService.getDashboardStats().subscribe({
      next: (response: any) => {
        const stats = response.data || response;

        // Update card counts based on API response
        this.cards.forEach(card => {
          // Try different possible key formats from API
          const count = stats[card.key] ||
                       stats[card.key.replace('_', ' ')] ||
                       stats[card.label.toLowerCase()] ||
                       stats[card.label.toLowerCase().replace(' ', '_')] ||
                       0;
          card.count = count;
        });

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load dashboard stats:', error);
        this.isLoading = false;
        // Keep default counts of 0 on error
      }
    });
  }

  // Tailwind color classes for the icon pill
  tintClass(t: 'indigo'|'green'|'violet'|'orange'|'rose'|'teal'|'cyan') {
    return {
      indigo: { bg: 'bg-indigo-50', ring: 'ring-indigo-100', text: 'text-indigo-600' },
      green:  { bg: 'bg-green-50',  ring: 'ring-green-100',  text: 'text-green-600'  },
      violet: { bg: 'bg-violet-50', ring: 'ring-violet-100', text: 'text-violet-600' },
      orange: { bg: 'bg-orange-50', ring: 'ring-orange-100', text: 'text-orange-600' },
      rose:   { bg: 'bg-rose-50',   ring: 'ring-rose-100',   text: 'text-rose-600'   },
      teal:   { bg: 'bg-teal-50',   ring: 'ring-teal-100',   text: 'text-teal-600'   },
      cyan:   { bg: 'bg-cyan-50',   ring: 'ring-cyan-100',   text: 'text-cyan-600'   },
    }[t];
  }

}
