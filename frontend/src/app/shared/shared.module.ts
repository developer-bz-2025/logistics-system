import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResourceTreeComponent } from './resources-tree/resource-tree.component';
import { SuperAdminOverviewWidgetComponent } from './overview-widgets/super-admin-overview-widget.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SearchResultsComponent } from './search-results/search-results.component';


@NgModule({
  declarations: [ResourceTreeComponent,SuperAdminOverviewWidgetComponent, SearchResultsComponent],
  imports: [CommonModule,MatTooltipModule],
  exports: [ResourceTreeComponent,SuperAdminOverviewWidgetComponent,SearchResultsComponent]
})
export class SharedModule {}
