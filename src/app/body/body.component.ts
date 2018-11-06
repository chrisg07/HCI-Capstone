import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import * as topojson from 'topojson';

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
  private countiesList;
  private width = 960;
  private height = 500;
  private county1SVG;
  private county1Width = 400;
  private county1Height = 200;

  constructor() { }

  ngOnInit() {
    this.countiesList = [];
    this.svg = d3.select('app-body')
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);

    this.county1SVG = d3.select('app-body')
      .append('svg')
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
      this.counties = value;
      this.virginia = value;
      this.buildCountiesList(this.virginia);
      this.drawMap(this.virginia);
    });
  }

  /**
   * Draw a map from TopoJSON data
   * @param state the TopoJSON to draw
   */
  private drawMap(state) {
    const stateOutline = topojson.feature(state, state.objects.states);
    const counties = this.path.bounds(stateOutline);
    console.log(this.counties);
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

      console.log(this.countiesList);
      this.drawCounty('Frederick County');
  }

  private buildCountiesList(state) {
    for (const county of state.objects.counties.geometries) {
      const newCounty = {[county.properties.name] : county};
      this.countiesList[county.properties.name] = county;
    }
    console.log(this.countiesList);
  }

  private drawCounty(name: string) {
    const curCounty = this.countiesList[name];
    const geoCounty = this.counties.objects.counties.geometries.filter(function(d) {
      if (d.properties.name === name) {
        return d;
      }
    });
    this.counties.objects.counties.geometries = geoCounty;
    console.log(this.virginia);
    console.log(this.counties);
    const county = topojson.feature(this.counties, this.counties.objects.counties);
    
    this.myCountyProjection = d3.geoIdentity()
      .fitSize([this.county1Width, this.county1Height], county);
      this.countyPath = d3.geoPath().projection(this.myCountyProjection);
      const bounds = this.countyPath.bounds(county);
    // console.log(geoCounty);

    console.log(county);
    console.log(bounds);

    this.county1SVG.append('path')
        .datum(county)
        .attr('class', 'county')
        .attr('d', this.countyPath)
        .attr('fill', '#ccc')
        .attr('stroke', '#ccc');
  }
}
