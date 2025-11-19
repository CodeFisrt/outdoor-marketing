import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleAdsForm } from './vehicle-ads-form';

describe('VehicleAdsForm', () => {
  let component: VehicleAdsForm;
  let fixture: ComponentFixture<VehicleAdsForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleAdsForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleAdsForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
