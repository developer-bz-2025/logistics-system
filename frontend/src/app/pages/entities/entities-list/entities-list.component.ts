import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { EntityDto, EntityService } from 'src/app/core/services/entity.service';
import { Entity } from 'src/app/core/models/Entity';
import { UserService } from 'src/app/core/services/user.service';

@Component({
  selector: 'app-entities-list',
  templateUrl: './entities-list.component.html',
  styleUrls: ['./entities-list.component.scss']
})
export class EntitiesListComponent {

  entities: EntityDto[] = [];
modalOpen = false;
selected: EntityDto | null = null;
isloading = false;

  // entities: Entity[];
  displayedColumns: string[] = ['name', 'entities', 'total_emps','details'];
  dataSource: any;
  loading = true;
  userRole:any;


  constructor(private router : Router,
    private userService: UserService,
    private entityService: EntityService
  ) {
  }

  ngOnInit(): void {
    this.getentities();
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
  navigateTo(path: string) {
    this.router.navigateByUrl(path);
  }

  getentities(){
    this.loading = true;
    this.entityService.getEntities().subscribe({
      next: (res) => {console.log(res)
        this.loading = false;
        this.entities = res as EntityDto[];
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to create country:', err)
      }
    });
  }

  entityDetails(id:number){
    this.router.navigate(["/pages/entities/entity-details",id])
  }

  edit(entity: EntityDto) {
    this.selected = entity;
    this.modalOpen = true;
    }
    
    
    onModalClosed() {
    this.modalOpen = false;
    // this.getentities();
    this.selected = null;
    }
    
    
    onSaved(updated: EntityDto) {
    // Optimistically update the local array
    this.entities = this.entities.map(e => e.entity_id === updated.entity_id ? { ...e, ...updated } : e);
    this.onModalClosed();
    }
}
