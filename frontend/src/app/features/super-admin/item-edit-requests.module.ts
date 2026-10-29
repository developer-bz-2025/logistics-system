import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ItemEditRequestsComponent } from './pages/item-edit-requests/item-edit-requests.component';
import { ItemEditRequestDetailsComponent } from './pages/item-edit-request-details/item-edit-request-details.component';

const routes: Routes = [
  { path: '', component: ItemEditRequestsComponent },
  { path: ':id', component: ItemEditRequestDetailsComponent },
];

@NgModule({
  declarations: [
    ItemEditRequestsComponent,
    ItemEditRequestDetailsComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
  ],
})
export class ItemEditRequestsModule {}
