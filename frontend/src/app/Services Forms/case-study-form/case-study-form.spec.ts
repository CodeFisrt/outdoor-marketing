import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaseStudyForm } from './case-study-form';

describe('CaseStudyForm', () => {
  let component: CaseStudyForm;
  let fixture: ComponentFixture<CaseStudyForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaseStudyForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CaseStudyForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
