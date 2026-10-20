import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminIntentionsComponent } from './admin-intentions.component';

describe('AdminIntentionsComponent', () => {
  let component: AdminIntentionsComponent;
  let fixture: ComponentFixture<AdminIntentionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminIntentionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminIntentionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
