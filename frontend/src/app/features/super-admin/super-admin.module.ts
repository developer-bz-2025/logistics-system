import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrEditRequestsComponent } from './pages/pr-edit-requests/pr-edit-requests.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SuperAdminRoutingModule } from './super-admin-routing.module';
import { PrEditRequestDetailsComponent } from './pages/pr-edit-request-details/pr-edit-request-details.component';
import { LogAdminAssignmentsComponent } from './pages/log-admin-assignments/log-admin-assignments.component';
import { MaterialModule } from 'src/app/material.module';

@NgModule({
  declarations: [
    PrEditRequestsComponent,
    PrEditRequestDetailsComponent,
    LogAdminAssignmentsComponent,
  ],
  imports: [
    CommonModule,
    SuperAdminRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
  ],
})
export class SuperAdminModule {}
