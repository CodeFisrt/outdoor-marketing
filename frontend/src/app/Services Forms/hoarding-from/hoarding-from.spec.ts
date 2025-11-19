import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HoardingFrom } from './hoarding-from';

describe('HoardingFrom', () => {
  let component: HoardingFrom;
  let fixture: ComponentFixture<HoardingFrom>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HoardingFrom]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HoardingFrom);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
