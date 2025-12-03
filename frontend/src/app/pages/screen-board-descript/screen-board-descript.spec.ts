import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScreenBoardDescript } from './screen-board-descript';

describe('ScreenBoardDescript', () => {
  let component: ScreenBoardDescript;
  let fixture: ComponentFixture<ScreenBoardDescript>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScreenBoardDescript]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScreenBoardDescript);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
