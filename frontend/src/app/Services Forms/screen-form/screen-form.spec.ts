import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScreenForm } from './screen-form';

describe('ScreenForm', () => {
  let component: ScreenForm;
  let fixture: ComponentFixture<ScreenForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScreenForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScreenForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
