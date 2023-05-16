import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChronoPickerComponent } from './chrono-picker.component';

describe('ChronoPickerComponent', () => {
  let component: ChronoPickerComponent;
  let fixture: ComponentFixture<ChronoPickerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ChronoPickerComponent]
    });
    fixture = TestBed.createComponent(ChronoPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
