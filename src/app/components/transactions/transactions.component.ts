import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { TransactionService } from '../../services/transaction.service';

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
}

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss']
})
export class TransactionFormComponent implements OnInit {
  transactionForm!: FormGroup;
  transactionType: 'income' | 'expense' = 'expense';
  formTitle: string = 'Neue Ausgabe';
  submitLabel: string = 'Ausgabe speichern';
  isEditing: boolean = false;
  
  categories: Category[] = [
    { id: 'salary', name: 'Gehalt', type: 'income', icon: 'work' },
    { id: 'investment', name: 'Kapitalerträge', type: 'income', icon: 'trending_up' },
    { id: 'gifts', name: 'Geschenke', type: 'income', icon: 'card_giftcard' },
    { id: 'other_income', name: 'Sonstiges', type: 'income', icon: 'more_horiz' },
    
    { id: 'housing', name: 'Wohnen', type: 'expense', icon: 'home' },
    { id: 'food', name: 'Lebensmittel', type: 'expense', icon: 'restaurant' },
    { id: 'transport', name: 'Transport', type: 'expense', icon: 'directions_car' },
    { id: 'shopping', name: 'Einkaufen', type: 'expense', icon: 'shopping_cart' },
    { id: 'entertainment', name: 'Unterhaltung', type: 'expense', icon: 'movie' },
    { id: 'health', name: 'Gesundheit', type: 'expense', icon: 'healing' },
    { id: 'education', name: 'Bildung', type: 'expense', icon: 'school' },
    { id: 'other_expense', name: 'Sonstiges', type: 'expense', icon: 'more_horiz' }
  ];
  
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private transactionService: TransactionService
  ) {}
  
  ngOnInit(): void {
    this.initializeForm();
    
    this.route.queryParams.subscribe(params => {
      if (params['type'] === 'income') {
        this.transactionType = 'income';
        this.formTitle = 'Neue Einnahme';
        this.submitLabel = 'Einnahme speichern';
      }
      
      if (params['id']) {
        this.isEditing = true;
        this.loadTransaction(params['id']);
        this.formTitle = this.transactionType === 'income' ? 'Einnahme bearbeiten' : 'Ausgabe bearbeiten';
        this.submitLabel = this.transactionType === 'income' ? 'Einnahme aktualisieren' : 'Ausgabe aktualisieren';
      }
    });
  }
  
  initializeForm(): void {
    this.transactionForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
      date: [new Date(), Validators.required],
      category: ['', Validators.required],
      description: ['', Validators.maxLength(100)],
      isRecurring: [false],
      interval: ['monthly']
    });
    
    this.transactionForm.get('isRecurring')!.valueChanges.subscribe(isRecurring => {
      const intervalControl = this.transactionForm.get('interval');
      if (isRecurring) {
        intervalControl!.enable();
      } else {
        intervalControl!.disable();
      }
    });
    this.transactionForm.get('interval')!.disable();
  }
  
  loadTransaction(id: string): void {
    const mockTransaction = {
      id: id,
      amount: 42.99,
      date: new Date('2023-04-15'),
      category: this.transactionType === 'income' ? 'salary' : 'food',
      description: this.transactionType === 'income' ? 'Monatsgehalt' : 'Einkauf im Supermarkt',
      isRecurring: false,
      interval: 'monthly'
    };
    
    this.transactionForm.patchValue(mockTransaction);
  }
  
  getFilteredCategories(): Category[] {
    return this.categories.filter(category => category.type === this.transactionType);
  }
  
  onSubmit(): void {
    if (this.transactionForm.invalid) {
      return;
    }
    
    const formValue = this.transactionForm.value;
    
    const formattedDate = formValue.date instanceof Date 
      ? formValue.date.toISOString().split('T')[0] 
      : formValue.date;
    
    let transactionData: any = {
      amount: formValue.amount,
      date: formattedDate,
      category: formValue.category,
      description: formValue.description,
      isRecurring: formValue.isRecurring,
      type: this.transactionType,
      user_id: 'your-user-id' 
    };
    
    if (formValue.isRecurring) {
      transactionData.interval = formValue.interval;
    }
    
    if (this.isEditing) {
      console.log('Update wird noch implementiert');
      this.snackBar.open(
        `${this.transactionType === 'income' ? 'Einnahme' : 'Ausgabe'} wurde aktualisiert`,
        'OK',
        { duration: 3000 }
      );
      this.router.navigate(['/dashboard']);
    } else {
      this.transactionService.createTransaction(transactionData)
        .then(() => {
          this.snackBar.open(
            `${this.transactionType === 'income' ? 'Einnahme' : 'Ausgabe'} wurde gespeichert`,
            'OK',
            { duration: 3000 }
          );
          this.router.navigate(['/dashboard']);
        })
        .catch(error => {
          console.error('Fehler beim Speichern der Transaktion:', error);
          this.snackBar.open('Fehler beim Speichern der Transaktion', 'OK', { duration: 3000 });
        });
    }
  }
  
  onCancel(): void {
    this.router.navigate(['/dashboard']);
  }

  disableArrows(event: KeyboardEvent) {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
    }
  }
}
