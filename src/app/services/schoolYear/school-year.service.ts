import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {SchoolYear} from '../../models/schoolYear.model';
import {Distribution} from '../../models/distribution.model';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SchoolYearService {


  private selectedYearSubject = new BehaviorSubject<SchoolYear | null>(null);
  selectedYear$ = this.selectedYearSubject.asObservable();


  constructor(private httpClient:HttpClient) {
    this.initActiveYear();
  }

  private initActiveYear() {
    this.getActiveSchoolYear().subscribe({
      next: year => this.selectedYearSubject.next(year),
      error: err => console.error("Ne mogu da učitam aktivnu godinu", err)
    })
  }

  setYear(year: SchoolYear) {
    this.selectedYearSubject.next(year);
  }

  getCurrentYear(): SchoolYear | null {
    return this.selectedYearSubject.value;
  }


  getActiveSchoolYear(): Observable<SchoolYear>{
    return this.httpClient.get<SchoolYear>(`${environment.apiUrl}/schoolYear/active`);
  }


  getAllSchoolYears(): Observable<SchoolYear[]> {
    return this.httpClient.get<SchoolYear[]>(`${environment.apiUrl}/schoolYear/findAll`)
  }

  createEmptySchoolYear(newYear: any): Observable<SchoolYear> {
    console.log("Ovo mi je newYear koji saljem:", newYear);
    return this.httpClient.post<SchoolYear>(`${environment.apiUrl}/schoolYear/createEmptyYear`, newYear);
  }

  createCopiedSchoolYear(targetYear: any, sourceYearId: number): Observable<SchoolYear> {

    const body = {
      sourceYearId: sourceYearId,
      // targetYearId: targetYear.id,
      oznaka: targetYear.oznaka,
      datum_pocetka: targetYear.datum_pocetka,
      datum_zavrsetka: targetYear.datum_zavrsetka,
      aktivna: targetYear.aktivna
    }

    console.log("Ovo mi je body koji saljem:", body)

    return this.httpClient.post<SchoolYear>(`${environment.apiUrl}/distributions/copy`, body)
  }


  isSelectedYearActive(): boolean {
    const selectedYear = this.selectedYearSubject.value;
    return !!selectedYear && selectedYear.active === true;
  }

  activateSelectedYearAndDeactivateOthers(year: SchoolYear): Observable<SchoolYear> {
    console.log("YEar:", year);
    return this.httpClient.post<SchoolYear>(`${environment.apiUrl}/schoolYear/activateSelectedYear`, year);
  }



  deleteSchoolYear(id: number): Observable<any> {
    return this.httpClient.delete(`${environment.apiUrl}/schoolYear/` + id);
  }


}
