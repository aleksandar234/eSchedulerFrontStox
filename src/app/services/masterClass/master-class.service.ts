import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {MasterClass} from '../../models/masterClass.model';

@Injectable({
  providedIn: 'root'
})
export class MasterClassService {

  private apiUrl = 'http://localhost:2525/api/master_predmeti';

  constructor(private http: HttpClient) { }

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
