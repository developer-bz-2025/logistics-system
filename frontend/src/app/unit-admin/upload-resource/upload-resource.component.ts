import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ResourcesService, ResType, ResVisibility } from 'src/app/core/services/resources.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { debounceTime, distinctUntilChanged, switchMap, startWith, map, combineLatest, of, BehaviorSubject, filter } from 'rxjs';
import type { ResCategory } from 'src/app/core/services/resources.service';


type Card<T> = { id?: number; key: string; label: string; desc: string; icon: string; color: string; bg: string };



@Component({
  selector: 'app-upload-resource',
  templateUrl: './upload-resource.component.html',
  styleUrls: ['./upload-resource.component.scss']
})
export class UploadResourceComponent {

  private typesReady$ = new BehaviorSubject<boolean>(false);


  typeList: ResType[] = [];
  visList: ResVisibility[] = [];

  // dynamically filled from API (no hardcoding)
  typeCards: Card<ResType>[] = [];
  visCards: Card<ResVisibility>[] = [];


  @ViewChild('urlInput') urlInput?: ElementRef<HTMLInputElement>;


  // simple metadata to decorate API rows (icon/desc)
  private typeMeta: Record<string, { icon: string; desc: string }> = {
    'Policy': { icon: 'shield', desc: 'Official policies and procedures' },
    'Document': { icon: 'file-text', desc: 'Reference documents and guides' },
    'Reports': { icon: 'file', desc: 'Annaul Report' },
    'Training Materials': { icon: 'map', desc: 'Materials, handouts..' },
    'System Link': { icon: 'device-desktop', desc: 'External systems and tools' },
    'Useful Link': { icon: 'link', desc: 'Useful links' }
  };
  private visMeta: Record<string, { icon: string; desc: string }> = {
    'Global': { icon: 'world', desc: 'Accessible to all users across all entities & countries' },
    'Public': { icon: 'cloud-lock', desc: 'Accessible to all users across the entity' },
    'Internal': { icon: 'building', desc: 'Accessible only to unit members' },
    'Confidential': { icon: 'lock', desc: 'Only for you' }
  };

  // Stable color palette (Tailwind utility classes)
  private palette = [
    { color: 'text-red-700', bg: 'bg-red-100' },
    { color: 'text-orange-700', bg: 'bg-orange-100' },
    { color: 'text-amber-700', bg: 'bg-amber-100' },
    { color: 'text-yellow-700', bg: 'bg-yellow-100' },
    { color: 'text-lime-700', bg: 'bg-lime-100' },
    { color: 'text-green-700', bg: 'bg-green-100' },
    { color: 'text-emerald-700', bg: 'bg-emerald-100' },
    { color: 'text-teal-700', bg: 'bg-teal-100' },
    { color: 'text-cyan-700', bg: 'bg-cyan-100' },
    { color: 'text-sky-700', bg: 'bg-sky-100' },
    { color: 'text-blue-700', bg: 'bg-blue-100' },
    { color: 'text-indigo-700', bg: 'bg-indigo-100' },
    { color: 'text-violet-700', bg: 'bg-violet-100' },
    { color: 'text-purple-700', bg: 'bg-purple-100' },
    { color: 'text-fuchsia-700', bg: 'bg-fuchsia-100' },
    { color: 'text-pink-700', bg: 'bg-pink-100' },
    { color: 'text-rose-700', bg: 'bg-rose-100' },
    { color: 'text-stone-700', bg: 'bg-stone-100' },
  ];

  // Stable “random” → hash name → pick palette index
  private colorFor(label: string) {
    const s = (label || '').toLowerCase();
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    const idx = h % this.palette.length;
    return this.palette[idx];
  }

  // reactive form (use backend field names)
  form = this.fb.group({
    res_title: ['', [Validators.required, Validators.maxLength(150)]],
    res_description: ['', [Validators.required, Validators.maxLength(2000)]],
    res_type_id: [null as number | null, Validators.required],
    res_visibility_id: [null as number | null, Validators.required],
    res_url: [{ value: '', disabled: true }],   // for System/Useful Link (confirm key with backend)
    file: [null as File | null],
    tags: [[] as string[]],
    category: ['']
  });

  // TAG UI helpers
  tagInput = new FormControl<string>('');
  selectedTags: string[] = [];

  unitId?: number;
  userId?: number;
  created?: any;

  submitting = false;
  submitted = false;

  createdMsg?: any;
  errorMsg?: string;

  typeById = new Map<number, string>();

  constructor(
    private fb: FormBuilder,
    private rs: ResourcesService,
    private auth: AuthService,
    private snack: MatSnackBar
  ) { }

  categoryCtrl = new FormControl<string>('');
  filteredCategories$ = combineLatest([
    this.categoryCtrl.valueChanges.pipe(startWith(''), debounceTime(200), distinctUntilChanged()),
    this.form.get('res_type_id')!.valueChanges.pipe(startWith(this.form.value.res_type_id))
  ]).pipe(
    switchMap(([q, typeId]) => {
      const query = (q ?? '').trim();
      // if no API yet, replace with "of([])"
      return this.rs.searchCategories(query, typeId ?? undefined).pipe(
        map(list => ({ list, q: query }))
      );
    })
  );

  ngOnInit(): void {

    const u = this.auth.user();
    this.unitId = u?.unit_id;
    this.userId = u?.id;

    this.categoryCtrl.valueChanges.subscribe(v => {
      this.form.patchValue({ category: (v ?? '').trim() });
    });

    // fetch & build cards from API
    this.rs.getTypes().subscribe(types => {
      this.typeList = types;
      this.typeById = new Map(types.map(t => [t.id, t.type]));
      this.typeCards = types.map(t => {
        const meta = this.typeMeta[t.type] ?? { icon: 'file', desc: '' };
        const { color, bg } = this.colorFor(t.type);
        return {
          id: t.id,
          key: t.type,
          label: t.type,
          icon: meta.icon,
          desc: meta.desc,
          color,
          bg
        };
      });
      this.typesReady$.next(true);
    });
    // Load Visibilities → build colorful visCards
    this.rs.getVisibilities().subscribe(vis => {
      this.visList = vis;
      this.visCards = vis.map(v => {
        const meta = this.visMeta[v.type] ?? { icon: 'eye', desc: '' };
        const { color, bg } = this.colorFor(v.type);
        return {
          id: v.id,
          key: v.type,
          label: v.type,
          icon: meta.icon,
          desc: meta.desc,
          color,
          bg
        };
      });
    });

    this.form.get('res_url')!.enable({ emitEvent: false });


    const typeId$ = this.form.get('res_type_id')!.valueChanges.pipe(
      startWith(this.form.value.res_type_id)  // run once immediately
    );

    combineLatest([this.typesReady$, typeId$])
      .pipe(filter(([ready]) => ready))
      .subscribe(([_, typeId]) => {
        const type = this.typeList.find(t => t.id === typeId)?.type ?? '';
        const isLink = /system link|useful link/i.test(type);

        const urlCtrl = this.form.get('res_url')!;
        const fileCtrl = this.form.get('file')!;

        // URL validators
        if (isLink) {
          urlCtrl.enable({ emitEvent: false });
          urlCtrl.setValidators([Validators.required, Validators.pattern(/^https?:\/\//i)]);
        } else {
          urlCtrl.clearValidators();
          urlCtrl.setValue('');             // optional
        }
        urlCtrl.updateValueAndValidity({ emitEvent: false });

        // FILE validators
        if (isLink) {
          // ✅ critical: clear the required validator when link-type
          fileCtrl.clearValidators();
          fileCtrl.setValue(null);          // optional
        } else {
          fileCtrl.setValidators([Validators.required]);
        }
        fileCtrl.updateValueAndValidity({ emitEvent: false });

        // If you keep *ngIf on the URL field, DO NOT disable it here.
        // The element is removed/added by *ngIf; disabling the control is unnecessary.
      });
    // toggle URL/File validators based on selected type
    // this.form.get('res_type_id')!.valueChanges.subscribe(() => {
    //   const selected = this.typeList.find(t => t.id === this.form.value.res_type_id)?.type ?? '';
    //   const isLink = /system link|useful link/i.test(selected);
    //   const urlCtrl = this.form.get('res_url')!;
    //   const fileCtrl = this.form.get('file')!;
    //   if (isLink) {
    //     urlCtrl.enable();
    //     urlCtrl.setValidators([Validators.required, Validators.pattern(/^https?:\/\//i)]);
    //     fileCtrl.clearValidators(); fileCtrl.setValue(null);
    //   } else {
    //     // urlCtrl.disable(); urlCtrl.clearValidators(); urlCtrl.setValue('');
    //     fileCtrl.setValidators([Validators.required]);
    //   }
    //   urlCtrl.updateValueAndValidity();
    //   fileCtrl.updateValueAndValidity();
    // });

  }

  categoryNeedsCreate(data: { list: { name: string }[]; q: string }): boolean {
    const query = (data.q ?? '').trim().toLowerCase();
    if (!query) return false;
    return !data.list?.some(c => c.name.toLowerCase() === query);
  }

  // helpers for preview
  get previewType(): string {
    return this.selectedTypeLabel || '—';
  }
  get previewCategory(): string {
    return (this.form.value.category || '').trim() || '—';
  }
  get previewTitle(): string {
    return (this.form.value.res_title || '').trim() || '—';
  }
  get previewVisibility(): string {
    const id = this.form.value.res_visibility_id;
    const v = this.visList.find(x => x.id === id)?.type || '—';
    return v.toLowerCase();
  }

  // handle selection from autocomplete
  useCategory(name: string) {
    this.categoryCtrl.setValue(name, { emitEvent: true });
  }

  // labels and booleans for template
  get selectedTypeLabel(): string {
    const id = this.form.value.res_type_id ?? null;
    return id ? (this.typeById.get(id) ?? '') : '';
  }

  get showUrl(): boolean {
    const t = this.selectedTypeLabel;
    return /^(System Link|Useful Link)$/i.test(t);
  }

  get showFile(): boolean {
    const t = this.selectedTypeLabel;
    return /^(Document|Policy|Reports|Training Materials)$/i.test(t);
  }

  // card clicks
  pickType(card: Card<ResType>) { if (card.id) this.form.patchValue({ res_type_id: card.id }); }
  pickVisibility(card: Card<ResVisibility>) { if (card.id) this.form.patchValue({ res_visibility_id: card.id }); }
  selectedTypeId() { return this.form.value.res_type_id; }
  selectedVisId() { return this.form.value.res_visibility_id; }

  // file
  onFile(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.form.patchValue({ file: input.files?.[0] ?? null });
  }

  // TAGS as free text
  addTagFromEnter() {
    const raw = (this.tagInput.value ?? '').trim();
    if (!raw) return;
    if (!this.selectedTags.some(t => t.toLowerCase() === raw.toLowerCase())) {
      this.selectedTags.push(raw);
      this.form.patchValue({ tags: [...this.selectedTags] });
    }
    this.tagInput.setValue('');
  }
  removeTag(tag: string) {
    this.selectedTags = this.selectedTags.filter(t => t !== tag);
    this.form.patchValue({ tags: [...this.selectedTags] });
  }

  submit() {
    this.submitted = true;
    this.createdMsg = undefined;
    this.errorMsg = undefined;

    if (this.form.invalid || !this.unitId || !this.userId) {
      this.revealErrors();
      return;
    }
    const v = this.form.value;
    const payload = {
      res_title: v.res_title!,
      res_description: v.res_description!,
      res_type_id: v.res_type_id!,
      res_visibility_id: v.res_visibility_id!,
      unit_id: this.unitId!,
      res_uploaded_by: this.userId!,
      tags: (v.tags ?? []) as string[],         // <— names
      category: v.category || undefined,        // <— free text
      res_url: v.res_url || undefined,
      file: v.file || null,
    };

    console.log(payload)

    this.submitting = true;

    this.rs.create(payload).subscribe({
      next: (res) => {
        this.created = res;
        this.snack.open('Resource created', 'OK', { duration: 2500 });
        this.createdMsg = res || 'Resource created successfully.';
        this.created = res;

        // ✅ Reset form & UI state
        this.form.reset();
        this.categoryCtrl.reset();
        this.selectedTags = [];
        this.submitted = false;

        // Optional: reset preview values if you use them
        // this.previewType = '';
        // this.previewCategory = '';
        // this.previewTitle = '';
        // this.previewVisibility = '';

        // Clear validators for fields that shouldn't start with required
        this.form.get('file')?.clearValidators();
        this.form.get('res_url')?.clearValidators();
        this.form.updateValueAndValidity({ emitEvent: false });
      },
      error: (err) => {
        console.error(err);
        this.snack.open('Failed to create resource', 'Dismiss', { duration: 3500 });
      }, complete: () => {
        this.submitting = false;
      }
    });
  }

  private logInvalid(ctrl: AbstractControl, path = ''): void {
    if (ctrl instanceof FormGroup) {
      Object.keys(ctrl.controls).forEach(key => {
        const child = ctrl.controls[key];
        this.logInvalid(child, path ? `${path}.${key}` : key);
      });
    } else if (ctrl instanceof FormArray) {
      ctrl.controls.forEach((c, i) => this.logInvalid(c, `${path}[${i}]`));
    } else {
      if (ctrl.invalid) {
        console.log('❌ Invalid:', path, ' errors =', ctrl.errors, ' value =', ctrl.value);
      }
    }
  }



  // Build a friendly list of what's missing based on current type
  get missingMessages(): string[] {
    const msgs: string[] = [];
    const f = this.form;

    if (f.get('res_title')?.invalid) msgs.push('Resource Name is required (max 150 characters).');
    if (f.get('res_description')?.invalid) msgs.push('Description is required (max 2000 characters).');
    if (f.get('res_type_id')?.invalid) msgs.push('Please choose a Resource Type.');
    if (f.get('res_visibility_id')?.invalid) msgs.push('Please choose a Visibility.');

    // Conditional fields
    if (this.showUrl) {
      const url = f.get('res_url');
      if (url?.hasError('required')) msgs.push('System/Useful link URL is required.');
      if (url?.hasError('pattern')) msgs.push('URL must start with http:// or https://');
    }

    if (this.showFile) {
      if (f.get('file')?.hasError('required')) msgs.push('Please upload a file for Document/Policy.');
    }

    return msgs;
  }

  // Optional: call this before showing errors to reveal them in UI
  private revealErrors() {
    this.form.markAllAsTouched();
  }

  // Extract a readable message from backend error
  private parseError(err: any): string {
    // Laravel-style: { message: string, errors: { field: [msg] } }
    const msg = err?.error?.message || err?.message || 'Unknown error';
    const errors = err?.error?.errors;
    if (errors && typeof errors === 'object') {
      const lines: string[] = [];
      for (const key of Object.keys(errors)) {
        const arr = errors[key];
        if (Array.isArray(arr)) lines.push(`${key}: ${arr.join(', ')}`);
      }
      if (lines.length) return `${msg}\n\n` + lines.join('\n');
    }
    return msg;
  }

}
