import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminSensiblesComponent } from './admin-sensibles.component';

describe('AdminSensiblesComponent', () => {
  let component: AdminSensiblesComponent;
  let fixture: ComponentFixture<AdminSensiblesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminSensiblesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminSensiblesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
