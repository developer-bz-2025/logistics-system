import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrItemTableComponent } from './pr-item-table.component';

describe('PrItemTableComponent', () => {
  let component: PrItemTableComponent;
  let fixture: ComponentFixture<PrItemTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrItemTableComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrItemTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
