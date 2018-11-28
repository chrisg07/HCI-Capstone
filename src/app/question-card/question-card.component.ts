import { Component, OnInit, Input } from '@angular/core';
import { CountyDataService } from '../services/county-data.service';
import { throwToolbarMixedModesError } from '@angular/material/toolbar';

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

  constructor(private countyDataService: CountyDataService) { }

  ngOnInit() {
     const county = this.countyDataService.getCountyData('Franklin County').subscribe(value => {
       console.log(value);
     });
     console.log(county);
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
