import {Component, Input, OnInit} from '@angular/core';
import {MasterClassService} from '../../services/masterClass/master-class.service';
import {MasterClass} from '../../models/masterClass.model';
import {FormsModule} from '@angular/forms';
import {DatePipe, NgForOf, NgIf} from '@angular/common';
import {Observable, of, tap} from 'rxjs';
import {Modal} from 'bootstrap';
import {MentorCommissionModel} from '../../models/mentorCommission.model';

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
  mentorCommissionClasses: MentorCommissionModel[] = [];
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

  loadMentorCommissionInfo() {
    console.log("ID nastavnika:", this.nastavnikId);
    if (!this.nastavnikId) return of([]);
    return this.masterClassService.getMentorCommissionInfo(this.nastavnikId)
      .pipe(tap(classes => {
          console.log("Mentorstvo/Komisija:", classes)
          this.mentorCommissionClasses = classes
        }
      ));
  }


  loadDoctoralClasses(): Observable<MasterClass[]> {
    console.log("ID nastavnika:", this.nastavnikId);

    if (!this.nastavnikId) return of([]);
    return this.masterClassService.getDoctoralClasses(this.nastavnikId)
      .pipe(tap(classes => {
          this.masterClasses = classes
          this.calculateTotal();
        }
      ));
  }

  // dodaj nove mentor/komisija aktivnosti
  addMentorCommissionActivity(newActivity: any) {
    if(!newActivity.studentName || !newActivity.topic || !newActivity.degree) return;

    console.log("Nova master/komisija aktivnost:", newActivity);

    this.masterClassService.addMentorCommission(newActivity)
      .subscribe(newMentorCommission => {
        this.mentorCommissionClasses.unshift(newMentorCommission); // dodaj na vrh tabele
        // očisti formu
        console.log("Mentor/Komisija:", this.mentorCommissionClasses)
      })

    this.closeDoctoralModal();


  }

  // dodavanje nove master aktivnosti
  addMasterClass(newActivity: any) {
    if (!newActivity.datumOdrzavanjaCasova || !newActivity.predmetNaPostakademskimStudijama || !newActivity.odrzanoCasova) return;

    // const payload = {
    //   predmetNaMasterStudijama: newActivity.predmetNaMasterStudijama,
    //   odrzanoCasova: newActivity.odrzanoCasova,
    //   datumOdrzavanjaCasova: newActivity.datumOdrzavanjaCasova,
    //   nastavnikId: this.nastavnikId
    // };

    console.log("Nova aktivnost:", newActivity)

    this.masterClassService.addMasterClass(newActivity)
      .subscribe(newClass => {
        this.masterClasses.unshift(newClass); // dodaj na vrh tabele
        // očisti formu
        console.log("PREDMET:", this.masterClasses)

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

  closeDoctoralModal() {
    const modalEl = document.getElementById('addDoctoralActivityModal');
    if(modalEl) {
      const modal = Modal.getInstance(modalEl);
      modal?.hide();
    }
  }


}
