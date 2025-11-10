import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-step-extra-info',
  templateUrl: './step-extra-info.component.html',
  styleUrls: ['./step-extra-info.component.scss']
})
export class StepExtraInfoComponent {
  @Input() form!: FormGroup;
}
