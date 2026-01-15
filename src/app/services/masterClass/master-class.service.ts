import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, Subject} from 'rxjs';
import {MasterClass} from '../../models/masterClass.model';

@Injectable({
  providedIn: 'root'
})
export class MasterClassService {

  private apiUrl = 'http://localhost:2525/api/master_predmeti';

  private extraMasterClasses$ = new Subject<number>()

  constructor(private http: HttpClient) { }


  // Parent se pretplacuje
  onCountChanged(): Observable<number> {
    return this.extraMasterClasses$.asObservable();
  }

  // Child poziva kada doda novi broj
  triggerCountEvent(nastavnikid: number) {
    this.getMasterClasses(nastavnikid).subscribe(masterClasses => {
      const ukupnoCasova = masterClasses.reduce((sum, mc) => sum + mc.odrzanoCasova, 0);
      this.extraMasterClasses$.next(ukupnoCasova);
    })
  }

  getMasterClasses(nastavnikId: number): Observable<MasterClass[]> {
    return this.http.get<MasterClass[]>(`${this.apiUrl}/${nastavnikId}`);
  }

  addMasterClass(masterClass: {
    predmetNaMasterStudijama: string,
    odrzanoCasova: number,
    datumOdrzavanjaCasova: string, // YYYY-MM-DD
    nastavnikId: number
  }): Observable<MasterClass> {
    return this.http.post<MasterClass>(this.apiUrl, masterClass);
  }


}
