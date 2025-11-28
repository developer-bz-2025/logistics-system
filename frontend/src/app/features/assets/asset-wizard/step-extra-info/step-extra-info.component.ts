import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-step-extra-info',
  templateUrl: './step-extra-info.component.html',
  styleUrls: ['./step-extra-info.component.scss']
})
export class StepExtraInfoComponent {
  @Input() form!: FormGroup;
  @Input() photoPreviewUrl: string | null = null;
  @Output() photoChange = new EventEmitter<File | null>();

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0] ? input.files[0] : null;
    this.photoChange.emit(file);
    if (input) {
      input.value = '';
    }
  }

  clearPhoto(): void {
    this.photoChange.emit(null);
  }
}
