import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScreenBoardCardList } from './screen-board-card-list';

describe('ScreenBoardCardList', () => {
  let component: ScreenBoardCardList;
  let fixture: ComponentFixture<ScreenBoardCardList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScreenBoardCardList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScreenBoardCardList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
