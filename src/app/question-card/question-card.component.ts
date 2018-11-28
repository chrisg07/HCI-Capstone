import { Component, OnInit, Input } from '@angular/core';
import { CountyDataService } from '../services/county-data.service';
import { CountyGeometryService } from '../services/county-geometry.service';
import * as topojson from 'topojson';
import * as d3 from 'd3';

@Component({
  selector: 'app-question-card',
  templateUrl: './question-card.component.html',
  styleUrls: ['./question-card.component.scss']
})
export class QuestionCardComponent implements OnInit {
  @Input() question: string;
  @Input() leftCountyName: string;
  @Input() rightCountyName: string;
  @Input() answer: string;
  private virginia;
  private leftCountyData: Object;
  private leftCountyGeo: Object;
  private rightCountyData: Object;
  private rightCountyGeo: Object;

  constructor(
    private countyDataService: CountyDataService,
    private countyGeometryService: CountyGeometryService) { }

  ngOnInit() {
     this.countyDataService.getCountyData(this.leftCountyName).subscribe(value => {
       this.leftCountyData = value;
     });
     this.countyDataService.getCountyData(this.rightCountyName).subscribe(value => {
      this.rightCountyData = value;
    });
     this.countyGeometryService.getTopology().subscribe((value) => {
       this.virginia = value;
       this.countyGeometryService.getCounty(this.leftCountyName).subscribe((value) => {
        this.leftCountyGeo = value;
        this.drawCounty(this.leftCountyGeo, '.leftCounty');
      });
      this.countyGeometryService.getCounty(this.rightCountyName).subscribe((value) => {
        this.rightCountyGeo = value;
        this.drawCounty(this.rightCountyGeo, '.rightCounty');
      });
     });
  }

  private drawCounty(countyGeo, containerClass: string) {
    this.virginia['objects'].counties = countyGeo;
    const county = topojson.feature(this.virginia, this.virginia.objects.counties);
    const countyProjection = d3.geoIdentity()
      .reflectY(true)
      .fitSize([380, 380], county);
    const countyPath = d3.geoPath().projection(countyProjection);
    const countySVG = d3.select(containerClass)
      .append('svg')
      .attr('class', 'firstCounty')
      .attr('width', 400)
      .attr('height', 400);
    countySVG.append('path')
      .datum(county)
      .attr('class', 'county')
      .attr('d', countyPath)
      .attr('fill', '#3f51b5')
      .attr('stroke', '#3f51b5');
  }
  /*
  private drawFirstCounty(countyName: string, containerClass:string) {
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
  } */
}
