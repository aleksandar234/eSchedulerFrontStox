import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, Subject} from 'rxjs';
import {MasterClass} from '../../models/masterClass.model';
import * as cluster from 'node:cluster';
import {MentorCommissionModel} from '../../models/mentorCommission.model';
import {MasterDoctoralClasses} from '../../models/masterDoctoralClasses.model';

@Injectable({
  providedIn: 'root'
})
export class MasterClassService {

  private apiUrl = 'http://localhost:2525/api/master_predmeti';
  private apiUrlCommissionMentor = 'http://localhost:2525/api/commission-mentor';

  private extraMasterClasses$ = new Subject<number>()
  private extraDoctoralClasses$ = new Subject<number>()
  private mentorCommissionInfo$ = new Subject<number>()

  constructor(private http: HttpClient) { }


  // Parent se pretplacuje
  onCountChanged(): Observable<number> {
    return this.extraMasterClasses$.asObservable();
  }

  onDoctoralCountChanged(): Observable<number> {
    return this.extraDoctoralClasses$.asObservable();
  }

  onMentorCommissionChange(): Observable<number> {
    return this.mentorCommissionInfo$.asObservable();
  }

  // Child poziva kada doda novi broj
  triggerCountEvent(nastavnikid: number) {
    this.getMasterClasses(nastavnikid).subscribe(masterClasses => {
      const ukupnoCasova = masterClasses.reduce((sum, mc) => sum + mc.odrzanoCasova, 0);
      this.extraMasterClasses$.next(ukupnoCasova);
    })
  }

  triggerDoctoralCountEvent(nastavnikid: number) {
    this.getDoctoralClasses(nastavnikid).subscribe(doctoralClasses => {
      const ukupnoCasova = doctoralClasses.reduce((sum, dc) => sum + dc.odrzanoCasova, 0);
      this.extraDoctoralClasses$.next(ukupnoCasova);
    });
  }

  triggerMentorCommissionCountEvent(nastavnikId: number) {
    this.getMentorCommissionInfo(nastavnikId).subscribe(info => {
      this.mentorCommissionInfo$.next(info.length)
    })
  }

  getMasterClasses(nastavnikId: number): Observable<MasterClass[]> {
    return this.http.get<MasterClass[]>(`${this.apiUrl}/${nastavnikId}`);
  }

  getDoctoralClasses(nastavnikId: number): Observable<MasterClass[]> {
    return this.http.get<MasterClass[]>(`${this.apiUrl}/${nastavnikId}/doktorske`)
  }

  getMentorCommissionInfo(nastavnikId: number): Observable<MentorCommissionModel[]> {
    return this.http.get<MentorCommissionModel[]>(`${this.apiUrlCommissionMentor}/${nastavnikId}`)
  }

  getMentorCommissionForSY(skolskaGodinaId: number): Observable<MentorCommissionModel[]> {
    return this.http.get<MentorCommissionModel[]>(`${this.apiUrlCommissionMentor}/${skolskaGodinaId}/SY`)
  }

  getMasterDoctoralClassesByYear(skolskaGodinaId: number): Observable<MasterDoctoralClasses[]> {
    return this.http.get<MasterDoctoralClasses[]>(`${this.apiUrl}/${skolskaGodinaId}/master-doktorske`)
  }

  addMasterClass(masterClass: {
    predmetNaPostakademskimStudijama: string,
    odrzanoCasova: number,
    datumOdrzavanjaCasova: string, // YYYY-MM-DD
    nastavnikId: number,
    stepenStudija: string
  }): Observable<MasterClass> {
    console.log("Ovo mi je iz service-a:", masterClass)
    return this.http.post<MasterClass>(this.apiUrl, masterClass);
  }

  addMentorCommission(mentorCommissionActivity: {
    type: string,
    studentName: string,
    topic: string,
    degree: string,
    note: string,
    nastavnikId: number
  }): Observable<MentorCommissionModel> {
    console.log("Ovo mi je iz service-a za mentor komisiju:", mentorCommissionActivity);
    return this.http.post<MentorCommissionModel>(this.apiUrlCommissionMentor, mentorCommissionActivity)
  }



}
