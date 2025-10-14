import { Component } from '@angular/core';


type Card = {
  key: 'furniture' | 'appliances' | 'machines' | 'vehicles' | 'electronics' | 'it';
  label: string;
  count: number;
  tint: 'indigo' | 'green' | 'violet' | 'orange' | 'rose' | 'teal';
};

@Component({
  selector: 'app-dashboard-cards',
  templateUrl: './dashboard-cards.component.html',
  styleUrls: ['./dashboard-cards.component.scss']
})


export class DashboardCardsComponent {

  cards: Card[] = [
    { key: 'furniture',  label: 'Furniture',    count: 1247, tint: 'indigo' },
    { key: 'appliances', label: 'Appliances',   count: 892,  tint: 'green'  },
    { key: 'machines',   label: 'Machines',     count: 456,  tint: 'violet' },
    { key: 'vehicles',   label: 'Vehicles',     count: 9,    tint: 'orange' },
    { key: 'electronics',label: 'Electronics',  count: 634,  tint: 'rose'   },
    { key: 'it',         label: 'IT Equipment', count: 1123, tint: 'teal'   },
  ];

  // Tailwind color classes for the icon pill
  tintClass(t: 'indigo'|'green'|'violet'|'orange'|'rose'|'teal') {
    return {
      indigo: { bg: 'bg-indigo-50', ring: 'ring-indigo-100', text: 'text-indigo-600' },
      green:  { bg: 'bg-green-50',  ring: 'ring-green-100',  text: 'text-green-600'  },
      violet: { bg: 'bg-violet-50', ring: 'ring-violet-100', text: 'text-violet-600' },
      orange: { bg: 'bg-orange-50', ring: 'ring-orange-100', text: 'text-orange-600' },
      rose:   { bg: 'bg-rose-50',   ring: 'ring-rose-100',   text: 'text-rose-600'   },
      teal:   { bg: 'bg-teal-50',   ring: 'ring-teal-100',   text: 'text-teal-600'   },
    }[t];
  }

}
