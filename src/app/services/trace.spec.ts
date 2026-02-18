import { TestBed } from '@angular/core/testing';

import { Trace } from './trace';

describe('Trace', () => {
  let service: Trace;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Trace);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
