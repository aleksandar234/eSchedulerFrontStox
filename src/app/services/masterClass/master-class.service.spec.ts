import { TestBed } from '@angular/core/testing';

import { MasterClassService } from './master-class.service';

describe('MasterClassService', () => {
  let service: MasterClassService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MasterClassService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
