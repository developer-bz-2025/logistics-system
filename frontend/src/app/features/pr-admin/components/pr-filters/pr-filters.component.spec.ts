import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrFiltersComponent } from './pr-filters.component';

describe('PrFiltersComponent', () => {
  let component: PrFiltersComponent;
  let fixture: ComponentFixture<PrFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrFiltersComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
