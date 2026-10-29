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

  // Chiffres clés de la base EM-DAT (page d'accueil)
  getSummary(): Observable<{ events: number; deaths: number; countries: number; firstYear: number; lastYear: number } | null> {
    return this['http'].get<any>(`${this.apiUrl}/disasters/summary`).pipe(catchError(() => of(null)));
  }

  // Liste légère (fid, nom, code) sans géométrie, pour la recherche
  listCountries(): Observable<{ fid: number; name: string; adm0Code: string }[]> {
    return this['http'].get<{ fid: number; name: string; adm0Code: string }[]>(`${this.apiUrl}/countries/list`).pipe(
      catchError(() => of([]))
    );
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

  // year = 'all' : cumul de toutes les années
  getStats(year: number | 'all', type?: string, group?: string): Observable<any> {
    let params = new HttpParams().set('year', year.toString());

    if (type && type !== 'all') {
      params = params.set('type', type);
    }
    if (group && group !== 'all') {
      params = params.set('group', group);
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
