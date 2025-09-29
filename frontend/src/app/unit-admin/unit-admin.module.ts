import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UnitAdminRoutingModule } from './unit-admin-routing.module';
import { UnitAdminComponent } from './unit-admin.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MyUnitResourcesComponent } from './my-unit-resources/my-unit-resources.component';
import { UploadResourceComponent } from './upload-resource/upload-resource.component';
// import { DashboardComponent } from '../unit_admin/dashboard/dashboard.component';
import { MaterialModule } from '../material.module';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TablerIconsModule } from 'angular-tabler-icons';
import * as TablerIcons from 'angular-tabler-icons/icons';
import { UnitUserComponent } from './unit-user/unit-user.component';
import { SharedModule } from '../shared/shared.module';
import { CreateUnitUserComponent } from './create-unit-user/create-unit-user.component';

@NgModule({
  declarations: [

  
    DashboardComponent,
        MyUnitResourcesComponent,
        UploadResourceComponent,
        UnitUserComponent,
        CreateUnitUserComponent
  ],
  imports: [
    MaterialModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    SharedModule,
    UnitAdminRoutingModule,
    TablerIconsModule.pick(TablerIcons),
  ],
  exports: [TablerIconsModule]
})
export class UnitAdminModule { }
