import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { LogAdminRoutingModule } from './log-admin-routing.module';
import { MyAssetsComponent } from './pages/my-assets/my-assets.component';

@NgModule({
  declarations: [MyAssetsComponent],
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, LogAdminRoutingModule],
})
export class LogAdminModule {}

