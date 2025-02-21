import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BudgetFormComponent } from '../budget-form/budget-form.component';

interface BudgetCategory {
  id: number;
  name: string;
  category: string;
  budgeted: number;
  spent: number;
  remaining: number;
  progressPercentage: number;
  status: 'good' | 'warning' | 'danger';
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
    MatDialogModule
  ],
  templateUrl: './budget.component.html',
  styleUrls: ['./budget.component.scss']
})
export class BudgetComponent implements OnInit {
  currentMonth: string = '';
  currentYear: number = 0;
  totalBudgeted: number = 0;
  totalSpent: number = 0;
  totalRemaining: number = 0;

  budgetCategories: BudgetCategory[] = [];

  constructor(private dialog: MatDialog) { }

  ngOnInit(): void {
    this.updateCurrentMonthDisplay();
    this.loadBudgetData();
  }

  updateCurrentMonthDisplay(): void {
    const now = new Date();
    const months = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    this.currentMonth = months[now.getMonth()];
    this.currentYear = now.getFullYear();
  }

  loadBudgetData(): void {
    this.budgetCategories = [
      {
        id: 1,
        name: 'Lebensmittel',
        category: 'food',
        budgeted: 500,
        spent: 320,
        remaining: 180,
        progressPercentage: 64,
        status: 'good'
      },
      {
        id: 2,
        name: 'Wohnen',
        category: 'housing',
        budgeted: 850,
        spent: 850,
        remaining: 0,
        progressPercentage: 100,
        status: 'warning'
      },
      {
        id: 3,
        name: 'Transport',
        category: 'transport',
        budgeted: 200,
        spent: 140,
        remaining: 60,
        progressPercentage: 70,
        status: 'good'
      },
      {
        id: 4,
        name: 'Freizeit',
        category: 'entertainment',
        budgeted: 300,
        spent: 275,
        remaining: 25,
        progressPercentage: 92,
        status: 'warning'
      },
      {
        id: 5,
        name: 'Sparen',
        category: 'savings',
        budgeted: 400,
        spent: 400,
        remaining: 0,
        progressPercentage: 100,
        status: 'good'
      },
      {
        id: 6,
        name: 'Einkaufen',
        category: 'shopping',
        budgeted: 250,
        spent: 287,
        remaining: -37,
        progressPercentage: 115,
        status: 'danger'
      }
    ];

    this.calculateTotals();
  }

  calculateTotals(): void {
    this.totalBudgeted = this.budgetCategories.reduce((sum, cat) => sum + cat.budgeted, 0);
    this.totalSpent = this.budgetCategories.reduce((sum, cat) => sum + cat.spent, 0);
    this.totalRemaining = this.totalBudgeted - this.totalSpent;
  }

  addBudgetCategory(): void {
    const dialogRef = this.dialog.open(BudgetFormComponent, {
      width: '400px',
      panelClass: 'dark-theme-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('New budget category:', result);
        
        const newCategory: BudgetCategory = {
          id: this.budgetCategories.length + 1,
          name: result.name,
          category: result.category,
          budgeted: result.budgeted,
          spent: 0, 
          remaining: result.budgeted,
          progressPercentage: 0,
          status: 'good'
        };
        
        this.budgetCategories.push(newCategory);
        this.calculateTotals();
      }
    });
  }

  editBudgetCategory(id: number): void {
    const category = this.budgetCategories.find(cat => cat.id === id);
    
    if (!category) {
      return;
    }
    
    const dialogRef = this.dialog.open(BudgetFormComponent, {
      width: '400px',
      panelClass: 'dark-theme-dialog',
      data: {
        id: category.id,
        name: category.name,
        category: category.category,
        budgeted: category.budgeted
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Updated budget category:', result);
        
        const index = this.budgetCategories.findIndex(cat => cat.id === id);
        if (index !== -1) {
          const spent = this.budgetCategories[index].spent;
          const remaining = result.budgeted - spent;
          const progressPercentage = spent / result.budgeted * 100;
          
          let status: 'good' | 'warning' | 'danger' = 'good';
          if (progressPercentage >= 100) {
            status = 'danger';
          } else if (progressPercentage >= 80) {
            status = 'warning';
          }
          
          this.budgetCategories[index] = {
            ...result,
            spent,
            remaining,
            progressPercentage,
            status
          };
          
          this.calculateTotals();
        }
      }
    });
  }

  previousMonth(): void {
  }

  nextMonth(): void {
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
      'misc': 'more_horiz'
    };
    
    return iconMap[category] || 'category';
  }
}