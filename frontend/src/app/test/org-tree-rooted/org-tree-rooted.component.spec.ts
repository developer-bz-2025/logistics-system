import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrgTreeRootedComponent } from './org-tree-rooted.component';

describe('OrgTreeRootedComponent', () => {
  let component: OrgTreeRootedComponent;
  let fixture: ComponentFixture<OrgTreeRootedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OrgTreeRootedComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrgTreeRootedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
