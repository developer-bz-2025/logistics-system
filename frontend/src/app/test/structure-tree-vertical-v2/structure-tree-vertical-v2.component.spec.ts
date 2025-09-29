import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StructureTreeVerticalV2Component } from './structure-tree-vertical-v2.component';

describe('StructureTreeVerticalV2Component', () => {
  let component: StructureTreeVerticalV2Component;
  let fixture: ComponentFixture<StructureTreeVerticalV2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StructureTreeVerticalV2Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StructureTreeVerticalV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
