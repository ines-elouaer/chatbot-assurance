import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgentHistoryComponent } from './agent-history.component';

describe('AgentHistoryComponent', () => {
  let component: AgentHistoryComponent;
  let fixture: ComponentFixture<AgentHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgentHistoryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AgentHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
