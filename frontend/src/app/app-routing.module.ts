import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { AuthGuard } from './core/guards/auth.guard';
import { AppDashboardComponent } from './pages/dashboard/dashboard.component';
import { LandingGuard } from './core/guards/landing.guard';

const routes: Routes = [
  {
    path: '',
    component: FullComponent,
    children: [
      { path: '', pathMatch: 'full', canActivate: [LandingGuard], component: AppDashboardComponent },

      {
        path: 'pr',
        loadChildren: () =>
        import('./features/pr-admin/pr-admin.module').then(m => m.PrAdminModule),              
        canMatch: [AuthGuard],
        data: { roles: ['pr_admin'] }
      },
      {
        path: 'dashboard',
        loadChildren: () =>
        import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),              
        canMatch: [AuthGuard],
        data: { roles: ['log_admin','super_admin'] }
      },
      // {
      //   path: 'dashboard',
      //   loadChildren: () =>
      //     import('./pages/pages.module').then((m) => m.PagesModule),
      //   canMatch: [AuthGuard],
      // },

    ],
  },
  {
    path: '',
    component: BlankComponent,
    children: [
      {
        path: 'authentication',
        loadChildren: () =>
          import('./pages/authentication/authentication.module').then(
            (m) => m.AuthenticationModule
          ),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
