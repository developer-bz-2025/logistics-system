import { Component } from '@angular/core';
import { EntityService } from 'src/app/core/services/entity.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-entity-management',
  templateUrl: './entity-management.component.html',
  styleUrls: ['./entity-management.component.scss']
})
export class EntityManagementComponent {
  entities: any=[];
  loading = true;

  
  constructor(private router : Router,
    private entityService: EntityService
  ) {
  }

  ngOnInit(): void {
    this.getentities();
  }
  navigateTo(path: string,id:number) {
    // this.router.navigateByUrl(path,id);
    this.router.navigate([path,id])
  }

  getentities(){
    this.loading = true;
    this.entityService.getEntities().subscribe({
      next: (res) => {console.log(res)
        this.loading = false;
        this.entities = res;
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to create entity:', err)
      }
    });
  }

  openUnits(entity:any)
  {
    this.router.navigate(entity);
  }
}
