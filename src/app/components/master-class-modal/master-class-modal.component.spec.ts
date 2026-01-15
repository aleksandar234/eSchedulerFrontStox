import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasterClassModalComponent } from './master-class-modal.component';

describe('MasterClassModalComponent', () => {
  let component: MasterClassModalComponent;
  let fixture: ComponentFixture<MasterClassModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasterClassModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MasterClassModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
