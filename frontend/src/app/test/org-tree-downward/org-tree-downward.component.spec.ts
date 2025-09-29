import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrgTreeDownwardComponent } from './org-tree-downward.component';

describe('OrgTreeDownwardComponent', () => {
  let component: OrgTreeDownwardComponent;
  let fixture: ComponentFixture<OrgTreeDownwardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OrgTreeDownwardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrgTreeDownwardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
