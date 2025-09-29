import { Component } from '@angular/core';
import { DEMO_COUNTRIES, TtCountry } from '../org-demo.data';


@Component({
  selector: 'app-tree',
  templateUrl: './tree.component.html',
  styleUrls: ['./tree.component.scss']
})
export class TreeComponent {
  demoCountries: TtCountry[] = DEMO_COUNTRIES;

}
