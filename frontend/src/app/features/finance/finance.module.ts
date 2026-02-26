import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { MatNativeDateModule } from '@angular/material/core';
import { FinanceRoutingModule } from './finance-routing.module';
import { DonorsComponent } from './pages/donors/donors.component';
import { DonorFormComponent } from './pages/donors/donor-form/donor-form.component';

@NgModule({
  declarations: [
    DonorsComponent,
    DonorFormComponent
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
