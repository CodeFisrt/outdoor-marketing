import { TestBed } from '@angular/core/testing';

import { Screen } from './screen';

describe('Screen', () => {
  let service: Screen;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Screen);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
