import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OurWork } from './our-work';

describe('OurWork', () => {
  let component: OurWork;
  let fixture: ComponentFixture<OurWork>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OurWork]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OurWork);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
