import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AbstractService } from './abstract.service';
import * as XLSX from 'xlsx';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AFRICA_FID_MAPPING } from '../constants/geo.constants';
@Injectable({
  providedIn: 'root'
})
export class EtlService extends AbstractService<any> {
 
private readonly COLUMN_MAPPING: any = {
    'DisNo.': 'disno',
    'Start Year': 'year',
    'ISO': 'iso',
    'Country': 'country',
    'Disaster Group': 'group',
    'Disaster Subgroup': 'subgroup',
    'Disaster Type': 'disaster_type',
    'Disaster Subtype': 'disaster_subtype',
    'Total Deaths': 'deaths',
    "Total Damage ('000 US$)": 'damage_usd',
    'No. Injured': 'injured',
    'No. Affected': 'affected',
    'No. Homeless': 'homeless',
    'Total Affected': 'total_affected',
    'CPI': 'cpi',
    'Entry Date': 'entry_date',
    'Last Update': 'last_update',
  };

  private readonly FID_MAPPING: any = {
    "SLE": 1, "GIN": 2, "LBR": 3, "CIV": 4, "MLI": 5,
    "SEN": 6, "NGA": 7, "BEN": 8, "NER": 9, "BFA": 10,
    "TGO": 11, "GHA": 12, "GNB": 13, "MRT": 14
  };
 constructor(http: HttpClient, matSnackbar: MatSnackBar) {
    super(http, matSnackbar);
  }

  processExcelImport(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const rawData: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

          const transformedData = this.transformData(rawData);
          resolve(transformedData);
        } catch (error) {
          reject("Erreur lors de la lecture du fichier Excel.");
        }
      };

      reader.onerror = () => reject("Erreur de lecture FileReader.");
      reader.readAsArrayBuffer(file);
    });
  }

  private transformData(data: any[]): any[] {
    return data.map(row => {
      const cleanedRow: any = {};

      Object.keys(this.COLUMN_MAPPING).forEach(excelKey => {
        const dbKey = this.COLUMN_MAPPING[excelKey];
        cleanedRow[dbKey] = row[excelKey] !== undefined ? row[excelKey] : null;
      });

      const numCols = ['deaths', 'damage_usd', 'injured', 'affected', 'homeless', 'total_affected', 'cpi'];
      numCols.forEach(col => {
        cleanedRow[col] = parseFloat(cleanedRow[col]) || 0;
      });

      cleanedRow['start_date'] = this.createIsoDate(row, 'Start');
      cleanedRow['end_date'] = this.createIsoDate(row, 'End');

      cleanedRow['fid'] = AFRICA_FID_MAPPING[cleanedRow['iso']] || null;

      return cleanedRow;
    }).filter(item => item.fid !== null); 
  }

  private createIsoDate(row: any, prefix: string): string | null {
    const year = row[`${prefix} Year`];
    if (!year) return null;

    const month = String(row[`${prefix} Month`] || 1).padStart(2, '0');
    const day = String(row[`${prefix} Day`] || 1).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

 
 saveToDatabase(chunk: any[]): Observable<any> {
  const body = { data: chunk };
  return this['http'].post(`${this.apiUrl}/disasters/bulk-import`, body);
}
 saveGeoJsonToDatabase(chunk: any[]): Observable<any> {
  return this['http'].post(`${this.apiUrl}/countries/sync`, chunk);
}
}
