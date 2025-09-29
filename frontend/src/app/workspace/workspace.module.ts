import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WorkspaceRoutingModule } from './workspace-routing.module';
import { WorkspaceComponent } from './workspace.component';
import { BrowseComponent } from './browse/browse.component';
import { BrowseResourcesComponent } from './browse-resources/browse-resources.component';
import { SharedModule } from '../shared/shared.module';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { MaterialModule } from '../material.module';
import { RolePermissionsComponent } from './role-permissions/role-permissions.component';


@NgModule({
  declarations: [
    WorkspaceComponent,
    BrowseComponent,
    BrowseResourcesComponent,
    UserProfileComponent,
    RolePermissionsComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    SharedModule,
    WorkspaceRoutingModule
  ]
})
export class WorkspaceModule { }
