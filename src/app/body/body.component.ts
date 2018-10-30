import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-body',
  templateUrl: './body.component.html',
  styleUrls: ['./body.component.scss']
})
export class BodyComponent implements OnInit {

  constructor() { }

  ngOnInit() {
    d3.json('../../assets/jsoncounties-VA.json', function(error, uk) {
      if (error) {
        return console.error(error);
      }
      console.log(uk);
    });
  }

}
