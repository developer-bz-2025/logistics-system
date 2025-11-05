// src/app/core/services/import-excel.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';


@Injectable({ providedIn: 'root' })
export class ImportExcelService {
  private base = `${environment.apiBaseUrl}`; // or environment.apiBase

  constructor(private http: HttpClient) {}

 upload(file: File, withCreds = true): Observable<HttpEvent<any>> {
    const form = new FormData();
    form.append('file', file);

    const req = new HttpRequest('POST', `${this.base}/import/assets`, form, {
      reportProgress: true,
      withCredentials: withCreds,   // A: true (cookies) | B: false (Bearer)
    });

    return this.http.request(req);
  }
}
