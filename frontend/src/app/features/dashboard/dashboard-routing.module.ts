import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';




const routes: Routes = [
//   { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '', component: DashboardComponent },

  {
    path: 'pr-edit-requests',
    loadChildren: () =>
    import('../super-admin/super-admin.module').then(m => m.SuperAdminModule),              
    data: { roles: ['super_admin'] }
  },


];


@NgModule({
  declarations: [],
  imports: [
    CommonModule, RouterModule.forChild(routes)
  ],
  exports: [RouterModule] 
})
export class DashboardRoutingModule {}
