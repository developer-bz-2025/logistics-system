import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { ReferencesRoutingModule } from './references-routing.module';
import { ReferencesComponent } from './references.component';
import { ReferenceFormDialogComponent } from './reference-form-dialog.component';

@NgModule({
  declarations: [ReferencesComponent, ReferenceFormDialogComponent],
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, ReferencesRoutingModule],
})
export class ReferencesModule {}

