import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as d3 from 'd3';
import * as topojson from 'topojson';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { HostListener } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

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
  private oranges = ['#ffffb2','#fed976','#feb24c','#fd8d3c','#fc4e2a','#e31a1c','#b10026'];
  private downloadSpeedColor = d3.scaleLinear<string, number>() // why <string, number> is required in that order I'm not sure
    .domain([3, 4.75, 6.5, 8.25, 10, 11.75, 13.5])
    .range(this.oranges);
  private percentHouseholdsColor = d3.scaleLinear<string, number>() // why <string, number> is required in that order I'm not sure
    .domain([30, 40, 50, 60, 70, 80, 90])
    .range(this.oranges);
  private populationColor = d3.scaleLinear<string, number>() // why <string, number> is required in that order I'm not sure
    .domain([0, 175000, 350000, 525000, 700000, 875000, 1050000])
    .range(this.oranges);
  private percentRuralColor = d3.scaleLinear<string, number>() // why <string, number> is required in that order I'm not sure
    .domain([0, 15, 30, 45, 60, 75, 90])
    .range(this.oranges);
  private percentHouseholdsWithInternetOver200kpbs = [];
  private legend;
  private currentStateMap: string = 'percentHouseholds';

  @HostListener('window:resize')
    onWindowResize() {
        // debounce resize, wait for resize to finish before doing stuff
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = setTimeout((() => {
          this.updateStateMap(this.currentStateMap);
        }).bind(this), 500);
    }
  constructor() { }

  ngOnInit() {
    this.getRatioData();
    this.statePath = d3.geoPath().projection(this.stateProjection);
    this.createTooltip();
  }

  ngAfterViewInit() {
    this.updateStateMap(this.currentStateMap);
  }

  private getMapData() {
    d3.json('../../assets/va-counties.json').then((value) => {
      this.virginia = value;
    });
  }

  private getRatioData() {
    d3.json('../../assets/percentHouseholdsWithInternetOver200kbps.json').then(value => {
      let minPop = 100;
      let maxPop = 0;
      for (const county of Object.entries(value)) {
        this.percentHouseholdsWithInternetOver200kpbs[county[1]['countyname']] = {
          downloadSpeed: county[1]['downloadSpeed'],
          ratio: county[1]['ratio'],
          population: county[1]['population'],
          percentRural: county[1]['percentageRural'] 
        };
        if (maxPop < county[1]['percentageRural']) {
          maxPop = county[1]['percentageRural']
        }
        if (minPop > county[1]['percentageRural']) {
          minPop = county[1]['percentageRural']
        }
      }
      console.log('max pop: ' + maxPop);
      console.log('min pop: ' + minPop);
      // load TopoJSON data
      d3.json('../../assets/va-counties.json').then((response) => {
        this.virginia = response;
        this.updateStateMap(this.currentStateMap);
      });
    });
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
          : 'gray';
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
        return colorFunction(59209);
      })
      .attr('stroke', '#000');
    const countyHouseholdData = this.percentHouseholdsWithInternetOver200kpbs;
    this.stateSVG.selectAll('path')
      .data(topojson.feature(state, state.objects.counties)['features'])
      .enter()
      .append('path')
      .on('mouseover', function() {
        const countyName = d3.select(this)['_groups'][0][0]['__data__']['properties']['name'];
        const countyData = countyHouseholdData[countyName].population;
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
        return colorFunction(ratioData[countyName].population);
      })
      .attr('stroke', '#000')
      .attr('stroke-width', '1.01px')
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round');
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
   * Draw a map from TopoJSON data with the average download speed data as tooltips and legend
   * @param state the TopoJSON to draw
   */
  private drawPercentRuralStateMap(state) {
    this.clearStateMap();
    const ratioData = this.percentHouseholdsWithInternetOver200kpbs;
    const colorFunction = this.percentRuralColor;
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
        return colorFunction(44.8);
      })
      .attr('stroke', '#000');
    const countyHouseholdData = this.percentHouseholdsWithInternetOver200kpbs;
    this.stateSVG.selectAll('path')
      .data(topojson.feature(state, state.objects.counties)['features'])
      .enter()
      .append('path')
      .on('mouseover', function() {
        const countyName = d3.select(this)['_groups'][0][0]['__data__']['properties']['name'];
        const countyData = countyHouseholdData[countyName].percentRural;
        console.log(countyData);
        d3.select('.tooltip').transition()
          .duration(200)
          .style('opacity', 0.9);
        d3.select('.tooltip').html(countyName + '<br>' + countyData + '%')
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
        return colorFunction(ratioData[countyName].percentRural);
      })
      .attr('stroke', '#000')
      .attr('stroke-width', '1.01px')
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round');
}

  public updateStateMap(mapType: string) {
    console.log(mapType)
    this.currentStateMap = mapType;
    this.stateWidth = window.innerWidth * .75;
    this.stateHeight = this.stateWidth * .521;
    if (this.virginia) {
      if (mapType === 'percentHouseholds') {
        this.drawPercentHouseholdsStateMap(this.virginia);
        this.createPercentHouseholdsLegend();
      } else if (mapType === 'downloadSpeed') {
        this.drawDownloadSpeedStateMap(this.virginia);
        this.createDownloadSpeedLegend();
      } else if (mapType === 'population') { // population map
        this.drawPopulationStateMap(this.virginia);
        this.createPopulationLegend();
      } else if (mapType === 'percentRural') {
        console.log('drawing rural map')
        this.drawPercentRuralStateMap(this.virginia);
        this.createPercentRuralLegend();
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
      .style('fill', 'gray');
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

  private createPopulationLegend() {
    this.legend = this.stateSVG.selectAll('rect')
      .data([0, 175000, 350000, 525000, 700000, 875000, 1050000])
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
        return this.populationColor(d);
      });
    this.stateSVG.selectAll('text')
      .data([0, 150000, 300000, 450000, 600000, 750000, 900000])
      .enter()
      .append('text')
      .attr('y', (d, i) => {
        return (i % 10 * 20) + 40;
      })
      .attr('x', 40)
      .text((d, i) => {
        return d + ' - ' + (d + 175000);
      });
    this.stateSVG
      .append('text')
      .attr('x', 10)
      .attr('y', 15)
      .text('Population');
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

  private createPercentRuralLegend() {
    this.legend = this.stateSVG.selectAll('rect')
      .data([0, 15, 30, 45, 60, 75, 90])
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
        return this.percentRuralColor(d);
      });
    this.stateSVG.selectAll('text')
      .data([0, 15, 30, 45, 60, 75, 90])
      .enter()
      .append('text')
      .attr('y', (d, i) => {
        return (i % 10 * 20) + 40;
      })
      .attr('x', 40)
      .text((d, i) => {
        return d !== 90 ? d + '% - ' + (d + 15) + '%': d + '% - ' + (d + 10) + '%';;
      });
    this.stateSVG
      .append('text')
      .attr('x', 10)
      .attr('y', 15)
      .text('Percent of population who lives in a rural setting');
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
}
