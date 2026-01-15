import {Component, Input, OnInit} from '@angular/core';
import {MasterClassService} from '../../services/masterClass/master-class.service';
import {MasterClass} from '../../models/masterClass.model';
import {FormsModule} from '@angular/forms';
import {DatePipe, NgForOf, NgIf} from '@angular/common';
import {Observable, of, tap} from 'rxjs';
import {Modal} from 'bootstrap';

@Component({
  selector: 'app-master-class-modal',
  templateUrl: './master-class-modal.component.html',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    NgIf,
    NgForOf
  ],
  styleUrls: ['./master-class-modal.component.css']

})
export class MasterClassModalComponent {
  @Input() nastavnikId!: number; // ID nastavnika kojeg trenutno prikazuješ
  masterClasses: MasterClass[] = [];
  totalCount = 0;

  // polja za unos nove aktivnosti
  newPredmet = '';
  newCasova: number | null = null;
  newDatum = '';

  constructor(private masterClassService: MasterClassService) {}

  private calculateTotal() {
    this.totalCount = this.masterClasses.reduce(
      (sum, mc) => sum + mc.odrzanoCasova, 0
    )
  }


  // učitaj sve aktivnosti za nastavnika
  loadMasterClasses(): Observable<MasterClass[]> {
    console.log("ID nastavnika:", this.nastavnikId);

    if (!this.nastavnikId) return of([]);
    return this.masterClassService.getMasterClasses(this.nastavnikId)
      .pipe(tap(classes => {
          this.masterClasses = classes
          this.calculateTotal();
      }
      ));
  }


  // dodavanje nove aktivnosti
  addMasterClass(newActivity: any) {
    if (!newActivity.datumOdrzavanjaCasova || !newActivity.predmetNaMasterStudijama || !newActivity.odrzanoCasova) return;

    // const payload = {
    //   predmetNaMasterStudijama: newActivity.predmetNaMasterStudijama,
    //   odrzanoCasova: newActivity.odrzanoCasova,
    //   datumOdrzavanjaCasova: newActivity.datumOdrzavanjaCasova,
    //   nastavnikId: this.nastavnikId
    // };

    this.masterClassService.addMasterClass(newActivity)
      .subscribe(newClass => {
        this.masterClasses.unshift(newClass); // dodaj na vrh tabele
        // očisti formu
        this.newPredmet = '';
        this.newCasova = null;
        this.newDatum = '';
      });

    this.closeModal();

  }


  closeModal() {
    const modalEl = document.getElementById('addMasterActivityModal');
    if(modalEl) {
      const modal = Modal.getInstance(modalEl);
      modal?.hide();
    }
  }
}
