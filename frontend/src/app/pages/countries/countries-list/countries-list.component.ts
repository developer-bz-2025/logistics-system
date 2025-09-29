import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CountryService } from 'src/app/core/services/country.service';
import { Country } from '../../../core/models/Country';
import { UnitService } from 'src/app/core/services/unit.service';


@Component({
  selector: 'app-countries-list',
  templateUrl: './countries-list.component.html',
  styleUrls: ['./countries-list.component.scss']
})
export class CountriesListComponent {

  countries: any;
  displayedColumns: string[] = ['name', 'entities'];
  dataSource: any;
  units: any;
  countryEntitiesMap: { [countryId: string]: any[] } = {};
  loading = true;

  constructor(private router: Router,
    private countryService: CountryService,
    private unitService: UnitService
  ) {
  }

  ngOnInit(): void {
    this.getUnits();
  }

  getUnits() {

    this.unitService.getUnits().subscribe({
      next: (res) => {
        console.log(res)
    this.getCountries();

        this.units = res;
      },
      error: (err) => console.error('Failed to create country:', err)
    });
  }

  attachEntitiesToCountries() {

    console.log(this.countries, this.units);
    if (!this.countries || !this.units) return;
    this.countries.forEach((country: any) => {
      // Find all entities for this country based on units
      const entities = this.units
        .filter((unit: any) => Number(unit.country.country_id) === Number(country.country_id))
        .map((unit: any) => unit.entity);
      console.log(entities);

      // Remove duplicate entities by entity_id
      country.entities = entities.filter(
        (entity: any, index: any, self: any) =>
          index === self.findIndex((e: any) => e.entity_id === entity.entity_id)
      );
    });
  }

  getEntitiesNames(entities: any[]): string {
  if (!entities || !entities.length) return '';
  return entities.map(e => e.entity_name).join(', ');
}

  navigateTo(path: string) {
    this.router.navigateByUrl(path);
  }

  getCountries() {
    this.loading = true;
    this.countryService.getCountries().subscribe({
      next: (res) => {
        this.loading = false;
        console.log(res)
        this.countries = res as Country[];

        this.attachEntitiesToCountries();
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to create country:', err)
      }
    });
  }
}
