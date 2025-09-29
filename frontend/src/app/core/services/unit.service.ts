import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UnitService {

  private readonly apiUrl = `${environment.apiBaseUrl}/units`;


  constructor(private http:HttpClient) { }


  createUnit(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, data);
  }

  getUnits(){
    return this.http.get(`${this.apiUrl}`);
  }
}