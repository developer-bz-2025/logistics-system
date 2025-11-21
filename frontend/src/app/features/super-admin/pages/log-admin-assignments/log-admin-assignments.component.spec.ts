import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LogAdminAssignmentsComponent } from './log-admin-assignments.component';

describe('LogAdminAssignmentsComponent', () => {
  let component: LogAdminAssignmentsComponent;
  let fixture: ComponentFixture<LogAdminAssignmentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LogAdminAssignmentsComponent],
      imports: [
        ReactiveFormsModule,
        MatAutocompleteModule,
        BrowserAnimationsModule,
        HttpClientTestingModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LogAdminAssignmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

