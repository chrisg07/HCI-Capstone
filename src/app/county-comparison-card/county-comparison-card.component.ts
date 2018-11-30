import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as d3 from 'd3';
import * as topojson from 'topojson';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { HostListener } from '@angular/core';


@Component({
  selector: 'app-county-comparison-card',
  templateUrl: './county-comparison-card.component.html',
  styleUrls: ['./county-comparison-card.component.scss']
})
export class CountyComparisonCardComponent implements OnInit, AfterViewInit {

  private stateProjection;
  private firstCountyProjection;
  private secondCountyProjection;
  private firstCountyPath;
  private secondCountyPath;
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
  private countyData = [];
  public testString = 'string';

  @HostListener('window:resize')
    onWindowResize() {
        // debounce resize, wait for resize to finish before doing stuff
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = setTimeout((() => {
          this.updateFirstCountyMap();
          this.updateSecondCountyMap();
        }).bind(this), 500);
    }
  constructor() { }

  ngOnInit() {
    this.getRatioData();
  }

  ngAfterViewInit() {
    this.updateFirstCountyMap();
    this.updateSecondCountyMap();
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
  }

  private getMapData() {
    d3.json('../../assets/va-counties.json').then((value) => {
      this.virginia = value;
      this.counties = value;
    });
  }

  private getRatioData() {
    d3.json('../../assets/percentHouseholdsWithInternetOver200kbps.json').then(value => {
      for (const county of Object.entries(value)) {
        this.countyData[county[1]['countyname']] = { 
          downloadSpeed: county[1]['downloadSpeed'],
          ratio: county[1]['ratio'],
          population: county[1]['population'] };
      }
      // load TopoJSON data
      d3.json('../../assets/va-counties.json').then((response) => {
        this.virginia = response;
        this.counties = this.virginia;
        this.populateDropdowns();
      });
    });
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
      this.clearFirstCountyDataContainer();
      this.counties.objects.counties = this.firstCounty;
      const county = topojson.feature(this.counties, this.counties.objects.counties);
      this.firstCountyProjection = d3.geoIdentity()
        .reflectY(true)
        .fitSize([this.firstCountyWidth, this.firstCountyHeight], county);
      this.firstCountyPath = d3.geoPath().projection(this.firstCountyProjection);
      this.firstCountySVG = d3.select('.firstCountyContainer')
        .append('svg')
        .attr('class', 'firstCounty')
        .attr('width', this.firstCountyWidth + 20)
        .attr('height', this.firstCountyHeight + 20);
      this.firstCountySVG.append('path')
        .datum(county)
        .attr('class', 'county')
        .attr('d', this.firstCountyPath)
        .attr('fill', '#d94801')
        .attr('stroke', '#000');
      d3.select('.firstCountyDataContainer')
        .append('html')
        .html( 
        this.countyData[name].ratio == '-9999' 
          ? 'Percent of households with internet greater than 200 kbps: ' + 'no data available<br>'
          : 'Percent of households with internet greater than 200 kbps: ' + Math.ceil(this.countyData[name].ratio * 100) + '%<br>');
      d3.select('.firstCountyDataContainer')
        .append('html')
        .html('Average download speed: ' + this.countyData[name].downloadSpeed + ' mbps<br>');
      d3.select('.firstCountyDataContainer')
        .append('html')
        .html('Population: ' + this.countyData[name].population + '<br>');
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
      this.clearSecondCountyDataContainer();
      this.counties.objects.counties = this.secondCounty;
      const county = topojson.feature(this.counties, this.counties.objects.counties);
      this.secondCountyProjection = d3.geoIdentity()
        .reflectY(true)
        .fitSize([this.secondCountyWidth, this.secondCountyHeight], county);
      this.secondCountyPath = d3.geoPath().projection(this.secondCountyProjection);
      this.secondCountySVG = d3.select('.secondCountyContainer')
        .append('svg')
        .attr('class', 'secondCounty')
        .attr('width', this.secondCountyWidth + 20)
        .attr('height', this.secondCountyHeight + 20);
      this.secondCountySVG.append('path')
        .datum(county)
        .attr('class', 'county')
        .attr('d', this.secondCountyPath)
        .attr('fill', '#d94801')
        .attr('stroke', '#000');
      d3.select('.secondCountyDataContainer')
        .append('html')
        .html( 
        this.countyData[name].ratio == '-9999' 
          ? 'Percent of households with internet greater than 200 kbps: ' + 'no data available<br>'
          : 'Percent of households with internet greater than 200 kbps: ' + Math.ceil(this.countyData[name].ratio * 100) + '%<br>');
      d3.select('.secondCountyDataContainer')
        .append('html')
        .html('Average download speed: ' + this.countyData[name].downloadSpeed + ' mbps<br>');
      d3.select('.secondCountyDataContainer')
        .append('html')
        .html('Population: ' + this.countyData[name].population + '<br>');
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

  private clearFirstCounty() {
    this.firstCountySVG.remove();
  }

  private clearFirstCountyDataContainer() {
    d3.select('.firstCountyDataContainer').selectAll('html').remove();
  }

  private clearSecondCounty() {
    this.secondCountySVG.remove();
  }

  private clearSecondCountyDataContainer() {
    d3.select('.secondCountyDataContainer').selectAll('html').remove();
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
  
