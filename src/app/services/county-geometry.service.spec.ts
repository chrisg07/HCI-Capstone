import { TestBed, inject } from '@angular/core/testing';

import { CountyGeometryService } from './county-geometry.service';

describe('CountyGeometryService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CountyGeometryService]
    });
  });

  it('should be created', inject([CountyGeometryService], (service: CountyGeometryService) => {
    expect(service).toBeTruthy();
  }));
});
