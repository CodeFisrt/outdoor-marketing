import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScreenOwnerDashboard } from './screen-owner-dashboard';

describe('ScreenOwnerDashboard', () => {
  let component: ScreenOwnerDashboard;
  let fixture: ComponentFixture<ScreenOwnerDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScreenOwnerDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScreenOwnerDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
