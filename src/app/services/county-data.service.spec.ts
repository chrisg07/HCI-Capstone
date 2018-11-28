import { TestBed, inject } from '@angular/core/testing';

import { CountyDataService } from './county-data.service';

describe('CountyDataService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CountyDataService]
    });
  });

  it('should be created', inject([CountyDataService], (service: CountyDataService) => {
    expect(service).toBeTruthy();
  }));
});
