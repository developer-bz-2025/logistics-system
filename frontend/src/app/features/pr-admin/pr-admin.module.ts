import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrAdminRoutingModule } from './pr-admin-routing.module';
import { PrListComponent } from './pages/pr-list/pr-list.component';
import { PrCreateComponent } from './pages/pr-create/pr-create.component';
import { PrDetailComponent } from './pages/pr-detail/pr-detail.component';
import { PrFiltersComponent } from './components/pr-filters/pr-filters.component';
import { PrItemTableComponent } from './components/pr-item-table/pr-item-table.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SupplierTypeaheadComponent } from './components/supplier-typeahead/supplier-typeahead.component';



@NgModule({
  declarations: [
    PrListComponent,
    PrCreateComponent,
    PrDetailComponent,
    PrFiltersComponent,
    PrItemTableComponent,
    SupplierTypeaheadComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PrAdminRoutingModule
  ]
})
export class PrAdminModule { }
