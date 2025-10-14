import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { PrListComponent } from './pages/pr-list/pr-list.component';
import { PrCreateComponent } from './pages/pr-create/pr-create.component';
import { PrDetailComponent } from './pages/pr-detail/pr-detail.component';



const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'list' },
  { path: 'list', component: PrListComponent },
  { path: 'create', component: PrCreateComponent },
  { path: ':id', component: PrDetailComponent }, // view/edit details
];


@NgModule({
  declarations: [],
  imports: [
    CommonModule, RouterModule.forChild(routes)
  ],
  exports: [RouterModule] 
})
export class PrAdminRoutingModule { }
