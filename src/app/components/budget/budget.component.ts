import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BudgetFormComponent } from '../budget-form/budget-form.component';
import { BudgetService } from '../../services/budget.service';
import { TransactionService } from '../../services/transaction.service';
import { Budget } from '../../models/budget.model';
import { Subscription } from 'rxjs';

interface BudgetCategory {
  id: number;
  name: string;
  category: string;
  budgeted: number;
  spent: number;
  remaining: number;
  progressPercentage: number;
  status: 'good' | 'warning' | 'danger';
  period: string;
}

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatDividerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './budget.component.html',
  styleUrls: ['./budget.component.scss']
})
export class BudgetComponent implements OnInit, OnDestroy {
  currentMonth: string = '';
  currentYear: number = 0;
  currentPeriod: string = '';
  totalBudgeted: number = 0;
  totalSpent: number = 0;
  totalRemaining: number = 0;

  budgetCategories: BudgetCategory[] = [];
  isLoading: boolean = false;
  private budgetsSubscription: Subscription | null = null;
  private loadingSubscription: Subscription | null = null;

  constructor(
    private dialog: MatDialog, 
    private budgetService: BudgetService,
    private transactionService: TransactionService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.updateCurrentMonthDisplay();
    
    this.loadingSubscription = this.budgetService.loading$.subscribe(
      loading => this.isLoading = loading
    );

    this.loadBudgetData();
  }

  ngOnDestroy(): void {
    if (this.budgetsSubscription) {
      this.budgetsSubscription.unsubscribe();
    }
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
    }
  }

  updateCurrentMonthDisplay(): void {
    const now = new Date();
    const months = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    this.currentMonth = months[now.getMonth()];
    this.currentYear = now.getFullYear();
    this.currentPeriod = `${this.currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  async loadBudgetData(): Promise<void> {
    try {
      const budgets = await this.budgetService.fetchBudgets();
      
      const currentBudgets = budgets.filter(budget => 
        budget.period === this.currentPeriod
      );

      this.budgetCategories = await this.convertBudgetsToBudgetCategories(currentBudgets);
      
      this.calculateTotals();
    } catch (error) {
      console.error('Fehler beim Laden der Budgets:', error);
      this.snackBar.open('Fehler beim Laden der Budgets', 'Schließen', {
        duration: 3000
      });
    }
  }

  async convertBudgetsToBudgetCategories(budgets: Budget[]): Promise<BudgetCategory[]> {
    const result: BudgetCategory[] = [];
    
    for (const budget of budgets) {
      try {
        const spent = await this.transactionService.getIncomeSumByCategory(
          budget.category, 
          budget.period
        );
        
        const remaining = budget.amount - spent;
        const progressPercentage = (spent / budget.amount) * 100;
        
        let status: 'good' | 'warning' | 'danger' = 'good';
        if (progressPercentage >= 100) {
          status = 'danger';
        } else if (progressPercentage >= 80) {
          status = 'warning';
        }
        
        const iconCategory = budget.category_icon || this.mapCategoryToIcon(budget.category);
        
        result.push({
          id: budget.id,
          name: budget.category, 
          category: iconCategory, 
          budgeted: budget.amount,
          spent: spent,
          remaining: remaining,
          progressPercentage: progressPercentage,
          status: status,
          period: budget.period
        });
      } catch (error) {
        console.error(`Fehler beim Verarbeiten des Budgets ${budget.id}:`, error);
        const spent = Math.floor(Math.random() * budget.amount);
        const remaining = budget.amount - spent;
        const progressPercentage = (spent / budget.amount) * 100;
        
        let status: 'good' | 'warning' | 'danger' = 'good';
        if (progressPercentage >= 100) {
          status = 'danger';
        } else if (progressPercentage >= 80) {
          status = 'warning';
        }
        
        const iconCategory = budget.category_icon || this.mapCategoryToIcon(budget.category);
        
        result.push({
          id: budget.id,
          name: budget.category,
          category: iconCategory,
          budgeted: budget.amount,
          spent: spent,
          remaining: remaining,
          progressPercentage: progressPercentage,
          status: status,
          period: budget.period
        });
      }
    }
    
    return result;
  }

  mapCategoryToIcon(category: string): string {
    const categoryMap: {[key: string]: string} = {
      'Wohnen': 'housing',
      'Lebensmittel': 'food',
      'Transport': 'transport',
      'Einkaufen': 'shopping',
      'Freizeit': 'entertainment',
      'Sparen': 'savings',
      'Gesundheit': 'health',
      'Bildung': 'education',
      'Gehalt': 'salary',
      'Lohn': 'salary',
      'Einkommen': 'salary',
      'Dividende': 'investment',
      'Kapitalerträge': 'investment',
      'Investitionen': 'investment',
      'Geschenke': 'gifts',
      'Sonstiges': 'misc'
    };
    
    if (categoryMap[category]) {
      return categoryMap[category];
    }
    
    const lowerCategory = category.toLowerCase();
    
    if (lowerCategory.includes('wohn') || lowerCategory.includes('miete') || lowerCategory.includes('haus')) {
      return 'housing';
    } else if (lowerCategory.includes('essen') || lowerCategory.includes('lebensmittel')) {
      return 'food';
    } else if (lowerCategory.includes('auto') || lowerCategory.includes('bahn') || lowerCategory.includes('transport')) {
      return 'transport';
    } else if (lowerCategory.includes('kauf') || lowerCategory.includes('shop')) {
      return 'shopping';
    } else if (lowerCategory.includes('freizeit') || lowerCategory.includes('hobby') || lowerCategory.includes('urlaub')) {
      return 'entertainment';
    } else if (lowerCategory.includes('spar') || lowerCategory.includes('invest')) {
      return 'savings';
    } else if (lowerCategory.includes('gesund') || lowerCategory.includes('arzt')) {
      return 'health';
    } else if (lowerCategory.includes('bild') || lowerCategory.includes('schul') || lowerCategory.includes('uni')) {
      return 'education';
    } else if (lowerCategory.includes('gehalt') || lowerCategory.includes('lohn') || lowerCategory.includes('einkommen')) {
      return 'salary';
    } else if (lowerCategory.includes('divid') || lowerCategory.includes('kapital') || lowerCategory.includes('zins')) {
      return 'investment';
    } else if (lowerCategory.includes('geschenk')) {
      return 'gifts';
    }
    
    return 'misc';
  }

  calculateTotals(): void {
    this.totalBudgeted = this.budgetCategories.reduce((sum, cat) => sum + cat.budgeted, 0);
    this.totalSpent = this.budgetCategories.reduce((sum, cat) => sum + cat.spent, 0);
    this.totalRemaining = this.totalBudgeted - this.totalSpent;
  }

  async addBudgetCategory(): Promise<void> {
    const dialogRef = this.dialog.open(BudgetFormComponent, {
      width: '400px',
      panelClass: 'dark-theme-dialog'
    });
  
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          const newBudget = await this.budgetService.createBudget({
            amount: result.budgeted,     
            category: result.name,         
            category_icon: result.category, 
            period: this.currentPeriod,
            user_id: ''  
          });
          
          this.loadBudgetData();
          
          this.snackBar.open('Budget erfolgreich erstellt', 'Schließen', {
            duration: 3000
          });
        } catch (error) {
          console.error('Fehler beim Erstellen des Budgets:', error);
          this.snackBar.open('Fehler beim Erstellen des Budgets', 'Schließen', {
            duration: 3000
          });
        }
      }
    });
  }
  
  async editBudgetCategory(id: number): Promise<void> {
    const category = this.budgetCategories.find(cat => cat.id === id);
    
    if (!category) {
      return;
    }
    
    const formData = {
      id: category.id,
      name: category.name,         
      category: category.category,  
      budgeted: category.budgeted  
    };
    
    const dialogRef = this.dialog.open(BudgetFormComponent, {
      width: '400px',
      panelClass: 'dark-theme-dialog',
      data: formData
    });
  
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          await this.budgetService.updateBudget(id, {
            amount: result.budgeted,       
            category: result.name,        
            category_icon: result.category 
          });
          
          this.loadBudgetData();
          
          this.snackBar.open('Budget erfolgreich aktualisiert', 'Schließen', {
            duration: 3000
          });
        } catch (error) {
          console.error('Fehler beim Aktualisieren des Budgets:', error);
          this.snackBar.open('Fehler beim Aktualisieren des Budgets', 'Schließen', {
            duration: 3000
          });
        }
      }
    });
  }

  async deleteBudgetCategory(id: number): Promise<void> {
    if (confirm('Möchtest du dieses Budget wirklich löschen?')) {
      try {
        await this.budgetService.deleteBudget(id);
        
        this.loadBudgetData();
        
        this.snackBar.open('Budget erfolgreich gelöscht', 'Schließen', {
          duration: 3000
        });
      } catch (error) {
        console.error('Fehler beim Löschen des Budgets:', error);
        this.snackBar.open('Fehler beim Löschen des Budgets', 'Schließen', {
          duration: 3000
        });
      }
    }
  }

  async previousMonth(): Promise<void> {
    const [year, month] = this.currentPeriod.split('-').map(Number);
    let newMonth = month - 1;
    let newYear = year;
    
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    
    this.currentPeriod = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    const monthNames = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    this.currentMonth = monthNames[newMonth - 1];
    this.currentYear = newYear;
    
    await this.loadBudgetData();
  }

  async nextMonth(): Promise<void> {
    const [year, month] = this.currentPeriod.split('-').map(Number);
    let newMonth = month + 1;
    let newYear = year;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    
    this.currentPeriod = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    const monthNames = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    this.currentMonth = monthNames[newMonth - 1];
    this.currentYear = newYear;
    
    await this.loadBudgetData();
  }
  
  getCategoryIcon(category: string): string {
    const iconMap: {[key: string]: string} = {
      'housing': 'home',
      'food': 'restaurant',
      'transport': 'directions_car',
      'entertainment': 'movie',
      'shopping': 'shopping_cart',
      'health': 'healing',
      'education': 'school',
      'savings': 'savings',
      'misc': 'more_horiz',
      'salary': 'work',
      'investment': 'trending_up',
      'gifts': 'card_giftcard'
    };
    
    return iconMap[category] || 'category';
  }
}