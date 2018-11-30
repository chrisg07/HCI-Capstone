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
  private statePath;
  private virginia;
  public countiesList = [];
  public stateWidth;
  public stateHeight;
  private resizeTimeout;
  private oranges = ['#feedde', '#fdd0a2', '#fdae6b', '#fd8d3c', '#f16913', '#d94801', '#8c2d04'];
  private downloadSpeedColor = d3.scaleLinear<string, number>() // why <string, number> is required in that order I'm not sure
    .domain([3, 4.75, 6.5, 8.25, 10, 11.75, 13.5])
    .range(this.oranges);
  private percentHouseholdsColor = d3.scaleLinear<string, number>() // why <string, number> is required in that order I'm not sure
    .domain([30, 40, 50, 60, 70, 80, 90])
    .range(this.oranges);
  private populationColor = d3.scaleLinear<string, number>() // why <string, number> is required in that order I'm not sure
    .domain([30, 40, 50, 60, 70, 80, 90])
    .range(this.oranges);
  private percentHouseholdsWithInternetOver200kpbs = [];
  private legend;
  public testString = 'string';
  private currentStateMap: string = 'percentHouseholds';

  @HostListener('window:resize')
    onWindowResize() {
        // debounce resize, wait for resize to finish before doing stuff
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = setTimeout((() => {
          this.updateStateMap();
        }).bind(this), 500);
    }
  constructor() { }

  ngOnInit() {
    this.getRatioData();
    this.statePath = d3.geoPath().projection(this.stateProjection);
    this.createTooltip();
  }

  ngAfterViewInit() {
    this.updateStateMap();
  }

  private getMapData() {
    d3.json('../../assets/va-counties.json').then((value) => {
      this.virginia = value;
    });
  }

  private getRatioData() {
    d3.json('../../assets/percentHouseholdsWithInternetOver200kbps.json').then(value => {
      let minPop = 100000000;
      let maxPop = 0;
      for (const county of Object.entries(value)) {
        this.percentHouseholdsWithInternetOver200kpbs[county[1]['countyname']] = {
          downloadSpeed: county[1]['downloadSpeed'],
          ratio: county[1]['ratio'],
          population: county[1]['population'] };
        if (maxPop < county[1]['population']) {
          maxPop = county[1]['population'] 
        }
        if (minPop > county[1]['population']) {
          minPop = county[1]['population'] 
        }
      }
      console.log('max pop: ' + maxPop);
      console.log('min pop: ' + minPop);
      // load TopoJSON data
      d3.json('../../assets/va-counties.json').then((response) => {
        this.virginia = response;
        this.updateStateMap();
      });
    });
  }

  /**
   * Draw a map from TopoJSON data with the average download speed data as tooltips and legend
   * @param state the TopoJSON to draw
   */
  private drawDownloadSpeedStateMap(state) {
    this.clearStateMap();
    const ratioData = this.percentHouseholdsWithInternetOver200kpbs;
    const colorFunction = this.downloadSpeedColor;
    this.stateSVG = d3.select('.Virginia')
      .append('svg')
      .attr('class', 'VirginiaMap')
      .attr('width', this.stateWidth)
      .attr('height', this.stateHeight);
    // this.createLegend();
    const stateOutline = topojson.feature(state, state.objects.states);
    this.stateProjection = d3.geoIdentity()
        .reflectY(true)
        .fitSize([this.stateWidth, this.stateHeight], stateOutline);
    this.statePath = d3.geoPath().projection(this.stateProjection);
    this.stateSVG.append('path')
      .datum(stateOutline)
      .attr('class', 'state')
      .attr('d', this.statePath)
      .attr('fill', function() {
        return colorFunction(12.31);
      })
      .attr('stroke', '#000');
    const countyHouseholdData = this.percentHouseholdsWithInternetOver200kpbs;
    this.stateSVG.selectAll('path')
      .data(topojson.feature(state, state.objects.counties)['features'])
      .enter()
      .append('path')
      .on('mouseover', function() {
        const countyName = d3.select(this)['_groups'][0][0]['__data__']['properties']['name'];
        const countyData = countyHouseholdData[countyName].downloadSpeed;
        d3.select('.tooltip').transition()
          .duration(200)
          .style('opacity', 0.9);
        d3.select('.tooltip').html(countyName + '<br>' + countyData + ' mbps')
          .style('left', d3.event.pageX + 25 + 'px')
          .style('top', d3.event.pageY - 25 + 'px');
      })
      .on('mousemove', function() {
        d3.select('.tooltip').style('top', (d3.event.pageY - 25) + 'px')
          .style('left', (d3.event.pageX + 25) + 'px');
      })
      .on('mouseout', function() {
        d3.select('.tooltip').transition()
          .duration(200)
          .style('opacity', 0);
      })
      .attr('class', 'county-border')
      .attr('d', this.statePath)
      .attr('fill', function() {
        const countyName = d3.select(this)['_groups'][0][0]['__data__']['properties']['name'];
        return colorFunction(ratioData[countyName].downloadSpeed);
      })
      .attr('stroke', '#000')
      .attr('stroke-width', '1.01px')
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round');
  }

  /**
   * Draw a map from TopoJSON data with percent household accessibilty data as tooltips and legend
   * @param state the TopoJSON to draw
   */
  private drawPercentHouseholdsStateMap(state) {
    this.clearStateMap();
    const ratioData = this.percentHouseholdsWithInternetOver200kpbs;
    const colorFunction = this.percentHouseholdsColor;
    this.stateSVG = d3.select('.Virginia')
      .append('svg')
      .attr('class', 'VirginiaMap')
      .attr('width', this.stateWidth)
      .attr('height', this.stateHeight);
    // this.createLegend();
    const stateOutline = topojson.feature(state, state.objects.states);
    this.stateProjection = d3.geoIdentity()
        .reflectY(true)
        .fitSize([this.stateWidth, this.stateHeight], stateOutline);
    this.statePath = d3.geoPath().projection(this.stateProjection);
    this.stateSVG.append('path')
      .datum(stateOutline)
      .attr('class', 'state')
      .attr('d', this.statePath)
      .attr('fill', function() {
        return colorFunction(0.7 * 100);
      })
      .attr('stroke', '#000');
    const countyHouseholdData = this.percentHouseholdsWithInternetOver200kpbs;
    this.stateSVG.selectAll('path')
      .data(topojson.feature(state, state.objects.counties)['features'])
      .enter()
      .append('path')
      .on('mouseover', function() {
        const countyName = d3.select(this)['_groups'][0][0]['__data__']['properties']['name'];
        const countyData = countyHouseholdData[countyName].ratio;
        d3.select('.tooltip').transition()
          .duration(200)
          .style('opacity', 0.9);
        d3.select('.tooltip')
          .html(countyData !== -9999 
            ? countyName + '<br>' + Math.ceil(countyData * 100) + '%'
            : countyName + '<br> unavailable')
          .style('left', d3.event.pageX + 25 + 'px')
          .style('top', d3.event.pageY - 25 + 'px');
      })
      .on('mousemove', function() {
        d3.select('.tooltip').style('top', (d3.event.pageY - 25) + 'px')
          .style('left', (d3.event.pageX + 25) + 'px');
      })
      .on('mouseout', function() {
        d3.select('.tooltip').transition()
          .duration(200)
          .style('opacity', 0);
      })
      .attr('class', 'county-border')
      .attr('d', this.statePath)
      .attr('fill', function() {
        const countyName = d3.select(this)['_groups'][0][0]['__data__']['properties']['name'];
        return ratioData[countyName].ratio !== -9999
          ? colorFunction(ratioData[countyName].ratio * 100)
          : 'red';
      })
      .attr('stroke', '#000')
      .attr('stroke-width', '1.01px')
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round');
  }

  /**
   * Draw a map from TopoJSON data with population data as tooltips and legend
   * @param state the TopoJSON to draw
   */
  private drawPopulationStateMap(state) {
    this.clearStateMap();
    const ratioData = this.percentHouseholdsWithInternetOver200kpbs;
    const colorFunction = this.populationColor;
    this.stateSVG = d3.select('.Virginia')
      .append('svg')
      .attr('class', 'VirginiaMap')
      .attr('width', this.stateWidth)
      .attr('height', this.stateHeight);
    // this.createLegend();
    const stateOutline = topojson.feature(state, state.objects.states);
    this.stateProjection = d3.geoIdentity()
        .reflectY(true)
        .fitSize([this.stateWidth, this.stateHeight], stateOutline);
    this.statePath = d3.geoPath().projection(this.stateProjection);
    this.stateSVG.append('path')
      .datum(stateOutline)
      .attr('class', 'state')
      .attr('d', this.statePath)
      .attr('fill', function() {
        return colorFunction(0.7 * 100);
      })
      .attr('stroke', '#000');
    const countyHouseholdData = this.percentHouseholdsWithInternetOver200kpbs;
    this.stateSVG.selectAll('path')
      .data(topojson.feature(state, state.objects.counties)['features'])
      .enter()
      .append('path')
      .on('mouseover', function() {
        const countyName = d3.select(this)['_groups'][0][0]['__data__']['properties']['name'];
        const countyData = countyHouseholdData[countyName];
        d3.select('.tooltip').transition()
          .duration(200)
          .style('opacity', 0.9);
        d3.select('.tooltip').html(countyName + '<br>' + countyData)
          .style('left', d3.event.pageX + 25 + 'px')
          .style('top', d3.event.pageY - 25 + 'px');
      })
      .on('mousemove', function() {
        d3.select('.tooltip').style('top', (d3.event.pageY - 25) + 'px')
          .style('left', (d3.event.pageX + 25) + 'px');
      })
      .on('mouseout', function() {
        d3.select('.tooltip').transition()
          .duration(200)
          .style('opacity', 0);
      })
      .attr('class', 'county-border')
      .attr('d', this.statePath)
      .attr('fill', function() {
        const countyName = d3.select(this)['_groups'][0][0]['__data__']['properties']['name'];
        return colorFunction(ratioData[countyName]);
      })
      .attr('stroke', '#000')
      .attr('stroke-width', '1.01px')
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round');
  }

  private updateStateMap() {
    this.stateWidth = window.innerWidth * .75;
    this.stateHeight = this.stateWidth * .521;
    if (this.virginia) {
      if (this.currentStateMap === 'percentHouseholds') {
        this.drawPercentHouseholdsStateMap(this.virginia);
        this.createPercentHouseholdsLegend();
      } else if (this.currentStateMap === 'downloadSpeed') {
        this.drawDownloadSpeedStateMap(this.virginia);
        this.createDownloadSpeedLegend();
      } else { // population map
        this.drawPopulationStateMap(this.virginia);
        this.createPopulationLegend();
      }
    }
  }

  private clearStateMap() {
    d3.select('.VirginiaMap').remove();
  }

  private createTooltip() {
    d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('opacity', '0')
      .style('background', '#fff')
      .style('font', '16px sans-serif')
      .style('height', '44px')
      .style('border-radius', '6px')
      .style('padding', '0 5px')
      .style('text-align', 'center')
      .style('line-height', '22px');
  }

  private createDownloadSpeedLegend() {
    this.legend = this.stateSVG.selectAll('rect')
      .data([3, 4.75, 6.5, 8.25, 10, 11.75, 13.5])
      .enter()
      .append('rect')
      .attr('width', 20)
      .attr('height', 20)
      .attr('y', (d, i) => {
        return (i % 10 * 20) + 25;
      })
      .attr('x', (d, i) => {
        return Math.floor(10);
      })
      .attr('fill', (d) => {
        return this.downloadSpeedColor(d);
      });
    this.stateSVG.selectAll('text')
      .data([3, 4.75, 6.5, 8.25, 10, 11.75, 13.5])
      .enter()
      .append('text')
      .attr('y', (d, i) => {
        return (i % 10 * 20) + 40;
      })
      .attr('x', 40)
      .text((d, i) => {
        return  d + ' - ' + (d + 2) + ' mbps';
      });
    this.stateSVG
      .append('text')
      .attr('x', 10)
      .attr('y', 15)
      .text('Average Download Speed in mbps');
    this.stateSVG
      .append('rect')
      .attr('width', 20)
      .attr('height', 140)
      .attr('x', 10)
      .attr('y', 25)
      .attr('stroke', 'black')
      .style('stroke-width', 2)
      .style('fill', 'none');
  }

  private createPopulationLegend() {
    this.legend = this.stateSVG.selectAll('rect')
      .data([3, 4.75, 6.5, 8.25, 10, 11.75, 13.5])
      .enter()
      .append('rect')
      .attr('width', 20)
      .attr('height', 20)
      .attr('y', (d, i) => {
        return (i % 10 * 20) + 25;
      })
      .attr('x', (d, i) => {
        return Math.floor(10);
      })
      .attr('fill', (d) => {
        return this.downloadSpeedColor(d);
      });
    this.stateSVG.selectAll('text')
      .data([3, 4.75, 6.5, 8.25, 10, 11.75, 13.5])
      .enter()
      .append('text')
      .attr('y', (d, i) => {
        return (i % 10 * 20) + 40;
      })
      .attr('x', 40)
      .text((d, i) => {
        return  d + ' - ' + (d + 2) + ' mbps';
      });
    this.stateSVG
      .append('text')
      .attr('x', 10)
      .attr('y', 15)
      .text('Average Download Speed in mbps');
    this.stateSVG
      .append('rect')
      .attr('width', 20)
      .attr('height', 140)
      .attr('x', 10)
      .attr('y', 25)
      .attr('stroke', 'black')
      .style('stroke-width', 2)
      .style('fill', 'none');
  }

  private createPercentHouseholdsLegend() {
    this.legend = this.stateSVG.selectAll('rect')
      .data([30, 40, 50, 60, 70, 80, 90])
      .enter()
      .append('rect')
      .attr('width', 20)
      .attr('height', 20)
      .attr('y', (d, i) => {
        return (i % 10 * 20) + 25;
      })
      .attr('x', (d, i) => {
        return Math.floor(10);
      })
      .attr('fill', (d) => {
        return this.percentHouseholdsColor(d);
      });
    this.stateSVG.selectAll('text')
      .data([31, 41, 51, 61, 71, 81, 91])
      .enter()
      .append('text')
      .attr('y', (d, i) => {
        return (i % 10 * 20) + 40;
      })
      .attr('x', 40)
      .text((d, i) => {
        return d + '% - ' + (d + 9) + '%';
      });
    this.stateSVG
      .append('text')
      .attr('x', 40)
      .attr('y', 180)
      .text('data unavailable');
    this.stateSVG
      .append('text')
      .attr('x', 10)
      .attr('y', 15)
      .text('Percent of households with internet greater than 200 kbps');
    this.stateSVG
      .append('rect')
      .attr('width', 20)
      .attr('height', 20)
      .attr('x', 10)
      .attr('y', 165)
      .style('fill', 'red');
    this.stateSVG
      .append('rect')
      .attr('width', 20)
      .attr('height', 160)
      .attr('x', 10)
      .attr('y', 25)
      .attr('stroke', 'black')
      .style('stroke-width', 2)
      .style('fill', 'none');
  }
}
