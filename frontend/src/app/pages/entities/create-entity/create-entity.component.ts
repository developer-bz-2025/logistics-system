import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EntityService } from 'src/app/core/services/entity.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-entity',
  templateUrl: './create-entity.component.html',
  styleUrls: ['./create-entity.component.scss']
})
export class CreateEntityComponent {

  
  entityForm!: FormGroup;
  loading = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private entityService: EntityService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.entityForm = this.fb.group({
      entity_name: ['', Validators.required],
      entity_description: ['']
    });
  }

  onSubmit(): void {
    if (this.entityForm.valid) {
      this.loading = true;
      this.entityService.createEntity(this.entityForm.value).subscribe({
        next: (res) => {
          // handle success
          this.loading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          // handle error
          this.loading = false;
          this.errorMessage = 'Failed to create entity. Please try again.';
          console.error('Failed to create entity:', err)
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/dashboard']);
  }

}
