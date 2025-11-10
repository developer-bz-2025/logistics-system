import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-step-assignment',
  templateUrl: './step-assignment.component.html',
  styleUrls: ['./step-assignment.component.scss']
})
export class StepAssignmentComponent {
  @Input() form!: FormGroup;
  @Input() locations: any[] = [];
  @Input() floors: any[] = [];
  @Input() statuses: any[] = [];
  @Input() searchUsersFn!: (search: string) => Observable<any[]>;

  filteredUsers$!: Observable<any[]>;

  displayUser(userId: number): string {
    // Simple implementation - in a real app you'd look up the user name
    return userId?.toString() || '';
  }
}
