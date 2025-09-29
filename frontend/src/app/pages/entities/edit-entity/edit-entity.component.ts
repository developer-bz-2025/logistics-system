import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EntityService, EntityDto } from 'src/app/core/services/entity.service';


@Component({
  selector: 'app-edit-entity',
  templateUrl: './edit-entity.component.html',
  styleUrls: ['./edit-entity.component.scss']
})
export class EditEntityComponent {

  @Input() open = false;
  @Input() entity: EntityDto | null = null; // pass {id, entity_name, entity_description}


  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<EntityDto>();


  form!: FormGroup;
  loading = false;
  errorMessage: string | null = null;


  constructor(private fb: FormBuilder, private entityService: EntityService) { }


  ngOnInit(): void {
    this.form = this.fb.group({
      entity_name: ['', [Validators.required, Validators.maxLength(150)]],
      entity_description: ['']
    });


    if (this.entity) this.patch(this.entity);
  }


  ngOnChanges(): void {
    if (this.form && this.entity) this.patch(this.entity);
  }


  private patch(e: EntityDto) {
    console.log(e)
    this.form.reset({
      entity_name: e.entity_name || '',
      entity_description: e.entity_description || ''
    });
    this.errorMessage = null;
  }


  onCancel() {
    this.form.markAsPristine();
    this.closed.emit();
  }


  onSubmit() {
    if (!this.entity) return;
    if (this.form.invalid) return;


    const { entity_name, entity_description } = this.form.value;
    const payload: Partial<EntityDto> = { entity_name, entity_description };


    this.loading = true;
    this.errorMessage = null;


    this.entityService.editEntity(this.entity.entity_id, payload).subscribe({
      next: () => {
        this.loading = false;
        // emit merged result so parent can optimistically update list
        this.saved.emit({ ...this.entity!, ...payload } as EntityDto);
        this.closed.emit();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = 'Failed to update entity. Please try again.';
        console.error('Update entity failed', err);
      }
    });
  }

}
