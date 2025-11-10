import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { PrListItem } from '../../../../core/services/pr.service';

@Component({
  selector: 'app-step-general-info',
  templateUrl: './step-general-info.component.html',
  styleUrls: ['./step-general-info.component.scss']
})
export class StepGeneralInfoComponent {
  @Input() form!: FormGroup;
  @Input() suppliers: any[] = [];
  @Input() brands: any[] = [];
  @Input() colors: any[] = [];
  @Input() prs: PrListItem[] = [];
}
