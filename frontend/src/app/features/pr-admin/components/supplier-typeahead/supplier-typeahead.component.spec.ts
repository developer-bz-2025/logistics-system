import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplierTypeaheadComponent } from './supplier-typeahead.component';

describe('SupplierTypeaheadComponent', () => {
  let component: SupplierTypeaheadComponent;
  let fixture: ComponentFixture<SupplierTypeaheadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SupplierTypeaheadComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupplierTypeaheadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
