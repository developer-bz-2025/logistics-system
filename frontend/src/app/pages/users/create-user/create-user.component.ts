import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from 'src/app/core/services/user.service';
import { UnitService } from 'src/app/core/services/unit.service';
import { CountryService } from 'src/app/core/services/country.service';
import { EntityService } from 'src/app/core/services/entity.service';
import { Router } from '@angular/router';

interface Employee {
  id: number;
  name: string;
  position: string;
  email: string;
}



@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.scss']
})
export class CreateUserComponent {

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
      title: 'C Level',
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
  loadingEmployees = true;



  form!: FormGroup;
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  searchQuery = '';

  constructor(private fb: FormBuilder, private userService:UserService, private unitService:UnitService, private entityService:EntityService,private countryService:CountryService, private router:Router) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      id: ['', Validators.required],
      role: ['', Validators.required],
      country_id: [''],
      entity_id: [''],
      unit_id: ['']
    });

    this.form.get('role')?.valueChanges.subscribe(role => {
    this.updateRoleValidators(role);
  });

    this.updateRoleValidators(this.form.get('role')?.value);


    this.loadEmployees();
    this.loadCountries();
    this.loadEntities();
    this.loadUnits();
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

  loadEmployees() {
    this.loadingEmployees = true;
    this.userService.getUsers().subscribe(
      (data: any) => {
        console.log('Fetched employees:', data);
        this.employees = data
        this.filteredEmployees = [...this.employees];
        this.loadingEmployees = false;
      },
      (error: any) => {
        this.loadingEmployees = false;
        console.error('Error fetching employees:', error);
        // Handle error appropriately, e.g., show a notification
      }
    );

    
    // this.employees = [
    //   { id: 1, fullName: 'Alaa Alzaibk', jobTitle: 'Software Engineer', email: 'alaa.alzaybak@basmeh-zeitooneh.com' },
    //   { id: 2, fullName: 'Essam Shadadi', jobTitle: 'IT Officer', email: 'essam@basmeh-zeitooneh.com' },
    //   { id: 3, fullName: 'Wael', jobTitle: 'HR manage', email: 'wael@basmeh-zeitooneh.com' }
    // ];

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


  filterEmployees() {
    const query = this.searchQuery.toLowerCase();
    this.filteredEmployees = this.employees.filter(emp =>
      emp.name.toLowerCase().includes(query) ||
      emp.email.toLowerCase().includes(query) ||
      emp.position.toLowerCase().includes(query)
    );
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

  get selectedEmployee() {
  const id = this.form.get('id')?.value;
  return this.employees.find(emp => emp.id === id);
}

  onSubmit() {
    if (this.form.valid) {
      const formData = this.form.value;
      this.loading = true;

      console.log('Form Submitted:', formData);
      this.userService.createUser(formData).subscribe(
        response => {
      this.loading = false;

          console.log('User created successfully:', response);
           this.router.navigate(['/dashboard']);
          // Handle success, e.g., show a notification or redirect
        },
        error => {
          this.loading = false;
          console.error('Error creating user:', error.error.error);
          this.showSuccessMessage('Error creating user'); // Example error handling
          this.form.reset(); // Reset the form on error
          this.message=error.error.error; // Capture error message
          // Handle error, e.g., show an error message
        }
      );
      // Optionally reset the form after submission
      this.form.reset();
      this.filteredEmployees = [...this.employees]; // Reset employee filter
      this.searchQuery = ''; // Clear search query
      console.log('Form reset after submission');
      // Optionally, you can navigate to another page or show a success message
      // this.router.navigate(['/dashboard']); // Example navigation
      // or
      this.showSuccessMessage('User created successfully'); // Example success message
      console.log('Form is valid and ready for submission');
      // Handle form submission logic here
    } else {
      console.log('Form is invalid');
    }
  }
  showSuccessMessage(message: string) {
    // Implement your success message logic here, e.g., using a snackbar or toast
    console.log(message);
  } 


}