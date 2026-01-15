import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Teacher} from '../../models/teacher.model';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TeachersService {

  constructor(private httpClient:HttpClient) { }

  getTeachers(): Observable<Teacher[]>{
    return this.httpClient.get<Teacher[]>(`${environment.apiUrl}/teachers`);
  }
  saveTeacher(teacher: Teacher): Observable<Teacher>{
    return this.httpClient.post<Teacher>(`${environment.apiUrl}/teachers`,teacher);
  }
  updateTeacher(teacher: Teacher): Observable<Teacher>{
    return this.httpClient.put<Teacher>(`${environment.apiUrl}/teachers`,teacher);
  }

  deleteTeacher(teacherId: number): Observable<Teacher>{
    return this.httpClient.delete<Teacher>(`${environment.apiUrl}/teachers/${teacherId}`);
  }

  getTeachersByYear(year: number): Observable<Teacher[]> {
    return this.httpClient.get<Teacher[]>(`${environment.apiUrl}/teachers/school-year/${year}`)
  }

}
