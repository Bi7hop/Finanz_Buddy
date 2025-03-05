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
import { SupabaseService } from '../../services/supabase.service';

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
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private transactionService: TransactionService,
    private supabaseService: SupabaseService
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
        this.transactionId = Number(params['id']);
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
  
  async loadTransaction(id: string): Promise<void> {
    try {
      console.log('Lade Transaktion mit ID:', id);
      
      const loadingSnackBarRef = this.snackBar.open('Transaktion wird geladen...', '', {
        duration: 0 
      });
      
      const numericId = Number(id);
      
      const transaction = await this.transactionService.getTransactionById(numericId);
      
      if (!transaction) {
        this.snackBar.open('Transaktion nicht gefunden!', 'OK', { duration: 3000 });
        this.router.navigate([this.transactionType === 'income' ? '/einnahmen' : '/ausgaben']);
        return;
      }
      
      console.log('Geladene Transaktion:', transaction);
      
      this.transactionType = transaction.type;
      
      const transactionDate = transaction.date instanceof Date ? 
        transaction.date : 
        new Date(transaction.date);
      
      this.transactionForm.patchValue({
        amount: transaction.amount,
        date: transactionDate,
        category: transaction.category,
        description: transaction.description,
        isRecurring: transaction.isRecurring || false,
        interval: transaction.interval || 'monthly'
      });
      
      this.formTitle = this.transactionType === 'income' ? 'Einnahme bearbeiten' : 'Ausgabe bearbeiten';
      this.submitLabel = this.transactionType === 'income' ? 'Einnahme aktualisieren' : 'Ausgabe aktualisieren';

      loadingSnackBarRef.dismiss();
      
    } catch (error) {
      console.error('Fehler beim Laden der Transaktion:', error);
      this.snackBar.open('Fehler beim Laden der Transaktion', 'OK', { duration: 3000 });
      this.router.navigate([this.transactionType === 'income' ? '/einnahmen' : '/ausgaben']);
    }
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
        console.error('Benutzer nicht authentifiziert:', userError);
        this.snackBar.open('Bitte melde dich erneut an, um fortzufahren', 'OK', { duration: 5000 });
        this.router.navigate(['/login'], { 
          queryParams: { 
            returnUrl: this.router.url 
          } 
        });
        return;
      }
      
      console.log('Authentifizierter Benutzer:', userData.user);
      
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
        console.log('Aktualisiere Transaktion mit ID:', this.transactionId, transactionData);
        
        try {
          await this.transactionService.updateTransaction(this.transactionId, transactionData);
          
          this.snackBar.open(
            `${this.transactionType === 'income' ? 'Einnahme' : 'Ausgabe'} wurde aktualisiert`,
            'OK',
            { duration: 3000 }
          );
          
          this.router.navigate([this.transactionType === 'income' ? '/einnahmen' : '/ausgaben']);
        } catch (updateError) {
          console.error('Fehler beim Aktualisieren der Transaktion:', updateError);
          this.snackBar.open('Fehler beim Aktualisieren: ' + (updateError as Error).message, 'OK', { duration: 5000 });
        }
      } else {
        try {
          await this.transactionService.createTransaction(transactionData);
          
          this.snackBar.open(
            `${this.transactionType === 'income' ? 'Einnahme' : 'Ausgabe'} wurde gespeichert`,
            'OK',
            { duration: 3000 }
          );
          
          this.router.navigate([this.transactionType === 'income' ? '/einnahmen' : '/ausgaben']);
        } catch (createError) {
          console.error('Fehler beim Erstellen der Transaktion:', createError);
          this.snackBar.open('Fehler beim Speichern: ' + (createError as Error).message, 'OK', { duration: 5000 });
        }
      }
    } catch (authError) {
      console.error('Fehler bei der Authentifizierungsprüfung:', authError);
      this.snackBar.open('Authentifizierungsfehler. Bitte erneut anmelden.', 'OK', { duration: 5000 });
      this.router.navigate(['/login'], { 
        queryParams: { 
          returnUrl: this.router.url 
        } 
      });
    }
  }
  
  onCancel(): void {
    this.router.navigate([this.transactionType === 'income' ? '/einnahmen' : '/ausgaben']);
  }

  disableArrows(event: KeyboardEvent) {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
    }
  }
}