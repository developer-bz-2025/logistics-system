import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyAssetsComponent } from './my-assets.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('MyAssetsComponent', () => {
  let component: MyAssetsComponent;
  let fixture: ComponentFixture<MyAssetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MyAssetsComponent],
      imports: [ReactiveFormsModule, MaterialModule, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(MyAssetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

