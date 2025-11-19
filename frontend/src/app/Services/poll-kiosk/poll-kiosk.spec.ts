import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PollKiosk } from './poll-kiosk';

describe('PollKiosk', () => {
  let component: PollKiosk;
  let fixture: ComponentFixture<PollKiosk>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PollKiosk]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PollKiosk);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
