import { Routes } from '@angular/router';
import { AppDashboardComponent } from './dashboard/dashboard.component';
import { CreateCountryComponent } from './countries/create-country/create-country.component';
import { AuthGuard } from '../core/guards/auth.guard';
import { CreateEntityComponent } from './entities/create-entity/create-entity.component';
import { CreateUnitComponent } from './units/create-unit/create-unit.component';
import { CreateUserComponent } from './users/create-user/create-user.component';
import { UserManagementComponent } from './users/user-management/user-management.component';
import { EntityManagementComponent } from './entities/entity-management/entity-management.component';
import { EntityDetailsComponent } from './entities/entity-details/entity-details.component';
import { UpdateUserComponent } from './users/update-user/update-user.component';

export const PagesRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: AppDashboardComponent },
  {
    path: 'countries/create',
    component: CreateCountryComponent,
    // canActivate: [AuthGuard] 
  },
  {
    path: 'entities/create',
    component: CreateEntityComponent,
    // canActivate: [AuthGuard]
  },
  {
    path: 'units/create',
    component: CreateUnitComponent,
    // canActivate: [AuthGuard]
  },
   {
    path: 'users/create',
    component: CreateUserComponent,
    // canActivate: [AuthGuard]
  },
  {
    path: 'users/user-management',
    component: UserManagementComponent,
    // canActivate: [AuthGuard]
  },
  {
    path: 'entities/entity-management',
    component: EntityManagementComponent,
    // canActivate: [AuthGuard]
  },
  {
    path: 'entities/entity-details/:id',
    component: EntityDetailsComponent,
    // canActivate: [AuthGuard]
  },
  {
    path: 'users/update-user/:id',
    component: UpdateUserComponent,
    // canActivate: [AuthGuard]
  },
];
