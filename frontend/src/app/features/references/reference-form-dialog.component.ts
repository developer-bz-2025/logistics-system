import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReferenceType } from './references.service';

export interface ReferenceFormDialogData {
  type: ReferenceType;
  title: string;
  item?: { id: number; name: string };
}

@Component({
  selector: 'app-reference-form-dialog',
  templateUrl: './reference-form-dialog.component.html',
  styleUrls: ['./reference-form-dialog.component.scss'],
})
export class ReferenceFormDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ReferenceFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ReferenceFormDialogData
  ) {
    this.form = this.fb.group({
      name: [data.item?.name || '', [Validators.required, Validators.maxLength(120)]],
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close({
      type: this.data.type,
      id: this.data.item?.id,
      name: this.form.value.name,
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}

