import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MyAssetsComponent } from './pages/my-assets/my-assets.component';

const routes: Routes = [
  { path: '', component: MyAssetsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LogAdminRoutingModule {}

