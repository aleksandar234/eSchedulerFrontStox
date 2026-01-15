import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasterActivityComponent } from './master-activity.component';

describe('MasterActivityComponent', () => {
  let component: MasterActivityComponent;
  let fixture: ComponentFixture<MasterActivityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasterActivityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MasterActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
