import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CountryService } from 'src/app/core/services/country.service';
import { Country } from '../../../core/models/Country';
import { EntityService } from 'src/app/core/services/entity.service';
import { Entity } from 'src/app/core/models/Entity';
import { UnitService } from 'src/app/core/services/unit.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-create-unit',
  templateUrl: './create-unit.component.html',
  styleUrls: ['./create-unit.component.scss']
})
export class CreateUnitComponent {

  unitForm!: FormGroup;

  countries:Country[];
  entities :Entity[];
  loading = false;
  errorMessage: string | null = null;



  constructor(private fb: FormBuilder,
    private countryService: CountryService,
    private entityservice: EntityService,
    private unitService: UnitService,
    private router: Router

  ) {}

  ngOnInit(): void {
    this.unitForm = this.fb.group({
      unit_name: ['', Validators.required],
      country_id: ['', Validators.required],
      entity_id: ['', Validators.required]
    });
    this.getCountries();
    this.getEntities()
  }

  getCountries(){
    this.countryService.getCountries().subscribe({
      next: (res) => {console.log(res)
        this.countries = res as Country[];
      },
      error: (err) => console.error('Failed to fetch countries:', err)
    });
  }

  getEntities(){
    this.entityservice.getEntities().subscribe({
      next: (res)=>{
        console.log(res)
        this.entities=res as Entity[];
      },
      error: (err) => console.error('Failed to fetch entities:', err)

    })
  }

  submit() {
    if (this.unitForm.valid) {
      console.log('Form submitted:', this.unitForm.value);
      this.loading = true;
      this.unitService.createUnit(this.unitForm.value).subscribe({
        next: (res) => {
          // handle success
          this.loading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          // handle error
          this.loading = false;
          this.errorMessage = 'Failed to create unit. Please try again.';
          console.error('Failed to create entity:', err)
        }
      });
    }
  }




  
  get countryLabel(): string {
    const selectedId = Number(this.unitForm.value.country_id);
    const selectedCountry = this.countries?.find(c => c.country_id === selectedId);
    return selectedCountry ? selectedCountry.country_name : 'Not selected';
  }

  get entityLabel(): string {
    const selectedId = Number(this.unitForm.value.entity_id);
    const selectedEntity = this.entities?.find(e=> e.entity_id ===selectedId);
    return selectedEntity ? selectedEntity.entity_name : "Not Selected"
  }
  
}
