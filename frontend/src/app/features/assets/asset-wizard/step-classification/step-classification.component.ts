import { Component, Input } from '@angular/core';
import { FormGroup, FormArray } from '@angular/forms';
import { Category, SubCategory, FixedItem, DynamicAttribute } from '../../../../core/models/reference';

@Component({
  selector: 'app-step-classification',
  templateUrl: './step-classification.component.html',
  styleUrls: ['./step-classification.component.scss']
})
export class StepClassificationComponent {
  @Input() form!: FormGroup;
  @Input() categories: Category[] = [];
  @Input() subCategories: SubCategory[] = [];
  @Input() fixedItems: FixedItem[] = [];
  @Input() attributes: DynamicAttribute[] = [];
  @Input() suppliers: any[] = [];
  @Input() brands: any[] = [];
  @Input() loading: any = {};

  get attributesFormArray(): FormArray {
    return this.form.get('attributes') as FormArray;
  }

  getAttributeFormGroup(index: number): FormGroup {
    return this.attributesFormArray.at(index) as FormGroup;
  }

  getAttributeOptions(attribute: DynamicAttribute): any[] {
    return attribute.options || [];
  }
}
