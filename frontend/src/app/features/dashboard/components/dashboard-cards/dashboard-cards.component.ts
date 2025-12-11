import { Component, OnInit, AfterViewInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
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
export class DashboardCardsComponent implements OnInit, AfterViewInit {
  @ViewChildren('countElement') countElements!: QueryList<ElementRef>;

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

  ngAfterViewInit(): void {
    // Adjust font sizes after view initialization
    setTimeout(() => this.adjustFontSizes(), 100);
    
    // Adjust again after data loads
    this.countElements.changes.subscribe(() => {
      setTimeout(() => this.adjustFontSizes(), 100);
    });
  }

  private adjustFontSizes(): void {
    this.countElements.forEach((elementRef, index) => {
      const element = elementRef.nativeElement;
      const container = element.closest('.flex');
      if (!container || !element) return;

      const containerWidth = container.offsetWidth;
      const iconWidth = 56; // icon width
      const gap = 16; // gap-4 = 16px
      const margin = 8; // ml-2 = 8px
      const padding = 48; // card padding (24px each side for md:p-6)
      const safetyMargin = 5; // minimal safety margin to prevent overlap
      const availableWidth = containerWidth - iconWidth - gap - margin - padding - safetyMargin;
      
      // Start with max font size
      let fontSize = 30; // 1.875rem
      element.style.fontSize = `${fontSize}px`;
      
      // Check if text overflows - reduce gradually
      while (element.scrollWidth > availableWidth && fontSize > 12) {
        fontSize -= 0.5; // Reduce by 0.5px for finer control
        element.style.fontSize = `${fontSize}px`;
      }
    });
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
        // Adjust font sizes after data loads
        setTimeout(() => this.adjustFontSizes(), 100);
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
