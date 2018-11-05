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
  private path;
  private virginia;
  private width = 960;
  private height = 500;

  constructor() { }

  ngOnInit() {
    this.svg = d3.select('app-body')
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);

    this.myProjection = d3.geoConicConformal()
      .parallels([38 + 2 / 60, 39 + 12 / 60])
      .rotate([78 + 30 / 60, 0])
      .scale(8000)
      .translate([0, 0]);

    this.path = d3.geoPath().projection(this.myProjection);
    // load TopoJSON data
    d3.json('../../assets/va-counties.json').then((value) => {
      this.virginia = value;
      this.drawMap(this.virginia);
    });
  }

  /**
   * Draw a map from TopoJSON data
   * @param state the TopoJSON to draw
   */
  drawMap(state) {
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
      .datum(topojson.mesh(state, state.objects.counties, function(a, b) { return a !== b; }))
      .attr('class', 'county-border')
      .attr('d', this.path)
      .attr('fill', 'none')
      .attr('stroke', '#fff')
      .attr('stroke-width', '1.01px')
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round');
    /*
    this.svg.append('g')
      .selectAll('path')
      .data(state.features.counties)
      .enter()
      .append('path')
      .attr('d', this.path)
      .style('stroke', '#fff')
      .style('stroke-width', '1');

     this.svg.selectAll('path')
      .data(this.virginia.features)
      .enter()
      .append('path')
      .attr('d', this.path)
      .style('stroke', '#fff')
      .style('stroke-width', '1');
      */
  }
}
