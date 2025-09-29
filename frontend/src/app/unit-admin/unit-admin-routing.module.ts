import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MyUnitResourcesComponent } from './my-unit-resources/my-unit-resources.component';
import { UploadResourceComponent } from './upload-resource/upload-resource.component';
import { AuthGuard } from '../core/guards/auth.guard';
import { CreateUnitUserComponent } from './create-unit-user/create-unit-user.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard', component: DashboardComponent, canMatch: [AuthGuard],
    data: { roles: ['unit_admin'] },
  },
  { path: 'my-unit-resources', component: MyUnitResourcesComponent },
  { path: 'upload-resource', component: UploadResourceComponent },
  { path: 'create-unit-user', component: CreateUnitUserComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UnitAdminRoutingModule { }
