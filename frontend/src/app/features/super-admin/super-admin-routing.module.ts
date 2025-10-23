import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { PrEditRequestsComponent } from './pages/pr-edit-requests/pr-edit-requests.component';
import { PrEditRequestDetailsComponent } from './pages/pr-edit-request-details/pr-edit-request-details.component';



const routes: Routes = [
//   { path: '', pathMatch: 'full', redirectTo: 'pr-edit-requests' },
  { path: '',component : PrEditRequestsComponent},
  { path: ':id', component: PrEditRequestDetailsComponent },

];


@NgModule({
  declarations: [],
  imports: [
    CommonModule, RouterModule.forChild(routes)
  ],
  exports: [RouterModule] 
})
export class SuperAdminRoutingModule { }
