import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PrService } from '../../services/pr.service';
// import { PR } from '../../models/pr';

@Component({
  selector: 'app-pr-detail',
  templateUrl: './pr-detail.component.html',
  styleUrls: ['./pr-detail.component.scss']
})
export class PrDetailComponent implements OnInit {
  

  constructor(private route: ActivatedRoute, private prSvc: PrService) {}

  ngOnInit(): void {
  
  }
}
