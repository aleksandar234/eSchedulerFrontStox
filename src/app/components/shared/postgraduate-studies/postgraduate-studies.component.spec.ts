import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostgraduateStudiesComponent } from './postgraduate-studies.component';

describe('PostgraduateStudiesComponent', () => {
  let component: PostgraduateStudiesComponent;
  let fixture: ComponentFixture<PostgraduateStudiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostgraduateStudiesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostgraduateStudiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
