// import { NgModule } from '@angular/core';
// import { RouterModule, Routes } from '@angular/router';
// import { BlankComponent } from './layouts/blank/blank.component';
// import { FullComponent } from './layouts/full/full.component';
// import { AuthGuard } from './core/guards/auth.guard';
// import { CreateCountryComponent } from './pages/countries/create-country/create-country.component';
// import { CreateEntityComponent } from './pages/entities/create-entity/create-entity.component';
// const routes: Routes = [
//   {
//     path: '',
//     component: FullComponent,
//     children: [


//       {
//         path: '',
//         // component: FullComponent,
//         canActivate: [AuthGuard],
//         loadChildren: () =>
//           import('./pages/pages.module').then((m) => m.PagesModule),
//       },
  
      
//       {
//         path: 'ui-components',
//         loadChildren: () =>
//           import('./pages/ui-components/ui-components.module').then(
//             (m) => m.UicomponentsModule
//           ),
//       },
//       {
//         path: 'extra',
//         loadChildren: () =>
//           import('./pages/extra/extra.module').then((m) => m.ExtraModule),
//       },
//     ],
//   },
//   {
//     path: '',
//     component: BlankComponent,
//     children: [
//       {
//         path: 'authentication',
//         loadChildren: () =>
//           import('./pages/authentication/authentication.module').then(
//             (m) => m.AuthenticationModule
//           ),
//       },
//     ],
//   },
//   { path: 'unit-admin', loadChildren: () => import('./unit-admin/unit-admin.module').then(m => m.UnitAdminModule) },
//   { path: 'workspace', loadChildren: () => import('./workspace/workspace.module').then(m => m.WorkspaceModule) },
// ];

// @NgModule({
//   imports: [RouterModule.forRoot(routes)],
//   exports: [RouterModule],
// })
// export class AppRoutingModule {}
// app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleRedirectComponent } from './core/role-redirect/role-redirect.component';
import { TestComponent } from './test/test.component';
import { TreeComponent } from './test/tree/tree.component';
import {SearchResultsComponent} from './shared/search-results/search-results.component'
import { LandingGuard } from './core/guards/landing.guard';

const routes: Routes = [
  // 1) AUTH AT TOP (no guard here)
  {
    path: 'authentication',
    component: BlankComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./pages/authentication/authentication.module')
            .then(m => m.AuthenticationModule),
      },
    ],
  },

  // 2) SHELL (guarded areas)
  {
    path: '',
    component: FullComponent,
    children: [
      {
        path: 'pages',
        loadChildren: () => import('./pages/pages.module').then(m => m.PagesModule),
        canMatch: [AuthGuard],
        data: { roles: ['super_admin','c_level'] },
      },
      {
        path: 'unit-admin',
        loadChildren: () => import('./unit-admin/unit-admin.module').then(m => m.UnitAdminModule),
        canMatch: [AuthGuard],
        data: { roles: ['unit_admin','standard'] },
      },
      {
        path: 'workspace',
        loadChildren: () => import('./workspace/workspace.module').then(m => m.WorkspaceModule),
        canMatch: [AuthGuard],
        data: { roles: ['super_admin','unit_admin','standard','head_of_entity','country_dir','c_level'] },
      },
     
      // { path: '', pathMatch: 'full', redirectTo: 'workspace' }, 
      // { path: '', pathMatch: 'full', component: RoleRedirectComponent },
      { path: '', pathMatch: 'full', canActivate: [LandingGuard], component: RoleRedirectComponent },

      { path: 'test', pathMatch: 'full', component: TestComponent },
      { path: 'search', pathMatch: 'full', component: SearchResultsComponent },
      { path: 'tree', pathMatch: 'full', component: TreeComponent,  canMatch: [AuthGuard],
        data: { roles: ['super_admin','unit_admin','standard','head_of_entity','country_dir','c_level'] },
       },
    ],
  },

  // 3) Fallback
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes /*, { enableTracing: true }*/)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
