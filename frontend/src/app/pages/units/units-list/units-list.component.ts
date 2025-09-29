import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UnitService } from 'src/app/core/services/unit.service';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-units-list',
  templateUrl: './units-list.component.html',
  styleUrls: ['./units-list.component.scss']
})
export class UnitsListComponent {

  displayedColumns: string[] = ['name', 'entities', 'docs'];
  allUnits: any[] = []; // Store all units
  displayedUnits: any[] = []; // Units to display on current page
  loading = true;
  
  Math = Math;
  // Pagination properties
  totalUnits = 0;
  pageSize = 5;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25, 50];

  constructor(
    private router: Router,
    private unitService: UnitService
  ) {}

  ngOnInit(): void {
    this.getUnits();
  }

  getUnits(): void { 
    this.loading = true;
    this.unitService.getUnits().subscribe({
      next: (res:any) => {
        console.log(res);
        this.allUnits = res;
        this.totalUnits = res.length;
        this.applyPagination();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to fetch units:', err);
      }
    });
  }

  // Handle page changes
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.applyPagination();
  }

  // Apply client-side pagination
  private applyPagination(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedUnits = this.allUnits.slice(startIndex, endIndex);
  }
}