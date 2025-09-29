import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import { ResourcesService, TypeNode } from 'src/app/core/services/resources.service';
import { JwtService } from 'src/app/core/services/jwt.service';
import { UserService } from 'src/app/core/services/user.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-my-unit-resources',
  templateUrl: './my-unit-resources.component.html',
  styleUrls: ['./my-unit-resources.component.scss']
})
export class MyUnitResourcesComponent implements OnInit {
  tree$!: Observable<TypeNode[]>;
  loading = true;
  errorMsg = '';
  user: any = null;
  private readonly fileBase = environment.fileBaseUrl;

  typeColors: Record<string, string> = {
    'Document': '#3b82f6', 'Policy': '#ef4444', 'System Link': '#10b981',
    'Useful Link': '#8b5cf6','Reports': '#4E388B','Training Materials': '#1D4ED9', 'Other': '#6b7280',
  };
  visColors: Record<string, string> = {
    'Global': '#f59e0b', 'Public': '#10b981', 'Internal': '#3b82f6',
    'Confidential': '#ef4444', 'Other': '#6b7280'
  };

  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private auth: AuthService,
    private rs: ResourcesService
  ) {}

  ngOnInit(): void {
    const unitId = Number(this.auth.user()?.unit_id) || 0;

    this.tree$ = this.rs.getResourcesTree(unitId).pipe(
      map((res: any) => (Array.isArray(res) ? res : (res?.data ?? [])) as TypeNode[]),
      map(arr => arr.map(t => ({ ...t, categories: Array.isArray(t.categories) ? t.categories : [] }))),
      tap(() => { this.loading = false; this.errorMsg = ''; }),
      catchError(err => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Failed to load resources';
        return of<TypeNode[]>([]);
      }),
      shareReplay(1)
    );

    const userId = this.jwtService.getUserId();
    if (userId) {
      this.userService.getUser(+userId).subscribe({
        next: d => this.user = d,
        error: () => {}
      });
    }
  }

  resolveUrl = (u: string | null | undefined): string | null => {
    this.rs.resolveUrl(u);
    if (!u) return null;
  
    const s = String(u).trim();
    // absolute URL? return as-is
    if (/^https?:\/\//i.test(s)) return s;
  
    // normalize relative path
    const rel = s
      .replace(/^\/?storage\/app\/public\//, 'storage/')
      .replace(/^\/+/, ''); // strip leading slashes
  
    // base may be undefined in env; fallback to empty (site root)
    const base = (this.fileBase ?? '');
    const baseClean = typeof base === 'string' ? base.replace(/\/+$/, '') : '';
  
    return baseClean ? `${baseClean}/${rel}` : `/${rel}`;
  };

  // resolveUrl(u: string | null | undefined): string | null {
  //   if (!u) return null;
  //   if (/^https?:\/\//i.test(u)) return u;
  //   let rel = String(u).trim();
  //   rel = rel.replace(/^\/?storage\/app\/public\//, 'storage/');
  //   if (!/^\/?storage\//.test(rel)) rel = `storage/${rel.replace(/^\/+/, '')}`;
  //   const base = this.fileBase.replace(/\/+$/, '');
  //   rel = rel.replace(/^\/+/, '');
  //   return `${base}/${rel}`;
  // }
}
