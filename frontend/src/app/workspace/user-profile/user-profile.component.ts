import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from 'src/app/core/services/user.service';


@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent {

  userProfile:any
  loading = true;
  error: string | null = null;
  userId: number;

  constructor( private userService:UserService, private router:Router,private route:ActivatedRoute) { }


  ngOnInit(): void {
    this.userId = +this.route.snapshot.paramMap.get('id')!;

    this.fetchUser(this.userId);
  }

  roleGradientMap: { [key: string]: string } = {
    super_admin: 'from-[#F2709C] to-[#FF9400]',        
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

  // ---- Role icon/label/chip helpers ----
  roleIcon(role: string): string {
    switch (role) {
      case 'super_admin':    return '🧑‍💼👑';
      case 'c_level':        return '🧑‍💼🏛️';
      case 'country_dir':    return '🧑‍💼🌍';
      case 'head_of_entity': return '🧑‍💼🏢';
      case 'unit_admin':     return '🧑‍💼🛠️';
      default:               return '👤';
    }
  }

  roleLabel(role: string): string {
    switch (role) {
      case 'super_admin':    return 'Super Admin';
      case 'c_level':        return 'C-Level';
      case 'country_dir':    return 'Country Director';
      case 'head_of_entity': return 'Head of Entity';
      case 'unit_admin':     return 'Unit Admin';
      default:               return 'Standard';
    }
  }

  /** pill background/border/text color */
  roleChipClass(role: string): string {
    switch (role) {
      case 'super_admin':    return 'chip chip-sa';
      case 'c_level':        return 'chip chip-cl';
      case 'country_dir':    return 'chip chip-cdir';
      case 'head_of_entity': return 'chip chip-head';
      case 'unit_admin':     return 'chip chip-admin';
      default:               return 'chip chip-std';
    }
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    const a = parts[0]?.charAt(0) || '';
    const b = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return (a + b).toUpperCase();
  }

  copyEmail(email?: string) {
    if (!email) return;
    navigator.clipboard?.writeText(email);
  }


  fetchUser(id:number) {
    this.userService.getUser(id).subscribe((user:any) => {
      this.userProfile = user;
      this.loading=false;

    },(error:any)=>{

      this.loading=false;
      this.error=error
    })
  }
}
