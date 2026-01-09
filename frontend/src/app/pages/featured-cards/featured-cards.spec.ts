import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeaturedCards } from './featured-cards';

describe('FeaturedCards', () => {
  let component: FeaturedCards;
  let fixture: ComponentFixture<FeaturedCards>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeaturedCards]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FeaturedCards);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
