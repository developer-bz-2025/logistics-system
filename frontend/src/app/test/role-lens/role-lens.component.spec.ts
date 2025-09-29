import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoleLensComponent } from './role-lens.component';

describe('RoleLensComponent', () => {
  let component: RoleLensComponent;
  let fixture: ComponentFixture<RoleLensComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RoleLensComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoleLensComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
