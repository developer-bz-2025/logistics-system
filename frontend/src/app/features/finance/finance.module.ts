import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { MatNativeDateModule } from '@angular/material/core';
import { FinanceRoutingModule } from './finance-routing.module';
import { DonorsComponent } from './pages/donors/donors.component';
import { DonorFormComponent } from './pages/donors/donor-form/donor-form.component';
import { DonorDetailComponent } from './pages/donors/donor-detail/donor-detail.component';

@NgModule({
  declarations: [
    DonorsComponent,
    DonorFormComponent,
    DonorDetailComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    MatNativeDateModule,
    FinanceRoutingModule
  ]
})
export class FinanceModule { }
