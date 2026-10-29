import { HttpClient, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';

export interface OccsolStats {
  years: number[];
  // superficie (km²) et nombre de polygones, par année
  classes: { code: string; theme: string; areas: Record<number, number>; counts: Record<number, number> }[];
}

export interface OccsolImportJob {
  id: string;
  year: number;
  fileName: string;
  status: 'running' | 'done' | 'error';
  phase: string;
  features: number;
  logs: { time: string; message: string; type: 'info' | 'success' | 'error' }[];
  result?: { polygons: number; km2: number };
}

// Occupation du sol du Sénégal (ANAT / CSE) : tuiles vectorielles, superficies, import admin
@Injectable({ providedIn: 'root' })
export class OccsolService {
  readonly apiUrl = 'http://localhost:3000/api/senegal/occsol';

  constructor(private http: HttpClient) {}

  tileUrl(year: number): string {
    return `${this.apiUrl}/tiles/${year}/{z}/{x}/{y}.pbf`;
  }

  getStats(): Observable<OccsolStats | null> {
    return this.http.get<OccsolStats>(`${this.apiUrl}/stats`).pipe(catchError(() => of(null)));
  }

  // Envoi du GeoJSON avec suivi de la progression du téléversement
  importFile(file: File, year: number): Observable<HttpEvent<OccsolImportJob>> {
    const form = new FormData();
    form.append('year', String(year));
    form.append('file', file);
    return this.http.post<OccsolImportJob>(`${this.apiUrl}/import`, form, { reportProgress: true, observe: 'events' });
  }

  getImport(id: string): Observable<OccsolImportJob> {
    return this.http.get<OccsolImportJob>(`${this.apiUrl}/import/${id}`);
  }

  deleteYear(year: number): Observable<{ year: number; deleted: number }> {
    return this.http.delete<{ year: number; deleted: number }>(`${this.apiUrl}/years/${year}`);
  }
}
