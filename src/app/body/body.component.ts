import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import * as topojson from 'topojson';

@Component({
  selector: 'app-body',
  templateUrl: './body.component.html',
  styleUrls: ['./body.component.scss']
})
export class BodyComponent implements OnInit {
  svg;
  myProjection;
  path;
  graticule;
  virginia;

  constructor() { }

  ngOnInit() {
    const svg = d3.select('svg');
    const myProjection = d3.geoNaturalEarth1();
    const path = d3.geoPath().projection(myProjection);
    const graticule = d3.geoGraticule();
    this.virginia = d3.json('https://unpkg.com/world-atlas@1.1.4/world/110m.json').then(() => {
      console.log(this);
    });
    this.drawMap(this.virginia);
  }

  drawMap(state) {
    const svg = d3.select('svg');

    svg.append('path')
      .datum(this.graticule)
      .attr('class', 'graticule')
      .attr('d', this.path);

    svg.append('path')
      .datum(this.graticule.outline)
      .attr('class', 'foreground')
      .attr('d', this.path);

    svg.append('g')
      .selectAll('path')
      .data(this.virginia.feature(state, state.objects.counties).features)
      .enter().append('path')
      .attr('d', this.path);
  }
}
