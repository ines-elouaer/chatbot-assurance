import { TestBed } from '@angular/core/testing';

import { IntentionService } from './intention.service';

describe('IntentionService', () => {
  let service: IntentionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IntentionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
