import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WallPainting } from './wall-painting';

describe('WallPainting', () => {
  let component: WallPainting;
  let fixture: ComponentFixture<WallPainting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WallPainting]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WallPainting);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
