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
  public correct: string = '';
  public answered: boolean = false;

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
      .attr('fill', '#d94801')
      .attr('stroke', '#000');
  }

  public answerQuestion(answer: string) {
    console.log(answer);
    answer === this.answer ? this.correct = 'Correct!' : this.correct = 'Incorrect!';
    this.answered = true;
  }
}
