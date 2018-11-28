import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {catchError, map, filter } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import * as d3 from 'd3';
import * as topojson from 'topojson';

@Injectable({
  providedIn: 'root'
})
export class CountyGeometryService {

  constructor(private http: HttpClient) { }

  public getTopology(): Observable<Object> {
    return this.http.get<Object[]>('../../assets/va-counties.json')
      .pipe(
        map(data => {
          return data;
        }));
  }

  public getCounty(name: string): Observable<Object> {
    return this.http.get<Object[]>('../../assets/va-counties.json')
      .pipe(
        map(data => {
          for (const county of data['objects']['counties']['geometries']) {
            if (county.properties.name === name) {
              return county;
            }
          }
        }));
  }
}
