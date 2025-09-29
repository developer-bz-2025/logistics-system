import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from 'src/app/core/services/user.service';
import { UnitService } from 'src/app/core/services/unit.service';
import { CountryService } from 'src/app/core/services/country.service';
import { EntityService } from 'src/app/core/services/entity.service';
import { ActivatedRoute, Router } from '@angular/router';

interface Employee {
  id: number;
  name: string;
  position: string;
  email: string;
}


@Component({
  selector: 'app-update-user',
  templateUrl: './update-user.component.html',
  styleUrls: ['./update-user.component.scss']
})
export class UpdateUserComponent {

  
 
  roles = [
    {
      key: 'country_dir',
      title: 'Country Director',
      description: 'Access to all resources in specific country in one entity',
      icon: 'crown',
      tags: [
        { label: 'Full Access', color: 'bg-purple-100 text-purple-700' },
        { label: 'Supervisor', color: 'bg-blue-100 text-blue-700' }
      ]
    },
    {
      key: 'unit_admin',
      title: 'Unit Admin',
      description: 'Manages specific units with administrative privileges and team oversight capabilities.',
      icon: 'users',
      tags: [
        { label: 'Admin Access', color: 'bg-blue-100 text-blue-700' },
        { label: 'Management', color: 'bg-orange-100 text-orange-700' }
      ]
    },
    {
      key: 'head_of_entity',
      title: 'Head of Entity',
      description: 'Access to all resources in an entity across all countries',
      icon: 'flowchart',
      tags: [
        { label: 'Full Access', color: 'bg-purple-100 text-purple-700' },
        { label: 'Supervisor', color: 'bg-blue-100 text-blue-700' }
      ]
    },
    {
      key: 'c_level',
      title: 'Board',
      description: 'Access All resources in all entities & countries',
      icon: 'globe',
      tags: [
        { label: 'Full Access', color: 'bg-purple-100 text-purple-700' },
        { label: 'Supervisor', color: 'bg-blue-100 text-blue-700' }
      ]
    },
    {
      key: 'standard',
      title: 'Standard',
      description: 'Standard user with basic access to unit resources.',
      icon: 'user',
      tags: [
        { label: 'Basic Access', color: 'bg-gray-100 text-gray-700' },
        { label: 'Standard', color: 'bg-green-100 text-green-700' }
      ]
    }
  ];

  countries : any[] = [];
  entities :any[] = [];
  units :any[] = [];
  message: string = '';
  loading = false;
  userId: number;
  userData: any;
  loadingEmployee=true;



  form!: FormGroup;

  searchQuery = '';

  constructor(private fb: FormBuilder, private userService:UserService, private unitService:UnitService, private entityService:EntityService,private countryService:CountryService, private router:Router,private route:ActivatedRoute) { }

  ngOnInit(): void {
    this.userId = +this.route.snapshot.paramMap.get('id')!;

    this.fetchUser(this.userId);

    this.form = this.fb.group({
      role: ['', Validators.required],
      country_id: [''],
      entity_id: [''],
      unit_id: ['']
    });

    this.form.get('role')?.valueChanges.subscribe(role => {
    this.updateRoleValidators(role);
  });

    this.updateRoleValidators(this.form.get('role')?.value);


    this.loadCountries();
    this.loadEntities();
    this.loadUnits();
  }

  fetchUser(id:number) {
    this.userService.getUser(id).subscribe((user:any) => {
      this.userData = user;
      console.log(user.name)
      this.loadingEmployee=false;
      this.form.patchValue({
        role: user.role,
        country_id: user.country_id,
        entity_id: user.entity_id,
        unit_id: user.unit_id
      });
  
      this.updateRoleValidators(user.role); // trigger validations
    },(error:any)=>{

      this.loadingEmployee=false;
      this.message=error
    }
  );
  }

  updateRoleValidators(role: string) {
  const countryCtrl = this.form.get('country_id');
  const entityCtrl = this.form.get('entity_id');
  const unitCtrl = this.form.get('unit_id');

  // Reset all validators
  countryCtrl?.clearValidators();
  entityCtrl?.clearValidators();
  unitCtrl?.clearValidators();

  if (role === 'country_dir') {
    countryCtrl?.setValidators([Validators.required]);
    entityCtrl?.setValidators([Validators.required]);
  } else if (role === 'head_of_entity') {
    entityCtrl?.setValidators([Validators.required]);
  } else if (role === 'unit_admin' || role === 'standard') {
    unitCtrl?.setValidators([Validators.required]);
  }

  countryCtrl?.updateValueAndValidity();
  entityCtrl?.updateValueAndValidity();
  unitCtrl?.updateValueAndValidity();
}

  loadUnits() {
    this.unitService.getUnits().subscribe(

      (data: any) => {
        console.log('Fetched units:', data);
        this.units = data;    
      },
      (error: any) => {
        console.error('Error fetching units:', error);   
        // Handle error appropriately, e.g., show a notification
      }
    );
  }

  loadEntities() {
    this.entityService.getEntities().subscribe(
      (data: any) => {
        console.log('Fetched entities:', data);
        this.entities = data;    
      },
      (error: any) => {
        console.error('Error fetching entities:', error);   
        // Handle error appropriately, e.g., show a notification
      }
    );
  }

  loadCountries() {
    this.countryService.getCountries().subscribe(
      (data: any) => {
        console.log('Fetched countries:', data);
        this.countries = data;    
      }
      ,
      (error: any) => {
        console.error('Error fetching countries:', error);   
        // Handle error appropriately, e.g., show a notification
      }
    );
  }



  get selectedCountryName(): string | undefined {
  const id = this.form?.value?.country_id;
  return this.countries.find(c => Number(c.country_id) === Number(id))?.country_name;
}

get selectedEntityName(): string | undefined {
 

  const id = this.form?.value?.entity_id;
  return this.entities.find(e => Number(e.entity_id) === Number(id))?.entity_name;
}

get selectedUnitName(): string | undefined {
  const id = this.form?.value?.unit_id;
  return this.units.find(u => Number(u.unit_id) === Number(id))?.unit_name;
}



  

  selectEmployee(emp: Employee) {
    this.form.get('id')?.setValue(emp.id);
  }

  isSelected(empId: number): boolean {
    return this.form.get('id')?.value === empId;
  }


  selectRole(roleKey: string) {
  this.form.get('role')?.setValue(roleKey);

  // Clear irrelevant fields
  this.form.patchValue({
    country_id: '',
    entity_id: '',
    unit_id: ''
  });
}

  isRoleSelected(roleKey: string): boolean {
    return this.form.get('role')?.value === roleKey;
  }



  onSubmit() {
    if (this.form.valid) {
      this.loading = true;
      const data = { ...this.form.value, id: this.userId };

      this.userService.updateUser(data).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.loading = false;
          console.error('Update error:', err);
        }
      });
    }
  }


  showSuccessMessage(message: string) {
    // Implement your success message logic here, e.g., using a snackbar or toast
    console.log(message);
  } 


  roleGradientMap: { [key: string]: string } = {
    super_admin: 'from-[#E6DADA] to-[#274046]',        // Gray
    country_dir: 'from-[#72C6EF] to-[#004E8F]',    // Cyan to Teal bg-gradient-to-br from-[#72C6EF] to-[#004E8F]
    head_of_entity: 'from-[#00416A] to-[#E4E5E6]',      // Orange bg-gradient-to-br from-[#00416A] to-[#E4E5E6]
    unit_admin: 'from-[#215F00] to-[#E4E4D9]',          // Blue bg-gradient-to-br from-[#215F00] to-[#E4E4D9]
    standard: 'from-[#FCE38A] to-[#F38181]',            // Yellow to Red
    c_level: 'from-[#F2709C] to-[#FF9400]',             // Purple gradient bg-gradient-to-br from-[#F2709C] to-[#FF9472]
    default: 'from-[#D3CCE3] to-[#E9E4F0]'              // Light fallback
  };
  
  getGradientClass(role: string): string {
    return this.roleGradientMap[role] || this.roleGradientMap['default'];
  }

}
