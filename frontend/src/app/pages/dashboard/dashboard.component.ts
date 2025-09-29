import { Component, ViewEncapsulation, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { BrowseService } from 'src/app/core/services/browse.service';
import { UserService } from 'src/app/core/services/user.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class AppDashboardComponent {


  displayedColumns: string[] = ['name', 'entities', 'docs'];
  dataSource: any;

  userRole:any;


  constructor(private userService: UserService,private router : Router, private browseService: BrowseService) {
  }

  navigateTo(path: string) {
    this.router.navigateByUrl(path);
  }

  // dashboardCards = [
  //   { label: 'emps', value: 0, icon: '👤', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  //   { label: 'Resources', value: 0, icon: '📦', bgColor: 'bg-yellow-50', textColor: 'text-yellow-600' },
  //   { label: 'Units', value: 0, icon: '🏢', bgColor: 'bg-cyan-50', textColor: 'text-cyan-600' },
  //   { label: 'Entities', value: 0, icon: '🏛️', bgColor: 'bg-red-50', textColor: 'text-red-600' },
  //   { label: 'Countries', value: 0, icon: '🌍', bgColor: 'bg-green-50', textColor: 'text-green-600' },
  //   { label: 'c_level', value: 0, icon: '🧑‍💼', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
  //   { label: 'country_dir', value: 0, icon: '📁', bgColor: 'bg-indigo-50', textColor: 'text-indigo-600' },
  //   { label: 'head_of_entity', value: 0, icon: '🔐', bgColor: 'bg-pink-50', textColor: 'text-pink-600' },
  //   { label: 'unit_admin', value: 0, icon: '🔐', bgColor: 'bg-pink-50', textColor: 'text-pink-600' },
  //   { label: 'standard', value: 0, icon: '🔐', bgColor: 'bg-pink-50', textColor: 'text-pink-600' }
  // ];

  dashboardCards = [
    { label: 'emps',       value: 0, icon: '👤',  bgColor: 'bg-blue-50',    textColor: 'text-blue-600' },
    { label: 'Resources',  value: 0, icon: '📦',  bgColor: 'bg-yellow-50',  textColor: 'text-yellow-600' },
    { label: 'Units',      value: 0, icon: '🏢',  bgColor: 'bg-cyan-50',    textColor: 'text-cyan-600' },
    { label: 'Entities',   value: 0, icon: '🏛️', bgColor: 'bg-red-50',     textColor: 'text-red-600' },
    { label: 'Countries',  value: 0, icon: '🌍',  bgColor: 'bg-green-50',   textColor: 'text-green-600' },
  
    // roles (updated icons + colors)
    { label: 'board',        value: 0, icon: '🧑‍💼', bgColor: 'bg-violet-50',  textColor: 'text-violet-700' },
    { label: 'country_dir',    value: 0, icon: '👨‍💼', bgColor: 'bg-indigo-50',  textColor: 'text-indigo-700' },
    { label: 'head_of_entity', value: 0, icon: '👨‍🏫', bgColor: 'bg-sky-50',     textColor: 'text-sky-700' },
    { label: 'unit_admin',     value: 0, icon: '👨‍🔧', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700' },
    { label: 'standard',       value: 0, icon: '👩‍💼', bgColor: 'bg-slate-100',  textColor: 'text-slate-700' },
  ];

  ngOnInit() {
    this.browseService.getDashboardOverview().subscribe((data) => {
      console.log(data);
      this.dashboardCards = this.dashboardCards.map(card => ({
        ...card,
        value: data[card.label.toLowerCase()]
      }));
    });

    this.userService.getUserRole().subscribe(role => {
      if (role) {
        console.log('User role is:', role);
        this.userRole=role;
        // do role-based logic here
      } else {
        console.warn('User role not found');
      }
    });
  }
  

}