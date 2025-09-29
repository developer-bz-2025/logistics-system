import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CountryService } from 'src/app/core/services/country.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-country',
  templateUrl: './create-country.component.html',
  styleUrls: ['./create-country.component.scss']
})
export class CreateCountryComponent {

  countryForm!: FormGroup;
  loading = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private countryService: CountryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.countryForm = this.fb.group({
      country_name: ['', Validators.required],
      country_description: ['']
    });
  }

  onSubmit(): void {
    if (this.countryForm.valid) {
      this.loading = true;
      this.countryService.createCountry(this.countryForm.value).subscribe({
        next: (res) => {
          // handle success
          this.loading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          // handle error
          this.loading = false;
          this.errorMessage = 'Failed to create country. Please try again.';
          console.error('Failed to create country:', err)
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/dashboard']);
  }
}
