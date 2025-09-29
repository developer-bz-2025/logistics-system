import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class CountryService {

  private readonly apiUrl = `${environment.apiBaseUrl}/countries`;

  constructor(private http:HttpClient) { }

  createCountry(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, data);
  }

  getCountries(){
    return this.http.get(`${this.apiUrl}`);
  }
}
