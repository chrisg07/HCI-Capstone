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
  public firstCountyWidth;
  public firstCountyHeight;
  public firstCountyControl = new FormControl();
  public firstCountyFilteredOptions: Observable<string[]>;
  public secondCountyWidth;
  public secondCountyHeight;
  public secondCountyControl = new FormControl();
  public secondCountyFilteredOptions: Observable<string[]>;
  private resizeTimeout;
  private blues = ['#feedde', '#fdd0a2', '#fdae6b', '#fd8d3c', '#f16913', '#d94801', '#8c2d04'];
  private color = d3.scaleLinear<string, number>() // why <string, number> is required in that order I'm not sure
    .domain([3, 4.75, 6.5, 8.25, 10, 11.75, 13.5])
    .range(this.blues);
  private percentHouseholdsWithInternetOver200kpbs = [];
  private percentHouseholdsWithInternetOver200kbpsLegend;
  public testString = 'string';

  @HostListener('window:resize')
    onWindowResize() {
        // debounce resize, wait for resize to finish before doing stuff
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = setTimeout((() => {
          this.updateStateMap();
          this.createPercentHouseholdsLegend();
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
      let maxDownloadSpeed = 0;
      let minDownloadSpeed = 400;
      for (const county of Object.entries(value)) {
        this.percentHouseholdsWithInternetOver200kpbs[county[1]['countyname']] = county[1]['downloadSpeed'];
        if (county[1]['downloadSpeed'] > maxDownloadSpeed) {
          maxDownloadSpeed = county[1]['downloadSpeed'];
        }
        if (county[1]['downloadSpeed'] < minDownloadSpeed) {
          minDownloadSpeed = county[1]['downloadSpeed'];
        }
      }
      console.log('The highest download speed is: ' + maxDownloadSpeed);
      console.log('The lowest download speed is: ' + minDownloadSpeed);
      // load TopoJSON data
      d3.json('../../assets/va-counties.json').then((response) => {
        console.log(response);
        this.virginia = response;
        this.drawMap(this.virginia);
        this.createPercentHouseholdsLegend();
      });
    });
  }

  /**
   * Draw a map from TopoJSON data
   * @param state the TopoJSON to draw
   */
  private drawMap(state) {
    this.clearStateMap();
    const ratioData = this.percentHouseholdsWithInternetOver200kpbs;
    const colorFunction = this.color;
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

  private createPercentHouseholdsLegend() {
    this.percentHouseholdsWithInternetOver200kbpsLegend = this.stateSVG.selectAll('rect')
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
        return this.color(d);
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
}
