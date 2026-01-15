import {Component, EventEmitter, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';

@Component({
  selector: 'app-doctoral-activity',
  imports: [CommonModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './doctoral-activity.component.html',
  styleUrl: './doctoral-activity.component.css',
  standalone: true
})
export class DoctoralActivityComponent {
  @Output() close = new EventEmitter<void>();
}
