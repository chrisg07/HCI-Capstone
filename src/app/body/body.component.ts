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
  public width = 960;
  public height = 500;
  private county1SVG;
  private county1Width = 400;
  private county1Height = 200;
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
        }).bind(this), 500);
    }
  constructor() { }

  ngOnInit() {
    this.countiesList = [];
    this.svg = d3.select('.Virginia')
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);

    this.county1SVG = d3.select('.firstCountyContainer')
      .append('svg')
      .attr('class', 'firstCounty')
      .attr('width', this.county1Width)
      .attr('height', this.county1Height);

    this.myProjection = d3.geoConicConformal()
      .parallels([38 + 2 / 60, 39 + 12 / 60])
      .rotate([78 + 30 / 60, 0])
      .scale(8000)
      .translate([0, 0]);

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
    const stateOutline = topojson.feature(state, state.objects.states);
    const counties = this.path.bounds(stateOutline);
    this.myProjection
      .translate([this.width / 2 - (counties[0][0] + counties[1][0]) / 2, this.height / 2 - (counties[0][1] + counties[1][1]) / 2]);

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
        .fitSize([this.county1Width, this.county1Height], county);

      this.countyPath = d3.geoPath().projection(this.myCountyProjection);
      this.county1SVG = d3.select('.firstCountyContainer')
        .append('svg')
        .attr('class', 'firstCounty')
        .attr('width', this.county1Width)
        .attr('height', this.county1Height);

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

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    const results = this.autocompleteOptions.filter(option => option.toLowerCase().includes(filterValue));
    if (results.length === 1 && results[0].toLowerCase() === filterValue) {
      this.drawCounty(results[0]);
    }
    return results;
  }
}
