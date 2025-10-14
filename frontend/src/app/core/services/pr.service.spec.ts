import { TestBed } from '@angular/core/testing';

import { PrService } from './pr.service';

describe('PrService', () => {
  let service: PrService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
