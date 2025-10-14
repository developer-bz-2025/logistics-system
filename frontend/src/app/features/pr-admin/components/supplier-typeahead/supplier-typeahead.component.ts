import { Component, ChangeDetectionStrategy, forwardRef, Input, ElementRef, HostListener } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BehaviorSubject, Observable, Subject, debounceTime, distinctUntilChanged, switchMap, of, tap } from 'rxjs';
import { Supplier, SupplierService } from '../../../../core/services/supplier.service';

@Component({
  selector: 'app-supplier-typeahead',
  templateUrl: './supplier-typeahead.component.html',
  styleUrls: ['./supplier-typeahead.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SupplierTypeaheadComponent),
    multi: true
  }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupplierTypeaheadComponent implements ControlValueAccessor {

  /** Optional: filter by category on backend */
  @Input() categoryId?: number | string;
  @Input() placeholder = 'Search supplier…';
  @Input() perPage = 20;

  /** internal */
  query$ = new Subject<string>();
  results$!: Observable<Supplier[]>;
  loading$ = new BehaviorSubject<boolean>(false);

  // textbox shows name; model value is the supplier id
  inputText$ = new BehaviorSubject<string>('');
  private _value: number | null = null;

  // dropdown state
  open$ = new BehaviorSubject<boolean>(false);
  highlighted = 0;
  currentResults: Supplier[] = [];


  private onChange: (v: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private api: SupplierService, private host: ElementRef) {
    this.results$ = this.query$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      tap(() => this.loading$.next(true)),
      switchMap(q => q?.trim()
        ? this.api.search(q, { category_id: this.categoryId, per_page: this.perPage })
        : of([] as Supplier[])
      ),
      tap(list => { this.currentResults = list; }),   // <— capture for (keydown)
      tap(() => this.loading$.next(false))
    );
  }

  writeValue(v: number | null): void {
    this._value = v ?? null;
    if (!v) this.inputText$.next('');
  }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState?(isDisabled: boolean): void {
    const el: HTMLInputElement = this.host.nativeElement.querySelector('input');
    if (el) el.disabled = isDisabled;
  }

  onInput(val: string) {
    this.inputText$.next(val);
    this.query$.next(val);
    this.open$.next(true);
    this.highlighted = 0;
    this.onTouched();
    if (this._value !== null) { this._value = null; this.onChange(null); }
  }

  pick(s: Supplier) {
    this._value = s.id;
    this.onChange(s.id);
    this.inputText$.next(s.name);
    this.open$.next(false);
  }

  keydown(e: KeyboardEvent, list: Supplier[]) {
    const max = Math.max(0, list.length - 1);
    if (e.key === 'ArrowDown') { this.highlighted = Math.min(this.highlighted + 1, max); e.preventDefault(); }
    if (e.key === 'ArrowUp')   { this.highlighted = Math.max(this.highlighted - 1, 0);   e.preventDefault(); }
    if (e.key === 'Enter' && list[this.highlighted]) { this.pick(list[this.highlighted]); e.preventDefault(); }
    if (e.key === 'Escape')    { this.open$.next(false); }
  }

  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    if (!this.host.nativeElement.contains(ev.target)) this.open$.next(false);
  }
}
