import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AssetsListComponent } from './assets-list/assets-list.component';
import { AssetDetailComponent } from './asset-detail/asset-detail.component';
import { AssetWizardComponent } from './asset-wizard/asset-wizard.component';

const routes: Routes = [
  { path: '', component: AssetsListComponent },
  { path: 'new', component: AssetWizardComponent },
  { path: ':id', component: AssetDetailComponent },
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule, RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class AssetsRoutingModule { }
