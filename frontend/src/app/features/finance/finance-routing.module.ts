import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DonorsComponent } from './pages/donors/donors.component';
import { DonorDetailComponent } from './pages/donors/donor-detail/donor-detail.component';

const routes: Routes = [
  { path: '', component: DonorsComponent },
  { path: ':id', component: DonorDetailComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FinanceRoutingModule { }
