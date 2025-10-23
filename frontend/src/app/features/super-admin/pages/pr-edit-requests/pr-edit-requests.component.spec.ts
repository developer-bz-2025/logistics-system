import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrEditRequestsComponent } from './pr-edit-requests.component';

describe('PrEditRequestsComponent', () => {
  let component: PrEditRequestsComponent;
  let fixture: ComponentFixture<PrEditRequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrEditRequestsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrEditRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
