import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// icons
import { TablerIconsModule } from 'angular-tabler-icons';
import * as TablerIcons from 'angular-tabler-icons/icons';

//Import all material modules
import { MaterialModule } from './material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

//Import Layouts
import { FullComponent } from './layouts/full/full.component';
import { BlankComponent } from './layouts/blank/blank.component';

// Vertical Layout
import { SidebarComponent } from './layouts/full/sidebar/sidebar.component';
import { HeaderComponent } from './layouts/full/header/header.component';
import { BrandingComponent } from './layouts/full/sidebar/branding.component';
import { AppNavItemComponent } from './layouts/full/sidebar/nav-item/nav-item.component';


import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './core/interceptors/jwt.interceptor';
import { ConfirmDialogComponent } from './shared/confirm-dialog/confirm-dialog.component';
import { RoleRedirectComponent } from './core/role-redirect/role-redirect.component';
import { TestComponent } from './test/test.component';
import { StructureTreeVerticalComponent } from './test/structure-tree/structure-tree-vertical.component';
import { StructureMatrixComponent } from './test/structure-matrix/structure-matrix.component';
import { TreeComponent } from './test/tree/tree.component';
import { RoleLensComponent } from './test/role-lens/role-lens.component';
import { StructureTreeVerticalV2Component } from './test/structure-tree-vertical-v2/structure-tree-vertical-v2.component';
import { OrgTreeRootedComponent } from './test/org-tree-rooted/org-tree-rooted.component';
import { OrgTreeDownwardComponent } from './test/org-tree-downward/org-tree-downward.component';

@NgModule({
  declarations: [
    AppComponent,
    FullComponent,
    BlankComponent,
    SidebarComponent,
    HeaderComponent,
    BrandingComponent,
    AppNavItemComponent,
    ConfirmDialogComponent,
    RoleRedirectComponent,
    TestComponent,
    StructureTreeVerticalComponent,
    StructureMatrixComponent,
    TreeComponent,
    RoleLensComponent,
    StructureTreeVerticalV2Component,
    OrgTreeRootedComponent,
    OrgTreeDownwardComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    TablerIconsModule.pick(TablerIcons),
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  exports: [TablerIconsModule,],
  bootstrap: [AppComponent],
})

export class AppModule {}
