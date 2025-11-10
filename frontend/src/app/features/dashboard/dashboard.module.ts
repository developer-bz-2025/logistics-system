import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardCardsComponent } from './components/dashboard-cards/dashboard-cards.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { LocationCategoryChartComponent } from './components/location-category-chart/location-category-chart.component';

@NgModule({
  declarations: [
    DashboardCardsComponent,
    DashboardComponent,
    LocationCategoryChartComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgApexchartsModule,
    MatProgressSpinnerModule,
    DashboardRoutingModule
  ]
})
export class DashboardModule { }
