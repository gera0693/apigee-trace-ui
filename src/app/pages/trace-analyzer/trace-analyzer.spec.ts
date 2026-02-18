import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TraceAnalyzer } from './trace-analyzer';

describe('TraceAnalyzer', () => {
  let component: TraceAnalyzer;
  let fixture: ComponentFixture<TraceAnalyzer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TraceAnalyzer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TraceAnalyzer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
