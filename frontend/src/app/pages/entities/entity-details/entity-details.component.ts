import { Component, Input } from '@angular/core';
import { EntityService } from 'src/app/core/services/entity.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-entity-details',
  templateUrl: './entity-details.component.html',
  styleUrls: ['./entity-details.component.scss']
})
export class EntityDetailsComponent {
  entityDetails: any=[];
  loading = true;
  entityId:number;
  unitSearch = '';
  @Input() units: any[] = [];


  
  constructor(private router : Router,
    private activatedRoute:ActivatedRoute,
    private entityService: EntityService
  ) {
    this.entityId = Number(this.activatedRoute.snapshot.paramMap.get('id'));  
  }

  
  addUnit() {
    // Implement unit creation logic or routing here
    console.log('Add unit clicked');
  }
  ngOnInit(): void {
    this.getentity();
  }
  navigateTo(path: string,id:number) {
    // this.router.navigateByUrl(path,id);
    this.router.navigate([path,id])
  }

  unitIconMap: { [key: string]: { icon: string; colorClass: string } } = {
    IT: { icon: 'computer', colorClass: 'bg-blue-100 text-blue-700' },
    HR: { icon: 'people', colorClass: 'bg-pink-100 text-pink-700' },
    Finance: { icon: 'account_balance', colorClass: 'bg-green-100 text-green-700' },
    communication: { icon: 'campaign', colorClass: 'bg-orange-100 text-orange-700' },
    Logistic: { icon: 'local_shipping', colorClass: 'bg-lime-100 text-lime-700' },
    Research: { icon: 'science', colorClass: 'bg-purple-100 text-purple-700' },
    'Research & Development': { icon: 'science', colorClass: 'bg-purple-100 text-purple-700' },
    Operations: { icon: 'construction', colorClass: 'bg-sky-100 text-sky-700' },
    operations: { icon: 'construction', colorClass: 'bg-sky-100 text-sky-700' },
    Grants: { icon: 'assignment_turned_in', colorClass: 'bg-emerald-100 text-emerald-700' },
    grants: { icon: 'assignment_turned_in', colorClass: 'bg-emerald-100 text-emerald-700' },
    Programs: { icon: 'workspaces', colorClass: 'bg-indigo-100 text-indigo-700' },
    Programmes: { icon: 'workspaces', colorClass: 'bg-indigo-100 text-indigo-700' },
    'Program Management': { icon: 'workspaces', colorClass: 'bg-indigo-100 text-indigo-700' },
    MEAL: { icon: 'insights', colorClass: 'bg-teal-100 text-teal-700' },
    'Monitoring & Evaluation': { icon: 'insights', colorClass: 'bg-teal-100 text-teal-700' },
    'M&E': { icon: 'insights', colorClass: 'bg-teal-100 text-teal-700' },
  
    Procurement: { icon: 'shopping_cart', colorClass: 'bg-yellow-100 text-yellow-700' },
    'Supply Chain': { icon: 'sync_alt', colorClass: 'bg-lime-100 text-lime-700' },
    Development: { icon: 'trending_up', colorClass: 'bg-amber-100 text-amber-700' },
    Protection: { icon: 'health_and_safety', colorClass: 'bg-red-100 text-red-700' },
    Livelihoods: { icon: 'trending_up', colorClass: 'bg-green-100 text-green-700' },

  };
  
  private unitSynonyms: { [canonical: string]: string[] } = {
    Programs: ['programme', 'programmes', 'program', 'projects', 'pmu', 'program management', 'grants & programs'],
    Grants: ['grant', 'sub-grants', 'sub grants', 'subawards', 'awards'],
    MEAL: ['m&e', 'monitoring and evaluation', 'monitoring & evaluation', 'mel'],
    Logistics: ['logistics', 'supply & logistics'],
    Procurement: ['purchasing', 'buying', 'tenders'],
    Administration: ['admin', 'office admin', 'office management'],
    Security: ['hss', 'safety'],
    Compliance: ['risk & compliance', 'risk'],
    Partnerships: ['partnership', 'donor relations', 'partner management'],
    Protection: ['gbv', 'child protection', 'safeguarding'],
    Health: ['medical', 'clinic', 'healthcare'],
    Livelihoods: ['economic recovery', 'early recovery', 'er'],
    'Cash Assistance': ['cva', 'cash and voucher assistance'],
    'Field Operations': ['field office', 'area office', 'base'],
    'Data & Analytics': ['analytics', 'bi', 'data'],
    Training: ['capacity building', 'learning & development', 'learning']
  };
  
  private getUnitMeta(name?: string) {
    if (!name) return { icon: 'business', colorClass: 'bg-gray-100 text-gray-700' };
  
    // Exact (case-insensitive)
    const exactKey = Object.keys(this.unitIconMap).find(k => k.toLowerCase() === name.toLowerCase());
    if (exactKey) return this.unitIconMap[exactKey];
  
    // Contains
    const lower = name.toLowerCase();
    const containsKey = Object.keys(this.unitIconMap).find(k => lower.includes(k.toLowerCase()));
    if (containsKey) return this.unitIconMap[containsKey];
  
    // Synonyms
    const synKey = Object.keys(this.unitSynonyms).find(k =>
      this.unitSynonyms[k].some(s => lower.includes(s.toLowerCase()))
    );
    if (synKey && this.unitIconMap[synKey]) return this.unitIconMap[synKey];
  
    // Fallback
    return { icon: 'business', colorClass: 'bg-gray-100 text-gray-700' };
  }
  
  getUnitIcon(name?: string)  { return this.getUnitMeta(name).icon; }
  getUnitColor(name?: string) { return this.getUnitMeta(name).colorClass; }

  // getUnitIcon(unitName: string): string {
  //   return this.unitIconMap[unitName]?.icon || 'business';
  // }
  
  // getUnitColor(unitName: string): string {
  //   return this.unitIconMap[unitName]?.colorClass || 'bg-gray-200 text-gray-600';
  // }

  getentity(){
    this.loading = true;
    this.entityService.entityDetails(this.entityId).subscribe({
      next: (res) => {console.log(res)
        this.loading = false;
        this.entityDetails = res;
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to create country:', err)
      }
    });
  }

  getCountryPill(_country: string | undefined): string {
    // Simple neutral pill; customize per country if you want
    return 'bg-gray-50 text-gray-700 border-gray-200';
  }

  get filteredUnits() {
    if (!this.entityDetails || !this.entityDetails.units) {
      return [];
    }
  
    return this.entityDetails.units.filter((unit: any) =>
      unit.unit_name?.toLowerCase().includes(this.unitSearch?.toLowerCase() || '')
    );
  }
  

}
