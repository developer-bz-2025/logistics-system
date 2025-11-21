import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import {AssetsRoutingModule} from './assets-routing.module'
import { AssetsListComponent } from './assets-list/assets-list.component';



// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatStepperModule } from '@angular/material/stepper';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialogModule } from '@angular/material/dialog';
import { AssetDetailComponent } from './asset-detail/asset-detail.component';
import { AssetWizardComponent } from './asset-wizard/asset-wizard.component';
import { StepClassificationComponent } from './asset-wizard/step-classification/step-classification.component';
import { StepGeneralInfoComponent } from './asset-wizard/step-general-info/step-general-info.component';
import { StepAssignmentComponent } from './asset-wizard/step-assignment/step-assignment.component';
import { StepExtraInfoComponent } from './asset-wizard/step-extra-info/step-extra-info.component';
import { StepReviewComponent } from './asset-wizard/step-review/step-review.component';
import { MoveAssetDialogComponent } from './asset-detail/move-asset-dialog.component';


@NgModule({
  declarations: [
    AssetsListComponent,
    AssetDetailComponent,
    AssetWizardComponent,
    StepClassificationComponent,
    StepGeneralInfoComponent,
    StepAssignmentComponent,
    StepExtraInfoComponent,
    StepReviewComponent,
    MoveAssetDialogComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatStepperModule,
    MatAutocompleteModule,
    MatDialogModule,
    AssetsRoutingModule
  ]
})
export class AssetsModule { }
