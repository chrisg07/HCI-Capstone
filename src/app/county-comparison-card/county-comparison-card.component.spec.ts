import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CountyComparisonCardComponent } from './county-comparison-card.component';

describe('CountyComparisonCardComponent', () => {
  let component: CountyComparisonCardComponent;
  let fixture: ComponentFixture<CountyComparisonCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CountyComparisonCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CountyComparisonCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
