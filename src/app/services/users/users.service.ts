import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor(private httpClient:HttpClient) { }

  // getUser(email: string): Observable<ResponseDTO<String>>{
  //   const body = {email};
  //   return this.httpClient.post<ResponseDTO<String>>(`${environment.apiUrl}/users/information`, body);
  // }
  authenticateUser(idToken: string): Observable<{ token: string}> {
    console.log("Hello Aleksandar");
    return this.httpClient.post<{ token: string }>(`${environment.apiUrl}/auth/authenticate`, { idToken });
  }
}
