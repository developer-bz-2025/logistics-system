import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MyAssetsComponent } from './pages/my-assets/my-assets.component';
import { LocationChangeRequestsComponent } from './pages/location-change-requests/location-change-requests.component';

const routes: Routes = [
  { path: '', component: MyAssetsComponent },
  { path: 'location-change-requests', component: LocationChangeRequestsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LogAdminRoutingModule {}

