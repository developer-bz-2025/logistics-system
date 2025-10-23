import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrEditRequestsComponent } from './pages/pr-edit-requests/pr-edit-requests.component';
import { FormsModule } from '@angular/forms';        // ⬅ add this
import { SuperAdminRoutingModule } from './super-admin-routing.module';
import { PrEditRequestDetailsComponent } from './pages/pr-edit-request-details/pr-edit-request-details.component'; // ⬅️ add this



@NgModule({
  declarations: [
    PrEditRequestsComponent,
    PrEditRequestDetailsComponent
  ],
  imports: [
    CommonModule,
    SuperAdminRoutingModule,
    FormsModule
  ]
})
export class SuperAdminModule { }
