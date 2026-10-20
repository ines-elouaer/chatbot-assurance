import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { RoleGuard } from './role.guard'; // MAJUSCULE

describe('RoleGuard', () => {
  let guard: RoleGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(RoleGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});

