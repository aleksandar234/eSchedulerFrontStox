import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Distribution} from '../../models/distribution.model';
import {standardUser} from '../../models/standardUser.model';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DistributionService {

  constructor(private httpClient:HttpClient) { }

  getDistributions(): Observable<Distribution[]>{
    return this.getDistributionsByYear(3);
    // return this.httpClient.get<Distribution[]>(`${environment.apiUrl}/distributions`);
  }

  getDistributionsByYear(id: Number): Observable<Distribution[]> {
    return this.httpClient.get<Distribution[]>(`${environment.apiUrl}/distributions/school-year/${id}`);
  }

  updateDistribution(distribution: Distribution): Observable<Distribution>{
    return this.httpClient.put<Distribution>(`${environment.apiUrl}/distributions`, distribution);
  }

  saveDistribution(distribution: Distribution,studyProgram:string, semester:string): Observable<Distribution>{
    return this.httpClient.post<Distribution>( `${environment.apiUrl}/distributions?studyProgram=${studyProgram}&semester=${semester}`,
      distribution);
  }

  deleteDistribution(id: number): Observable<any>{
    return this.httpClient.delete(`${environment.apiUrl}/distributions/` + id);
  }

  getStandardUser(email: String): Observable<standardUser[]>{
    return this.httpClient.get<standardUser[]>(`${environment.apiUrl}/distributions/` +email);
  }


  importDistributions(json: any): Observable<string> {
    return this.httpClient.post(`${environment.apiUrl}/distributions/import`, json, {
      responseType: 'text'
    });
  }

  getStandardUserByYear(email: string, schoolYearId: number): Observable<standardUser[]> {
    return this.httpClient.get<standardUser[]>(
      `${environment.apiUrl}/distributions/${email}/school-year/${schoolYearId}`
    );
  }

}
