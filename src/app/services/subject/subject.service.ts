import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Teacher} from '../../models/teacher.model';
import {Subject} from '../../models/subject.model';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SubjectService {

  constructor(private httpClient:HttpClient) { }

  getSubjects(): Observable<Subject[]>{
    return this.httpClient.get<Subject[]>(`${environment.apiUrl}/subjects`);
  }

  saveSubject(subject: Subject): Observable<Subject>{
    return this.httpClient.post<Subject>(`${environment.apiUrl}/subjects`, subject);
  }

  updateSubject(subject: Subject): Observable<Subject>{
    return this.httpClient.put<Subject>(`${environment.apiUrl}/subjects`, subject);
  }

  deleteSubject(id: number): Observable<any>{
    return this.httpClient.delete(`${environment.apiUrl}/subjects/`+id);
  }

  getSubjectsByYear(yearId: number): Observable<Subject[]> {
    return this.httpClient.get<Subject[]>(`${environment.apiUrl}/subjects/school-year/${yearId}`);
  }


}
