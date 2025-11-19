import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Hoardings } from './hoardings';

describe('Hoardings', () => {
  let component: Hoardings;
  let fixture: ComponentFixture<Hoardings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Hoardings]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Hoardings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
