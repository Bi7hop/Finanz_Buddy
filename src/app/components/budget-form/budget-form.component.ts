import { Component, OnInit, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

interface BudgetCategory {
  id?: number;
  name: string;
  category: string;
  budgeted: number;
}

@Component({
  selector: 'app-budget-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule
  ],
  templateUrl: './budget-form.component.html',
  styleUrls: ['./budget-form.component.scss']
})
export class BudgetFormComponent implements OnInit {
  budgetForm!: FormGroup;
  formTitle: string = 'Neue Budget-Kategorie';
  isEditing: boolean = false;
  
  categories = [
    { value: 'housing', viewValue: 'Wohnen', icon: 'home' },
    { value: 'food', viewValue: 'Lebensmittel', icon: 'restaurant' },
    { value: 'transport', viewValue: 'Transport', icon: 'directions_car' },
    { value: 'entertainment', viewValue: 'Freizeit', icon: 'movie' },
    { value: 'shopping', viewValue: 'Einkaufen', icon: 'shopping_cart' },
    { value: 'health', viewValue: 'Gesundheit', icon: 'healing' },
    { value: 'education', viewValue: 'Bildung', icon: 'school' },
    { value: 'savings', viewValue: 'Sparen', icon: 'savings' },
    { value: 'misc', viewValue: 'Sonstiges', icon: 'more_horiz' }
  ];
  
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<BudgetFormComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: BudgetCategory
  ) { }
  
  ngOnInit(): void {
    this.initializeForm();
    
    if (this.data) {
      this.isEditing = true;
      this.formTitle = 'Budget-Kategorie bearbeiten';
      this.budgetForm.patchValue(this.data);
    }
  }
  
  initializeForm(): void {
    this.budgetForm = this.fb.group({
      name: ['', [Validators.required]],
      category: ['', [Validators.required]],
      budgeted: [null, [Validators.required, Validators.min(0)]]
    });
  }
  
  onSubmit(): void {
    if (this.budgetForm.invalid) {
      return;
    }
    
    const result: BudgetCategory = {
      ...this.budgetForm.value
    };
    
    if (this.isEditing && this.data.id) {
      result.id = this.data.id;
    }
    
    this.dialogRef.close(result);
  }
  
  onCancel(): void {
    this.dialogRef.close();
  }
}