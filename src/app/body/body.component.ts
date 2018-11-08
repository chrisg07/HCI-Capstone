import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as d3 from 'd3';
import * as topojson from 'topojson';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-body',
  templateUrl: './body.component.html',
  styleUrls: ['./body.component.scss']
})
export class BodyComponent implements OnInit, AfterViewInit {

  private stateSVG;
  private stateProjection;
  private countyProjection;
  private statePath;
  private countyPath;
  private virginia;
  private counties;
  public countiesList = [];
  public stateWidth;
  public stateHeight;
  private currentFirstCountyName: string;
  private firstCountySVG;
  private firstCounty;
  public firstCountyWidth;
  public firstCountyHeight;
  public firstCountyControl = new FormControl();
  private firstCountyOptions: string[] = new Array<string>();
  public firstCountyFilteredOptions: Observable<string[]>;
  private currentSecondCountyName: string;
  private secondCountySVG;
  private secondCounty;
  public secondCountyWidth;
  public secondCountyHeight;
  public secondCountyControl = new FormControl();
  private secondCountyOptions: string[] = new Array<string>();
  public secondCountyFilteredOptions: Observable<string[]>;
  private resizeTimeout;

  @HostListener('window:resize')
    onWindowResize() {
        // debounce resize, wait for resize to finish before doing stuff
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = setTimeout((() => {
          this.updateStateMap();
          this.updateFirstCountyMap();
          this.updateSecondCountyMap();
        }).bind(this), 500);
    }
  constructor() { }

  ngOnInit() {
    this.firstCountySVG = d3.select('.firstCountyContainer')
      .append('svg')
      .attr('class', 'firstCounty')
      .attr('width', this.firstCountyWidth)
      .attr('height', this.firstCountyHeight);

    this.secondCountySVG = d3.select('.secondCountyContainer')
      .append('svg')
      .attr('class', 'secondCounty')
      .attr('width', this.secondCountyWidth)
      .attr('height', this.secondCountyHeight);
    this.statePath = d3.geoPath().projection(this.stateProjection);
    // load TopoJSON data
    d3.json('../../assets/va-counties.json').then((value) => {
      this.virginia = value;
      this.counties = this.virginia;
      this.drawMap(this.virginia);
      this.populateDropdowns();
    });
  }

  ngAfterViewInit() {
    this.updateStateMap();
    this.updateFirstCountyMap();
    this.updateSecondCountyMap();
  }

  private getMapData() {
    d3.json('../../assets/va-counties.json').then((value) => {
      this.virginia = value;
      this.counties = value;
    });
  }
  /**
   * Draw a map from TopoJSON data
   * @param state the TopoJSON to draw
   */
  private drawMap(state) {
    this.clearStateMap();
    this.stateSVG = d3.select('.Virginia')
      .append('svg')
      .attr('class', 'VirginiaMap')
      .attr('width', this.stateWidth)
      .attr('height', this.stateHeight);

    const stateOutline = topojson.feature(state, state.objects.states);
    this.stateProjection = d3.geoIdentity()
        .reflectY(true)
        .fitSize([this.stateWidth, this.stateHeight], stateOutline);
    this.statePath = d3.geoPath().projection(this.stateProjection);
    this.stateSVG.append('path')
      .datum(stateOutline)
      .attr('class', 'state')
      .attr('d', this.statePath)
      .attr('fill', '#ccc');
    this.stateSVG.append('path')
      .datum(topojson.mesh(state, state.objects.counties, function(a, b) {
        return a !== b; }))
      .attr('class', 'county-border')
      .attr('d', this.statePath)
      .attr('fill', 'none')
      .attr('stroke', '#fff')
      .attr('stroke-width', '1.01px')
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round');
  }

  private updateStateMap() {
    this.stateWidth = window.innerWidth * .75;
    this.stateHeight = this.stateWidth * .521;
    if (this.virginia) {
      this.drawMap(this.virginia);
    }
  }

  private buildCountiesList(state) {
    for (const county of state.objects.counties.geometries) {
      this.countiesList[county.properties.name] = county;
    }
  }

  private findCounty(name: string): Object {
    for (const county of this.virginia.objects.counties.geometries) {
      if (county.properties.name === name) {
        return county;
      }
    }
    return null;
  }

  private drawFirstCounty(name: string) {
    this.firstCounty = this.findCounty(name);
    if (this.firstCounty) {
      this.currentFirstCountyName = name;
      this.clearFirstCounty();
      this.counties.objects.counties = this.firstCounty;
      const county = topojson.feature(this.counties, this.counties.objects.counties);
      this.countyProjection = d3.geoIdentity()
        .reflectY(true)
        .fitSize([this.firstCountyWidth, this.firstCountyHeight], county);
      this.countyPath = d3.geoPath().projection(this.countyProjection);
      this.firstCountySVG = d3.select('.firstCountyContainer')
        .append('svg')
        .attr('class', 'firstCounty')
        .attr('width', this.firstCountyWidth)
        .attr('height', this.firstCountyHeight);
      this.firstCountySVG.append('path')
        .datum(county)
        .attr('class', 'county')
        .attr('d', this.countyPath)
        .attr('fill', '#ccc')
        .attr('stroke', '#ccc');
    } else {
      this.currentFirstCountyName = null;
    }
    // reinstates this.virginia so the geometries can be searched through again
    // work around for the data being consumed for some reason I don't fully understand
    this.getMapData();
  }

  private updateFirstCountyMap() {
    this.firstCountyWidth = (window.innerWidth - 150) * .25;
    this.firstCountyHeight = this.firstCountyWidth * .5;
    if (this.currentFirstCountyName) {
      this.drawFirstCounty(this.currentFirstCountyName);
    }
  }

  private drawSecondCounty(name: string) {
    this.secondCounty = this.findCounty(name);
    if (this.secondCounty) {
      this.currentSecondCountyName = name;
      this.clearSecondCounty();
      this.counties.objects.counties = this.secondCounty;
      const county = topojson.feature(this.counties, this.counties.objects.counties);
      this.countyProjection = d3.geoIdentity()
        .reflectY(true)
        .fitSize([this.secondCountyWidth, this.secondCountyHeight], county);
      this.countyPath = d3.geoPath().projection(this.countyProjection);
      this.secondCountySVG = d3.select('.secondCountyContainer')
        .append('svg')
        .attr('class', 'secondCounty')
        .attr('width', this.secondCountyWidth)
        .attr('height', this.secondCountyHeight);
      this.secondCountySVG.append('path')
        .datum(county)
        .attr('class', 'county')
        .attr('d', this.countyPath)
        .attr('fill', '#ccc')
        .attr('stroke', '#ccc');
    } else {
      this.currentSecondCountyName = null;
    }
    // reinstates this.virginia so the geometries can be searched through again
    // work around for the data being consumed for some reason I don't fully understand
    this.getMapData();
  }

  private updateSecondCountyMap() {
    this.secondCountyWidth = (window.innerWidth - 150) * .25;
    this.secondCountyHeight = this.secondCountyWidth * .5;
    if (this.currentSecondCountyName) {
      this.drawSecondCounty(this.currentSecondCountyName);
    }
  }

  private clearStateMap() {
    d3.select('.VirginiaMap').remove();
  }

  private clearFirstCounty() {
    this.firstCountySVG.remove();
  }

  private clearSecondCounty() {
    this.secondCountySVG.remove();
  }

  private populateDropdowns() {
    this.buildCountiesList(this.virginia);
    this.firstCountyOptions = Object.keys(this.countiesList).sort();
    this.firstCountyFilteredOptions = this.firstCountyControl.valueChanges
    .pipe(
      startWith(''),
      map(filterValue => this._firstFilter(filterValue))
    );
    this.secondCountyOptions = Object.keys(this.countiesList).sort();
    this.secondCountyFilteredOptions = this.secondCountyControl.valueChanges
    .pipe(
      startWith(''),
      map(filterValue => this._secondFilter(filterValue))
    );
  }

  private _firstFilter(value: string): string[] {
    const filterValue = value.toLowerCase();
    const results = this.firstCountyOptions.filter(option => option.toLowerCase().includes(filterValue));
    if (results.length === 1 && results[0].toLowerCase() === filterValue) {
      this.drawFirstCounty(results[0]);
    }
    return results;
  }

  private _secondFilter(value: string): string[] {
    const filterValue = value.toLowerCase();
    const results = this.secondCountyOptions.filter(option => option.toLowerCase().includes(filterValue));
    if (results.length === 1 && results[0].toLowerCase() === filterValue) {
      this.drawSecondCounty(results[0]);
    }
    return results;
  }
}
