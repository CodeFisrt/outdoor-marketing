import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PollKisokForm } from './poll-kisok-form';

describe('PollKisokForm', () => {
  let component: PollKisokForm;
  let fixture: ComponentFixture<PollKisokForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PollKisokForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PollKisokForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
