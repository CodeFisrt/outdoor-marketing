import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DigitalScreen } from './digital-screen';

describe('DigitalScreen', () => {
  let component: DigitalScreen;
  let fixture: ComponentFixture<DigitalScreen>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DigitalScreen]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DigitalScreen);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
