import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WallpaintsFrom } from './wallpaints-from';

describe('WallpaintsFrom', () => {
  let component: WallpaintsFrom;
  let fixture: ComponentFixture<WallpaintsFrom>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WallpaintsFrom]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WallpaintsFrom);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
