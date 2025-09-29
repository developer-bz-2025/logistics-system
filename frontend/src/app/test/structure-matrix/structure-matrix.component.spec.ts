import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StructureMatrixComponent } from './structure-matrix.component';

describe('StructureMatrixComponent', () => {
  let component: StructureMatrixComponent;
  let fixture: ComponentFixture<StructureMatrixComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StructureMatrixComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StructureMatrixComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
