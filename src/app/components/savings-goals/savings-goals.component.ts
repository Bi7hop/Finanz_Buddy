import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

interface SavingsGoal {
  id: string;
  title: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  transactions: Transaction[];
  createdAt: Date;
  notes?: string;
}

interface Transaction {
  id: string;
  amount: number;
  date: Date;
  note?: string;
}

interface Category {
  value: string;
  name: string;
  icon: string;
}

@Component({
  selector: 'app-savings-goals',
  templateUrl: './savings-goals.component.html',
  styleUrls: ['./savings-goals.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule
  ]
})
export class SavingsGoalsComponent implements OnInit {
  @ViewChild('goalDetailsTemplate') goalDetailsTemplate!: TemplateRef<any>;
  @ViewChild('goalFormTemplate') goalFormTemplate!: TemplateRef<any>;
  @ViewChild('transactionFormTemplate') transactionFormTemplate!: TemplateRef<any>;

  savingsGoals: SavingsGoal[] = [];
  selectedGoal: SavingsGoal = {} as SavingsGoal;
  
  goalForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    category: ['', Validators.required],
    targetAmount: [1000, [Validators.required, Validators.min(1)]],
    startAmount: [0, [Validators.min(0)]],
    notes: ['']
  });

  transactionForm: FormGroup = this.fb.group({
    amount: [100, [Validators.required, Validators.min(0.01)]],
    date: [new Date(), Validators.required],
    note: ['']
  });

  editMode = false;
  
  categories: Category[] = [
    { value: 'vacation', name: 'Urlaub', icon: 'beach_access' },
    { value: 'car', name: 'Auto', icon: 'directions_car' },
    { value: 'home', name: 'Wohnung/Haus', icon: 'home' },
    { value: 'tech', name: 'Elektronik', icon: 'devices' },
    { value: 'education', name: 'Bildung', icon: 'school' },
    { value: 'emergency', name: 'Notfallfonds', icon: 'health_and_safety' },
    { value: 'retirement', name: 'Altersvorsorge', icon: 'savings' },
    { value: 'other', name: 'Sonstiges', icon: 'attach_money' }
  ];

  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.loadSampleData();
  }

  // Beispieldaten laden (später durch Supabase ersetzt)
  loadSampleData(): void {
    this.savingsGoals = [
      {
        id: '1',
        title: 'Traumurlaub Thailand',
        category: 'vacation',
        targetAmount: 3000,
        currentAmount: 1350,
        createdAt: new Date(2023, 5, 15),
        transactions: [
          { id: '1-1', amount: 500, date: new Date(2023, 5, 15), note: 'Startbetrag' },
          { id: '1-2', amount: 250, date: new Date(2023, 6, 10), note: 'Monatsrate Juni' },
          { id: '1-3', amount: 300, date: new Date(2023, 7, 12), note: 'Monatsrate Juli' },
          { id: '1-4', amount: 300, date: new Date(2023, 8, 10), note: 'Monatsrate August' }
        ]
      },
      {
        id: '2',
        title: 'Notfallfonds',
        category: 'emergency',
        targetAmount: 5000,
        currentAmount: 4200,
        createdAt: new Date(2023, 2, 5),
        notes: 'Für unerwartete Ausgaben',
        transactions: [
          { id: '2-1', amount: 1000, date: new Date(2023, 2, 5), note: 'Startbetrag' },
          { id: '2-2', amount: 500, date: new Date(2023, 3, 5), note: 'Monatsrate März' },
          { id: '2-3', amount: 500, date: new Date(2023, 4, 5), note: 'Monatsrate April' },
          { id: '2-4', amount: 700, date: new Date(2023, 5, 5), note: 'Monatsrate Mai' },
          { id: '2-5', amount: 500, date: new Date(2023, 6, 5), note: 'Monatsrate Juni' },
          { id: '2-6', amount: 500, date: new Date(2023, 7, 5), note: 'Monatsrate Juli' },
          { id: '2-7', amount: 500, date: new Date(2023, 8, 5), note: 'Monatsrate August' }
        ]
      },
      {
        id: '3',
        title: 'Neues MacBook Pro',
        category: 'tech',
        targetAmount: 2500,
        currentAmount: 750,
        createdAt: new Date(2023, 7, 1),
        transactions: [
          { id: '3-1', amount: 500, date: new Date(2023, 7, 1), note: 'Startbetrag' },
          { id: '3-2', amount: 250, date: new Date(2023, 8, 1), note: 'Monatsrate August' }
        ]
      }
    ];
  }

  getCategoryIcon(categoryValue: string | undefined): string {
    if (!categoryValue) return 'attach_money';
    const category = this.categories.find(c => c.value === categoryValue);
    return category ? category.icon : 'attach_money';
  }

  getCategoryName(categoryValue: string | undefined): string {
    if (!categoryValue) return 'Sonstiges';
    const category = this.categories.find(c => c.value === categoryValue);
    return category ? category.name : 'Sonstiges';
  }

  getTimeToGoal(goal: SavingsGoal | undefined): string {
    if (!goal) return 'Keine Daten vorhanden';

    if (goal.currentAmount >= goal.targetAmount) {
      return 'completed';
    }

    if (!goal.transactions || goal.transactions.length < 2) {
      return 'Zu wenig Daten für eine Prognose';
    }

    const transactions = [...goal.transactions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    const newestDate = new Date(transactions[0].date);
    const oldestDate = new Date(transactions[transactions.length - 1].date);
    
    const monthsDiff = this.getMonthDifference(oldestDate, newestDate);
    
    if (monthsDiff === 0) {
      return 'Zu kurze Zeitspanne für eine Prognose';
    }

    const monthlyAmount = goal.currentAmount / monthsDiff;
    
    const remaining = goal.targetAmount - goal.currentAmount;
    const monthsRemaining = Math.ceil(remaining / monthlyAmount);
    
    if (monthsRemaining <= 0) {
      return 'Bald erreicht';
    }
    
    if (monthsRemaining <= 1) {
      return 'Etwa 1 Monat';
    } else if (monthsRemaining < 12) {
      return `Etwa ${monthsRemaining} Monate`;
    } else {
      const years = Math.floor(monthsRemaining / 12);
      const months = monthsRemaining % 12;
      
      if (months === 0) {
        return `Etwa ${years} Jahr${years !== 1 ? 'e' : ''}`;
      } else {
        return `Etwa ${years} Jahr${years !== 1 ? 'e' : ''} und ${months} Monat${months !== 1 ? 'e' : ''}`;
      }
    }
  }

  getAverageMonthlyAmount(goal: SavingsGoal | undefined): number {
    if (!goal || !goal.transactions || goal.transactions.length === 0) {
      return 0;
    }

    const transactions = [...goal.transactions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    if (transactions.length < 2) {
      return transactions[0].amount;
    }

    const newestDate = new Date(transactions[0].date);
    const oldestDate = new Date(transactions[transactions.length - 1].date);
    
    const monthsDiff = this.getMonthDifference(oldestDate, newestDate);
    
    if (monthsDiff === 0) {
      return goal.currentAmount;
    }

    return goal.currentAmount / monthsDiff;
  }

  getMonthDifference(startDate: Date, endDate: Date): number {
    const yearDiff = endDate.getFullYear() - startDate.getFullYear();
    const monthDiff = endDate.getMonth() - startDate.getMonth();
    return yearDiff * 12 + monthDiff + 1;
  }

  openGoalDetails(goal: SavingsGoal): void {
    this.selectedGoal = { ...goal };
    this.dialog.open(this.goalDetailsTemplate, {
      width: '600px',
      panelClass: 'dark-theme-dialog'
    });
  }

  openNewGoalDialog(): void {
    this.editMode = false;
    this.goalForm.reset({
      title: '',
      category: '',
      targetAmount: 1000,
      startAmount: 0,
      notes: ''
    });
    
    this.dialog.open(this.goalFormTemplate, {
      width: '500px',
      panelClass: 'dark-theme-dialog'
    });
  }

  editGoal(): void {
    this.openEditGoalDialog();
  }

  openEditGoalDialog(): void {
    this.editMode = true;
    this.goalForm.setValue({
      title: this.selectedGoal.title,
      category: this.selectedGoal.category,
      targetAmount: this.selectedGoal.targetAmount,
      startAmount: 0, 
      notes: this.selectedGoal.notes || ''
    });
    
    this.dialog.open(this.goalFormTemplate, {
      width: '500px',
      panelClass: 'dark-theme-dialog'
    });
  }

  openAddTransactionDialog(): void {
    this.transactionForm.reset({
      amount: 100,
      date: new Date(),
      note: ''
    });
    
    this.dialog.open(this.transactionFormTemplate, {
      width: '400px',
      panelClass: 'dark-theme-dialog'
    });
  }

  closeDialog(): void {
    this.dialog.closeAll();
  }

  // CRUD-Operationen (später mit Supabase verbinden)
  saveGoal(): void {
    if (this.goalForm.invalid) return;

    const formValue = this.goalForm.value;
    
    if (this.editMode) {

      const updatedGoal = {
        ...this.selectedGoal,
        title: formValue.title,
        category: formValue.category,
        targetAmount: formValue.targetAmount,
        notes: formValue.notes
      };
      
      const index = this.savingsGoals.findIndex(g => g.id === this.selectedGoal.id);
      if (index !== -1) {
        this.savingsGoals[index] = updatedGoal;
        this.selectedGoal = updatedGoal;
      }
    } else {
  
      const newGoal: SavingsGoal = {
        id: Date.now().toString(), 
        title: formValue.title,
        category: formValue.category,
        targetAmount: formValue.targetAmount,
        currentAmount: formValue.startAmount || 0,
        createdAt: new Date(),
        notes: formValue.notes,
        transactions: []
      };
      
      if (formValue.startAmount > 0) {
        newGoal.transactions.push({
          id: `${newGoal.id}-1`,
          amount: formValue.startAmount,
          date: new Date(),
          note: 'Startbetrag'
        });
      }
      
      this.savingsGoals.push(newGoal);
    }
    
    this.closeDialog();
  }

  saveTransaction(): void {
    if (this.transactionForm.invalid) return;

    const formValue = this.transactionForm.value;
    
    const newTransaction: Transaction = {
      id: `${this.selectedGoal.id}-${Date.now()}`,
      amount: formValue.amount,
      date: formValue.date,
      note: formValue.note
    };
    
    this.selectedGoal.transactions.push(newTransaction);
    this.selectedGoal.currentAmount += formValue.amount;
    
    const index = this.savingsGoals.findIndex(g => g.id === this.selectedGoal.id);
    if (index !== -1) {
      this.savingsGoals[index] = { ...this.selectedGoal };
    }
    
    this.closeDialog();
  }

  deleteGoal(): void {
    if (confirm('Möchtest du dieses Sparziel wirklich löschen?')) {
      this.savingsGoals = this.savingsGoals.filter(g => g.id !== this.selectedGoal.id);
      this.closeDialog();
    }
  }
}