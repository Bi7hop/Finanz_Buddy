import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, NativeDateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TransactionService } from '../../services/transaction.service';
import { SupabaseService } from '../../services/supabase.service';

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
}

export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD.MM.YYYY',
  },
  display: {
    dateInput: 'DD.MM.YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-transaction-modal',
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
    MatIconModule,
    MatDialogModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'de-DE' },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    { provide: DateAdapter, useClass: NativeDateAdapter }
  ],
  templateUrl: './transaction-modal.html',
  styleUrls: ['./transaction-modal.scss']
})
export class TransactionModalComponent implements OnInit {
  transactionForm!: FormGroup;
  formTitle: string = 'Neue Transaktion';
  submitLabel: string = 'Speichern';
  transactionType: 'income' | 'expense' = 'expense';
  isEditing: boolean = false;
  transactionId: number | null = null;

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
    private dialogRef: MatDialogRef<TransactionModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar,
    private transactionService: TransactionService,
    private supabaseService: SupabaseService
  ) {}

  ngOnInit(): void {
    this.initializeForm();

    if (this.data) {
      this.transactionType = this.data.type || 'expense';
      
      if (this.data.transaction) {
        this.isEditing = true;
        this.transactionId = this.data.transaction.id;
        this.loadTransaction(this.data.transaction);
      }

      this.formTitle = this.isEditing 
        ? (this.transactionType === 'income' ? 'Einnahme bearbeiten' : 'Ausgabe bearbeiten')
        : (this.transactionType === 'income' ? 'Neue Einnahme' : 'Neue Ausgabe');
      
      this.submitLabel = this.isEditing 
        ? (this.transactionType === 'income' ? 'Einnahme aktualisieren' : 'Ausgabe aktualisieren')
        : (this.transactionType === 'income' ? 'Einnahme speichern' : 'Ausgabe speichern');
    }
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

  loadTransaction(transaction: any): void {
    const transactionDate = transaction.date instanceof Date 
      ? transaction.date 
      : new Date(transaction.date);
    
    this.transactionForm.patchValue({
      amount: transaction.amount,
      date: transactionDate,
      category: transaction.category,
      description: transaction.description,
      isRecurring: transaction.isRecurring || false,
      interval: transaction.interval || 'monthly'
    });
  }

  getFilteredCategories(): Category[] {
    return this.categories.filter(category => category.type === this.transactionType);
  }

  async onSubmit(): Promise<void> {
    if (this.transactionForm.invalid) {
      return;
    }
    
    try {
      const { data: userData, error: userError } = await this.supabaseService.supabaseClient.auth.getUser();
      
      if (userError || !userData.user) {
        this.snackBar.open('Bitte melde dich erneut an, um fortzufahren', 'OK', { duration: 5000 });
        this.dialogRef.close(null);
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
        user_id: userData.user.id 
      };
      
      if (formValue.isRecurring) {
        transactionData.interval = formValue.interval;
      }
      
      if (this.isEditing && this.transactionId) {
        await this.transactionService.updateTransaction(this.transactionId, transactionData);
        this.snackBar.open(
          `${this.transactionType === 'income' ? 'Einnahme' : 'Ausgabe'} wurde aktualisiert`,
          'OK',
          { duration: 3000 }
        );
      } else {
        await this.transactionService.createTransaction(transactionData);
        this.snackBar.open(
          `${this.transactionType === 'income' ? 'Einnahme' : 'Ausgabe'} wurde gespeichert`,
          'OK',
          { duration: 3000 }
        );
      }
      
      this.dialogRef.close(transactionData);
    } catch (error) {
      console.error('Fehler bei der Transaktion:', error);
      this.snackBar.open('Fehler: ' + (error as Error).message, 'OK', { duration: 5000 });
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}