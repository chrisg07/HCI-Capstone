import { Component, OnInit } from '@angular/core';
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
export class BodyComponent implements OnInit {

  private svg;
  private myProjection;
  private myCountyProjection;
  private path;
  private countyPath;
  private virginia;
  private counties;
  public countiesList;
  public stateWidth = 960;
  public stateHeight = 500;
  private county1SVG;
  public firstCountyWidth;
  public firstCountyHeight;
  public myControl = new FormControl();
  private autocompleteOptions: string[] = new Array<string>();
  public filteredOptions: Observable<string[]>;
  private resizeTimeout;
  private geoCounty;

  @HostListener('window:resize')
    onWindowResize() {
        // debounce resize, wait for resize to finish before doing stuff
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = setTimeout((() => {
            console.log(window.innerWidth);
            console.log(this.firstCountyHeight);
            console.log(this.firstCountyWidth);
            this.stateWidth = window.innerWidth * .75;
            this.stateHeight = this.stateWidth * .521;
            /*
            const stateOutline = topojson.feature(this.virginia, this.virginia.objects.states);
            const counties = this.path.bounds(stateOutline);
            this.myProjection
              .translate([this.stateWidth / 2 -
                (counties[0][0] + counties[1][0]) / 2, this.stateHeight / 2 - (counties[0][1] + counties[1][1]) / 2]);
            d3.select('.Virginia')
              .attr('width', this.stateWidth)
              .attr('height', this.stateHeight);
            d3.select('.VirginiaMap')
              .attr('width', this.stateWidth)
              .attr('height', this.stateHeight);
            */
           this.drawMap(this.virginia);
        }).bind(this), 500);
    }
  constructor() { }

  ngOnInit() {
    this.countiesList = [];

    this.county1SVG = d3.select('.firstCountyContainer')
      .append('svg')
      .attr('class', 'firstCounty')
      .attr('width', this.firstCountyWidth)
      .attr('height', this.firstCountyHeight);

    this.path = d3.geoPath().projection(this.myProjection);
    // load TopoJSON data
    d3.json('../../assets/va-counties.json').then((value) => {
      this.virginia = value;
      this.counties = this.virginia;
      this.buildCountiesList(this.virginia);
      this.drawMap(this.virginia);
      this.autocompleteOptions = Object.keys(this.countiesList);
      this.filteredOptions = this.myControl.valueChanges
      .pipe(
        startWith(''),
        map(filterValue => this._filter(filterValue))
      );
    });
  }

  private getMapData() {
    d3.json('../../assets/va-counties.json').then((value) => {
      this.virginia = value;
      this.counties = this.virginia;
    });
  }
  /**
   * Draw a map from TopoJSON data
   * @param state the TopoJSON to draw
   */
  private drawMap(state) {
    this.clearStateMap();
    this.svg = d3.select('.Virginia')
      .append('svg')
      .attr('class', 'VirginiaMap')
      .attr('width', this.stateWidth)
      .attr('height', this.stateHeight);

    const stateOutline = topojson.feature(state, state.objects.states);
    const counties = this.path.bounds(stateOutline);
    this.myProjection = d3.geoIdentity()
        .reflectY(true)
        .fitSize([this.stateWidth, this.stateHeight], stateOutline);
      this.path = d3.geoPath().projection(this.myProjection);
    this.svg.append('path')
      .datum(stateOutline)
      .attr('class', 'state')
      .attr('d', this.path)
      .attr('fill', '#ccc');

    this.svg.append('path')
      .datum(topojson.mesh(state, state.objects.counties, function(a, b) {
        return a !== b; }))
      .attr('class', 'county-border')
      .attr('d', this.path)
      .attr('fill', 'none')
      .attr('stroke', '#fff')
      .attr('stroke-width', '1.01px')
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round');
  }

  private buildCountiesList(state) {
    for (const county of state.objects.counties.geometries) {
      this.countiesList[county.properties.name] = county;
    }
  }

  private drawCounty(name: string) {
    for (const county of this.virginia.objects.counties.geometries) {
      if (county.properties.name === name) {
        console.log('county found in virginia geometries');
        console.log(county);
        this.geoCounty = county;
        break;
      }
    }
    if (this.geoCounty) {
      this.clearFirstCounty();
      this.counties.objects.counties = this.geoCounty;
      console.log(this.counties);
      console.log(this.counties.objects.counties);
      const county = topojson.feature(this.counties, this.counties.objects.counties);
      this.myCountyProjection = d3.geoIdentity()
        .reflectY(true)
        .fitSize([this.firstCountyWidth, this.firstCountyHeight], county);

      this.countyPath = d3.geoPath().projection(this.myCountyProjection);
      this.county1SVG = d3.select('.firstCountyContainer')
        .append('svg')
        .attr('class', 'firstCounty')
        .attr('width', this.firstCountyWidth)
        .attr('height', this.firstCountyHeight);

      this.county1SVG.append('path')
        .datum(county)
        .attr('class', 'county')
        .attr('d', this.countyPath)
        .attr('fill', '#ccc')
        .attr('stroke', '#ccc');
    }
    // reinstates this.virginia so the geometries can be searched through again
    // work around for the data being consumed for some reason I don't fully understand
    this.getMapData();
  }

  private clearFirstCounty() {
    this.county1SVG.remove();
  }

  private clearStateMap() {
    d3.select('.VirginiaMap').remove();
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    const results = this.autocompleteOptions.filter(option => option.toLowerCase().includes(filterValue));
    if (results.length === 1 && results[0].toLowerCase() === filterValue) {
      this.drawCounty(results[0]);
    }
    return results;
  }
}
