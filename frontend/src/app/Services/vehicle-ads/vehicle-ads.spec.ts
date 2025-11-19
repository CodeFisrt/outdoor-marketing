import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleAds } from './vehicle-ads';

describe('VehicleAds', () => {
  let component: VehicleAds;
  let fixture: ComponentFixture<VehicleAds>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleAds]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleAds);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
