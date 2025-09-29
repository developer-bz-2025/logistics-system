import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrowseResourcesComponent } from './browse-resources.component';

describe('BrowseResourcesComponent', () => {
  let component: BrowseResourcesComponent;
  let fixture: ComponentFixture<BrowseResourcesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BrowseResourcesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BrowseResourcesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
