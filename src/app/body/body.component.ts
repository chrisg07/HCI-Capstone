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
  private color = d3.scaleLinear<string, number>() // why <string, number> is required in that order I'm not sure
    .domain([0, 100])
    .range(['#e8eaf6', '#1a237e']);
  private percentHouseholdsWithInternetOver200kpbs = [];

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

    const stateOutline = topojson.feature(state, state.objects.states);
    this.stateProjection = d3.geoIdentity()
        .reflectY(true)
        .fitSize([this.stateWidth, this.stateHeight], stateOutline);
    this.statePath = d3.geoPath().projection(this.stateProjection);
    this.stateSVG.append('path')
      .datum(stateOutline)
      .attr('class', 'state')
      .attr('d', this.statePath)
      .attr('fill', () => {
        return this.color(Math.random() * (10 - 1) + 1);
      })
      .attr('stroke', '#000');
    this.stateSVG.selectAll('path')
      .data(topojson.feature(state, state.objects.counties)['features'])
      .enter()
      .append('path')
      .on('mouseover', function() {
        const countyName = d3.select(this)['_groups'][0][0]['__data__']['properties']['name'];
        d3.select('.tooltip').transition()
          .duration(200)
          .style('opacity', 0.9);
        d3.select('.tooltip').html(countyName)
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
        console.log(d3.select(this)['_groups'][0][0]['__data__']['properties']['name']);
      })
      .attr('class', 'county-border')
      .attr('d', this.statePath)
      .attr('fill', function() {
        const countyName = d3.select(this)['_groups'][0][0]['__data__']['properties']['name'];
        if (ratioData[countyName] !== -9999) {
          return colorFunction(ratioData[countyName] * 100);
        } else {
          return colorFunction(0);
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

  private findCountyRatio(name: string) {

  }

  private drawFirstCounty(name: string) {
    this.firstCounty = this.findCounty(name);
    if (this.firstCounty) {
      this.currentFirstCountyName = name;
      this.clearFirstCounty();
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

  private clearSecondCounty() {
    this.secondCountySVG.remove();
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
      .style('height', '28px')
      .style('border-radius', '6px')
      .style('padding', '0 5px')
      .style('text-align', 'center')
      .style('line-height', '28px');
  }
}
