import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { LogAdminRoutingModule } from './log-admin-routing.module';
import { MyAssetsComponent } from './pages/my-assets/my-assets.component';
import { LocationChangeRequestsComponent } from './pages/location-change-requests/location-change-requests.component';
import { RejectDialogComponent } from './pages/location-change-requests/reject-dialog.component';

@NgModule({
  declarations: [
    MyAssetsComponent,
    LocationChangeRequestsComponent,
    RejectDialogComponent
  ],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MaterialModule, LogAdminRoutingModule],
})
export class LogAdminModule {}

