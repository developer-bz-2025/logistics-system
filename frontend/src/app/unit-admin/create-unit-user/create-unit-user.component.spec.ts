import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateUnitUserComponent } from './create-unit-user.component';

describe('CreateUnitUserComponent', () => {
  let component: CreateUnitUserComponent;
  let fixture: ComponentFixture<CreateUnitUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateUnitUserComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateUnitUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
