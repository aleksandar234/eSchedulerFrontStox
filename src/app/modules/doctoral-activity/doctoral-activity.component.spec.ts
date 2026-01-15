import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctoralActivityComponent } from './doctoral-activity.component';

describe('DoctoralActivityComponent', () => {
  let component: DoctoralActivityComponent;
  let fixture: ComponentFixture<DoctoralActivityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctoralActivityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DoctoralActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
