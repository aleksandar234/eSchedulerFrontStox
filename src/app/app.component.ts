import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {Modal} from 'bootstrap';
import {FormsModule} from '@angular/forms';
import {NgClass} from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule, NgClass],
  templateUrl: './app.component.html',
  standalone: true,
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'eSchedulerFront';

  confirmText = '';
  confirmInvalid = false;
  private onConfirmCallback: (() => void) | null = null;

  openConfirmModal(callback: () => void) {
    this.confirmText = '';
    this.onConfirmCallback = callback;

    const modalEl = document.getElementById('confirmEditModal');
    if (modalEl) {
      new Modal(modalEl).show();
    }
  }

  confirmEdit() {
    if (this.confirmText.toUpperCase() !== 'IZMENI') {
      this.confirmInvalid = true;
      return;
    }

    this.confirmInvalid = false;
    const modalEl = document.getElementById('confirmEditModal');
    if (modalEl) {
      Modal.getInstance(modalEl)?.hide();
    }

    this.onConfirmCallback?.();
    this.onConfirmCallback = null;
  }
}
