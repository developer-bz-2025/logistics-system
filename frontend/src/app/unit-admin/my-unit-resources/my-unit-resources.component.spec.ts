import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyUnitResourcesComponent } from './my-unit-resources.component';

describe('MyUnitResourcesComponent', () => {
  let component: MyUnitResourcesComponent;
  let fixture: ComponentFixture<MyUnitResourcesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MyUnitResourcesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyUnitResourcesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
