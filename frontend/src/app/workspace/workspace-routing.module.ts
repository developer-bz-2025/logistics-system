import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WorkspaceComponent } from './workspace.component';
import { BrowseComponent } from './browse/browse.component';
import { BrowseResourcesComponent } from './browse-resources/browse-resources.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { RolePermissionsComponent } from './role-permissions/role-permissions.component';

const routes: Routes = [
  // { path: '', component: WorkspaceComponent },
  { path: 'browse', component: BrowseComponent },
  { path: '', component: BrowseResourcesComponent },
  { path: 'browse-resource', component: BrowseResourcesComponent },
  { path: 'profile/:id', component: UserProfileComponent },
  { path: 'permissions', component: RolePermissionsComponent },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WorkspaceRoutingModule { }
