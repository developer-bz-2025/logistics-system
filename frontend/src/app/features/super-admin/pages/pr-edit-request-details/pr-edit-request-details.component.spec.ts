import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrEditRequestDetailsComponent } from './pr-edit-request-details.component';

describe('PrEditRequestDetailsComponent', () => {
  let component: PrEditRequestDetailsComponent;
  let fixture: ComponentFixture<PrEditRequestDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrEditRequestDetailsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrEditRequestDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
