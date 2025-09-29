import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PagesRoutes } from './pages.routing.module';
import { MaterialModule } from '../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
// icons
import { TablerIconsModule } from 'angular-tabler-icons';
import * as TablerIcons from 'angular-tabler-icons/icons';
import { AppDashboardComponent } from './dashboard/dashboard.component';
import { CountriesListComponent } from './countries/countries-list/countries-list.component';
import { CreateEntityComponent } from './entities/create-entity/create-entity.component';
import { EntitiesListComponent } from './entities/entities-list/entities-list.component';
import { CreateCountryComponent } from './countries/create-country/create-country.component';
import { CreateUnitComponent } from './units/create-unit/create-unit.component';
import { UnitsListComponent } from './units/units-list/units-list.component';
import { CreateUserComponent } from './users/create-user/create-user.component';
import { UserListComponent } from './users/user-list/user-list.component';
import { UserManagementComponent } from './users/user-management/user-management.component';
import { EntityManagementComponent } from './entities/entity-management/entity-management.component';
import { EntityDetailsComponent } from './entities/entity-details/entity-details.component';
import { UpdateUserComponent } from './users/update-user/update-user.component';
import { SharedModule } from '../shared/shared.module';
import { EditEntityComponent } from './entities/edit-entity/edit-entity.component';


@NgModule({
  declarations: [AppDashboardComponent,CountriesListComponent, CreateEntityComponent, EntitiesListComponent,CreateCountryComponent, CreateUnitComponent, UnitsListComponent, CreateUserComponent, UserListComponent, UserManagementComponent, EntityManagementComponent, EntityDetailsComponent, UpdateUserComponent, EditEntityComponent],
  imports: [
    CommonModule,
    SharedModule,
    MaterialModule,
    ReactiveFormsModule,
    FormsModule,
    NgApexchartsModule,
    RouterModule.forChild(PagesRoutes),
    TablerIconsModule.pick(TablerIcons),
  ],
  exports: [TablerIconsModule],
})
export class PagesModule {}
