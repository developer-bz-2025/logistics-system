import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DynamicAttribute } from '../../../../core/models/reference';

@Component({
  selector: 'app-step-review',
  templateUrl: './step-review.component.html',
  styleUrls: ['./step-review.component.scss']
})
export class StepReviewComponent {
  @Input() form!: FormGroup;
  @Input() labelMaps: any = {};
  @Input() attributes: DynamicAttribute[] = [];

  getFormValue(): any {
    return this.form.value;
  }

  getLabel(type: string, id: number): string {
    return this.labelMaps[type]?.get(id) || id?.toString() || '';
  }

  getAttributeLabel(attribute: DynamicAttribute, value: any): string {
    if (attribute.type === 'select' && attribute.options) {
      const option = attribute.options.find(opt => opt.id === value);
      return option?.value || value;
    }
    return value;
  }
}
