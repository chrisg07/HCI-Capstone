import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {catchError, map, filter } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import * as d3 from 'd3';
import * as topojson from 'topojson';

@Injectable({
  providedIn: 'root'
})
export class CountyDataService {

  constructor(private http: HttpClient) { }

  public getCountyData(name: string): Observable<Object> {
    let retCounty = {};
    return this.http.get<Object[]>('../../assets/percentHouseholdsWithInternetOver200kbps.json')
      .pipe(
        map(data => {
          for (const county of Object.entries(data)) {
            if (county[1]['countyname'] === name) {
              retCounty = county;
              return retCounty[1];
            }
          }
        }));
  }
}
