import {Component, EventEmitter, Output} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatOption, MatSelect} from '@angular/material/select';

@Component({
  selector: 'app-master-activity',
  imports: [CommonModule, MatFormFieldModule, MatInputModule, MatButtonModule, FormsModule, MatSelect, MatOption],
  templateUrl: './master-activity.component.html',
  styleUrl: './master-activity.component.css',
  standalone: true
})
export class MasterActivityComponent {
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  // model
  masterActivity = {
    subject: '',
    hoursHeld: null as number | null
  };

  sacuvaj() {
    if (!this.masterActivity.subject || this.masterActivity.hoursHeld == null) {
      return;
    }

    this.save.emit(this.masterActivity);
    this.close.emit();
  }
}
