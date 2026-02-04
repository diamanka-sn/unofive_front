import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AbstractService } from './abstract.service';
import { catchError, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CountryService extends AbstractService<any> {
  constructor(http: HttpClient, matSnackbar: MatSnackBar) {
    super(http, matSnackbar);
  }

  getCountries(): Observable<any> {
    return this.readAll('countries');
  }
  
  uploadGeoJson(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this['http'].post(`${this.apiUrl}/countries/upload`, formData).pipe(
      catchError((error) => {
        this['handleError'](error);
        return of(null);
      })
    );
  }

//   saveGeoJsonToDatabase(chunk: any[]): Observable<any> {
//   return this['http'].post(`${this.apiUrl}/countries/sync`, chunk);
// }

  getStats(year: number, type?: string): Observable<any> {
    let params = new HttpParams().set('year', year.toString());
    
    if (type && type !== 'all') {
      params = params.set('type', type);
    }

    return this['http'].get(`${this.apiUrl}/disasters/stats`, { params }).pipe(
      catchError((error) => {
        this['handleError'](error);
        return of(null);
      })
    );
  }
  
  getCountryDetails(fid: number): Observable<any> {
    const params = new HttpParams().set('fid', fid.toString());

    return this['http'].get(`${this.apiUrl}/disasters/details`, { params }).pipe(
      catchError((error) => {
        this['handleError'](error);
        return of(null);
      })
    );
  }
}
