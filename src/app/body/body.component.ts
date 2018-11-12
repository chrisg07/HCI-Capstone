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
  private firstCountyProjection;
  private secondCountyProjection;
  private statePath;
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
  private blues = ['#fff7fb', '#ece7f2', '#d0d1e6', '#a6bddb', '#74a9cf', '#3690c0', '#0570b0', '#045a8d', '#023858'];
  private color = d3.scaleLinear<string, number>() // why <string, number> is required in that order I'm not sure
    .domain([29, 38, 46, 54, 65, 74, 83, 92, 101])
    .range(this.blues);
  private percentHouseholdsWithInternetOver200kpbs = [];
  private percentHouseholdsWithInternetOver200kbpsLegend;

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
        this.percentHouseholdsWithInternetOver200kpbs[county[1]['countyname']] = county[1]['ratio'];
      }
      // load TopoJSON data
      d3.json('../../assets/va-counties.json').then((response) => {
        this.virginia = response;
        this.counties = this.virginia;
        this.drawMap(this.virginia);
        this.populateDropdowns();
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
        return colorFunction(0.7 * 100);
      })
      .attr('stroke', '#000');
    const firstCountyFunction = this.drawFirstCounty;
    const countyHouseholdData = this.percentHouseholdsWithInternetOver200kpbs;
    this.stateSVG.selectAll('path')
      .data(topojson.feature(state, state.objects.counties)['features'])
      .enter()
      .append('path')
      .on('mouseover', function() {
        const countyName = d3.select(this)['_groups'][0][0]['__data__']['properties']['name'];
        const countyData = countyHouseholdData[countyName] === -9999
          ? 'data unavailable' : (Math.floor(countyHouseholdData[countyName] * 100)) + '%';
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
      .on('click', function() {
        firstCountyFunction(d3.select(this)['_groups'][0][0]['__data__']['properties']['name']);
      })
      .attr('class', 'county-border')
      .attr('d', this.statePath)
      .attr('fill', function() {
        const countyName = d3.select(this)['_groups'][0][0]['__data__']['properties']['name'];
        if (ratioData[countyName] !== -9999) {
          return colorFunction(ratioData[countyName] * 100);
        } else {
          return '#000';
        }
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
        .attr('width', this.firstCountyWidth)
        .attr('height', this.firstCountyHeight);
      this.firstCountySVG.append('path')
        .datum(county)
        .attr('class', 'county')
        .attr('d', this.firstCountyPath)
        .attr('fill', '#3f51b5')
        .attr('stroke', '#3f51b5');
      d3.select('.firstCountyDataContainer')
        .append('text')
        .text('Percent of households with internet greater than 200 kbps: ' + this.percentHouseholdsWithInternetOver200kpbs[name]);
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
        .attr('width', this.secondCountyWidth)
        .attr('height', this.secondCountyHeight);
      this.secondCountySVG.append('path')
        .datum(county)
        .attr('class', 'county')
        .attr('d', this.secondCountyPath)
        .attr('fill', '#3f51b5')
        .attr('stroke', '#3f51b5');
      d3.select('.secondCountyDataContainer')
        .append('text')
        .text('Percent of households with internet greater than 200 kbps: ' + this.percentHouseholdsWithInternetOver200kpbs[name]);
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

  private clearFirstCountyDataContainer() {
    d3.select('.firstCountyDataContainer').selectAll('text').remove();
  }

  private clearSecondCounty() {
    this.secondCountySVG.remove();
  }

  private clearSecondCountyDataContainer() {
    d3.select('.secondCountyDataContainer').selectAll('text').remove();
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
      .data([29, 38, 47, 56, 65, 74, 83, 92, 101])
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
      .data([29, 38, 47, 56, 65, 74, 83, 92, 101])
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
      .attr('y', 220)
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
      .attr('y', 205)
      .style('fill', 'black');
    this.stateSVG
      .append('rect')
      .attr('width', 20)
      .attr('height', 200)
      .attr('x', 10)
      .attr('y', 25)
      .attr('stroke', 'black')
      .style('stroke-width', 2)
      .style('fill', 'none');
  }
}
