import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Chart, registerables } from 'chart.js';
import { SupabaseService } from '../../services/supabase.service';
import { Transaction } from '../../models/transaction.model';
import { MatTooltipModule } from '@angular/material/tooltip';


Chart.register(...registerables);

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
    fill?: boolean;
  }[];
}

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule
  ],
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit, AfterViewInit {
  @ViewChild('incomeExpenseChart', { static: false }) incomeExpenseChart!: ElementRef;
  @ViewChild('categoryChart', { static: false }) categoryChart!: ElementRef;
  @ViewChild('stackedCategoryExpensesChart', { static: false }) stackedCategoryExpensesChart!: ElementRef;
  @ViewChild('individualCategoryTrendsChart', { static: false }) individualCategoryTrendsChart!: ElementRef;
  @ViewChild('forecastChart', { static: false }) forecastChart!: ElementRef;

  incomeExpenseChartInstance: Chart | null = null;
  categoryChartInstance: Chart | null = null;
  stackedCategoryExpensesChartInstance: Chart | null = null;
  individualCategoryTrendsChartInstance: Chart | null = null;
  forecastChartInstance: Chart | null = null;

  selectedPeriod: string = 'month';
  selectedCategory: string = 'all';
  selectedChart: string = 'spending';

  spendingOverTimeData: ChartData = {
    labels: [],
    datasets: [
      {
        label: 'Ausgaben',
        data: [],
        borderColor: '#f44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        borderWidth: 2,
        fill: true
      },
      {
        label: 'Einnahmen',
        data: [],
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderWidth: 2,
        fill: true
      }
    ]
  };

  categoryBreakdownData: ChartData = {
    labels: [],
    datasets: [
      {
        label: 'Ausgaben nach Kategorie',
        data: [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)'
        ],
        borderWidth: 1
      }
    ]
  };

  stackedCategoryExpensesData: ChartData = {
    labels: [],
    datasets: []
  };

  individualCategoryTrendsData: ChartData = {
    labels: [],
    datasets: []
  };

  forecastData: ChartData = {
    labels: [],
    datasets: [
      {
        label: 'Prognostizierte Ausgaben',
        data: [],
        borderColor: '#f44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        borderWidth: 2,
        fill: true
      },
      {
        label: 'Prognostizierte Einnahmen',
        data: [],
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderWidth: 2,
        fill: true
      },
      {
        label: 'Prognostizierter Saldo',
        data: [],
        borderColor: '#2196f3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        borderWidth: 2,
        fill: true
      }
    ]
  };

  averageMonthlyBalance: number = 0;
  categoryAverages: { category: string, amount: number }[] = [];
  Object = Object; 

  periods: { value: string, label: string }[] = [
    { value: 'month', label: 'Diesen Monat' },
    { value: 'quarter', label: 'Dieses Quartal' },
    { value: '6months', label: 'Letzte 6 Monate' },
    { value: 'year', label: 'Dieses Jahr' },
    { value: 'custom', label: 'Benutzerdefiniert' }
  ];

  categories: { value: string, label: string }[] = [
    { value: 'all', label: 'Alle Kategorien' },
    { value: 'Wohnen', label: 'Wohnen' },
    { value: 'Lebensmittel', label: 'Lebensmittel' },
    { value: 'Transport', label: 'Transport' },
    { value: 'Freizeit', label: 'Freizeit' },
    { value: 'Sparen', label: 'Sparen' },
    { value: 'Gehalt', label: 'Gehalt' },
    { value: 'Sonstiges', label: 'Sonstiges' }
  ];

  charts: { value: string, label: string }[] = [
    { value: 'spending', label: 'Ausgaben/Einnahmen' },
    { value: 'categories', label: 'Kategorien' },
    { value: 'trends', label: 'Trends' },
    { value: 'forecast', label: 'Prognose' }
  ];

  constructor(private renderer: Renderer2, private supabaseService: SupabaseService) { }

  ngOnInit(): void {
    this.updateChartData();
  }

  ngAfterViewInit(): void {
    this.fixTabLabels();
    this.initializeCharts();
  }

  private fixTabLabels(): void {
    const tabLabels = document.querySelectorAll('.mdc-tab__text-label');
    tabLabels.forEach(label => {
      this.renderer.setStyle(label, 'color', 'white');
      this.renderer.setStyle(label, 'opacity', '1');
      this.renderer.setStyle(label, 'font-weight', '500');
    });

    const tabGroup = document.querySelector('mat-tab-group');
    if (tabGroup) {
      const observer = new MutationObserver(() => {
        const activeTab = document.querySelector('.mdc-tab--active .mdc-tab__text-label');
        if (activeTab) {
          this.renderer.setStyle(activeTab, 'color', 'white');
          this.renderer.setStyle(activeTab, 'opacity', '1');
          this.renderer.setStyle(activeTab, 'font-weight', 'bold');
          this.renderer.setStyle(activeTab, 'text-shadow', '0 0 8px rgba(255, 255, 255, 0.8)');
        }
      });

      observer.observe(tabGroup, {
        attributes: true,
        childList: true,
        subtree: true
      });
    }
  }

  async loadTransactionData(period: string = this.selectedPeriod, category: string = this.selectedCategory): Promise<Transaction[]> {
    let startDate: Date;
    let endDate: Date;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    switch (period) {
      case 'month':
        startDate = new Date(currentYear, currentMonth, 1);
        endDate = new Date(currentYear, currentMonth + 1, 0);
        break;
      case 'quarter':
        const startQuarterMonth = Math.floor(currentMonth / 3) * 3;
        startDate = new Date(currentYear, startQuarterMonth, 1);
        endDate = new Date(currentYear, startQuarterMonth + 3, 0);
        break;
      case '6months':
        startDate = new Date(currentYear, currentMonth - 6, 1);
        endDate = new Date(currentYear, currentMonth + 1, 0);
        break;
      case 'year':
        startDate = new Date(currentYear, 0, 1);
        endDate = new Date(currentYear, 11, 31);
        break;
      case 'custom':
        return [];
      default:
        startDate = new Date(currentYear, currentMonth, 1);
        endDate = new Date(currentYear, currentMonth + 1, 0);
        break;
    }

    let query: any = this.supabaseService.from('transactions')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (category !== 'all' && typeof query.eq === 'function') {
      query = query.eq('category', category);
    }

    try {
      const { data, error } = await query;

      if (error) {
        console.error('Fehler beim Laden der Transaktionen:', error);
        return [];
      }

      return data as Transaction[];
    } catch (error) {
      console.error('Unerwarteter Fehler beim Laden der Transaktionen:', error);
      return [];
    }
  }

  async updateChartData(): Promise<void> {
    const transactions = await this.loadTransactionData();
    this.processTransactionDataForCharts(transactions);
    this.processStackedCategoryExpensesData(transactions);
    this.processIndividualCategoryTrendsData(transactions);
    this.processForecastData(transactions);
    this.createIncomeExpenseChart();
    this.createCategoryChart();
    this.createStackedCategoryExpensesChart();
    this.createIndividualCategoryTrendsChart();
    this.createForecastChart();
  }

  processTransactionDataForCharts(transactions: Transaction[]): void {
    const monthlyData: { [key: string]: { income: number; expense: number } } = {};
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { income: 0, expense: 0 };
      }
      if (transaction.type === 'income') {
        monthlyData[monthYear].income += transaction.amount;
      } else if (transaction.type === 'expense') {
        monthlyData[monthYear].expense += transaction.amount;
      }
    });

    this.spendingOverTimeData.labels = Object.keys(monthlyData).sort();
    this.spendingOverTimeData.datasets[0].data = this.spendingOverTimeData.labels.map(month => monthlyData[month]?.expense || 0);
    this.spendingOverTimeData.datasets[1].data = this.spendingOverTimeData.labels.map(month => monthlyData[month]?.income || 0);

    const categoryData: { [key: string]: number } = {};
    transactions
      .filter(transaction => transaction.type === 'expense')
      .forEach(transaction => {
        categoryData[transaction.category] = (categoryData[transaction.category] || 0) + transaction.amount;
      });

    this.categoryBreakdownData.labels = Object.keys(categoryData);
    this.categoryBreakdownData.datasets[0].data = Object.values(categoryData);

    if (this.categoryBreakdownData.labels.length > 0) {
      this.categoryBreakdownData.datasets[0].backgroundColor = this.generateColors(this.categoryBreakdownData.labels.length);
    }
  }

  processStackedCategoryExpensesData(transactions: Transaction[]): void {
    const monthlyCategoryExpenses: { [monthYear: string]: { [category: string]: number } } = {};
    const allCategories = [...new Set(transactions.map(t => t.category))];

    transactions.filter(t => t.type === 'expense').forEach(transaction => {
      const date = new Date(transaction.date);
      const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!monthlyCategoryExpenses[monthYear]) {
        monthlyCategoryExpenses[monthYear] = {};
      }
      monthlyCategoryExpenses[monthYear][transaction.category] =
        (monthlyCategoryExpenses[monthYear][transaction.category] || 0) + transaction.amount;
    });

    this.stackedCategoryExpensesData.labels = Object.keys(monthlyCategoryExpenses).sort();
    this.stackedCategoryExpensesData.datasets = allCategories.map(category => ({
      label: category,
      data: this.stackedCategoryExpensesData.labels.map(month => monthlyCategoryExpenses[month]?.[category] || 0),
      backgroundColor: this.generateColorForCategory(category)
    }));
  }

  processIndividualCategoryTrendsData(transactions: Transaction[], categoriesToShow: string[] = ['Lebensmittel', 'Wohnen', 'Freizeit']): void {
    const monthlyCategoryExpenses: { [monthYear: string]: { [category: string]: number } } = {};
    const allMonths = [...new Set(transactions.map(t => {
      const date = new Date(t.date);
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    }))].sort();
    this.individualCategoryTrendsData.labels = allMonths;
    this.individualCategoryTrendsData.datasets = categoriesToShow.map(category => {
      const categoryMonthlyData: number[] = allMonths.map(month => {
        return transactions
          .filter(t => t.type === 'expense' && t.category === category && `${new Date(t.date).getFullYear()}-${(new Date(t.date).getMonth() + 1).toString().padStart(2, '0')}` === month)
          .reduce((sum, t) => sum + t.amount, 0);
      });
      return {
        label: category,
        data: categoryMonthlyData,
        borderColor: this.generateColorForCategory(category),
        borderWidth: 2,
        fill: false
      };
    });
  }

  processForecastData(transactions: Transaction[]): void {
    const monthlyData: { [key: string]: { income: number; expense: number } } = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { income: 0, expense: 0 };
      }
      
      if (transaction.type === 'income') {
        monthlyData[monthYear].income += transaction.amount;
      } else if (transaction.type === 'expense') {
        monthlyData[monthYear].expense += transaction.amount;
      }
    });

    const months = Object.keys(monthlyData);
    const totalMonths = months.length || 1; 
    
    const averageIncome = months.reduce((sum, month) => sum + monthlyData[month].income, 0) / totalMonths;
    const averageExpense = months.reduce((sum, month) => sum + monthlyData[month].expense, 0) / totalMonths;
    
    this.averageMonthlyBalance = averageIncome - averageExpense;

    const categoryData: { [key: string]: { total: number, count: number } } = {};
    
    transactions
      .filter(transaction => transaction.type === 'expense')
      .forEach(transaction => {
        if (!categoryData[transaction.category]) {
          categoryData[transaction.category] = { total: 0, count: 0 };
        }
        categoryData[transaction.category].total += transaction.amount;
        categoryData[transaction.category].count += 1;
      });
    
    this.categoryAverages = Object.keys(categoryData).map(category => ({
      category,
      amount: categoryData[category].total / (totalMonths || 1) 
    })).sort((a, b) => b.amount - a.amount); 

    const now = new Date();
    const forecastMonths: string[] = [];
    const forecastExpenses: number[] = [];
    const forecastIncomes: number[] = [];
    const forecastBalances: number[] = [];
    
    const expenseSlope = this.calculateTrend(months, months.map(m => monthlyData[m].expense));
    const incomeSlope = this.calculateTrend(months, months.map(m => monthlyData[m].income));
    
    for (let i = 1; i <= 6; i++) {
      const forecastDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const forecastMonthYear = `${forecastDate.getFullYear()}-${(forecastDate.getMonth() + 1).toString().padStart(2, '0')}`;
      
      const forecastedExpense = Math.max(0, averageExpense + (expenseSlope * i));
      const forecastedIncome = Math.max(0, averageIncome + (incomeSlope * i));
      const forecastedBalance = forecastedIncome - forecastedExpense;
      
      forecastMonths.push(forecastMonthYear);
      forecastExpenses.push(forecastedExpense);
      forecastIncomes.push(forecastedIncome);
      forecastBalances.push(forecastedBalance);
    }
    
    this.forecastData.labels = forecastMonths;
    this.forecastData.datasets[0].data = forecastExpenses;
    this.forecastData.datasets[1].data = forecastIncomes;
    this.forecastData.datasets[2].data = forecastBalances;
  }

  calculateTrend(months: string[], values: number[]): number {
    if (months.length <= 1) return 0;
    
    const x = months.map((_, i) => i);
    const y = values;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, x_i, i) => sum + x_i * y[i], 0);
    const sumXX = x.reduce((sum, x_i) => sum + x_i * x_i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    return slope;
  }

  generateColors(numColors: number): string[] {
    const colors = [];
    for (let i = 0; i < numColors; i++) {
      const r = Math.floor(Math.random() * 150) + 100;
      const g = Math.floor(Math.random() * 150) + 100;
      const b = Math.floor(Math.random() * 150) + 100;
      colors.push(`rgba(${r}, ${g}, ${b}, 0.7)`);
    }
    return colors;
  }

  generateColorForCategory(category: string): string {
    const colorMap: { [key: string]: string } = {
      'Wohnen': 'rgba(255, 99, 132, 0.7)',
      'Lebensmittel': 'rgba(54, 162, 235, 0.7)',
      'Transport': 'rgba(255, 206, 86, 0.7)',
      'Freizeit': 'rgba(75, 192, 192, 0.7)',
      'Sparen': 'rgba(153, 102, 255, 0.7)',
      'Gehalt': 'rgba(255, 205, 86, 0.7)',
      'Sonstiges': 'rgba(255, 159, 64, 0.7)'
    };
    return colorMap[category] || this.generateColors(1)[0];
  }

  private areChartsReady(): boolean {
    return !!this.incomeExpenseChart && !!this.incomeExpenseChart.nativeElement &&
           !!this.categoryChart && !!this.categoryChart.nativeElement &&
           !!this.stackedCategoryExpensesChart && !!this.stackedCategoryExpensesChart.nativeElement &&
           !!this.individualCategoryTrendsChart && !!this.individualCategoryTrendsChart.nativeElement &&
           !!this.forecastChart && !!this.forecastChart.nativeElement;
  }

  private initializeCharts(): void {
    if (this.areChartsReady()) {
      this.createIncomeExpenseChart();
      this.createCategoryChart();
      this.createStackedCategoryExpensesChart();
      this.createIndividualCategoryTrendsChart();
      this.createForecastChart();
    } else {
      setTimeout(() => this.initializeCharts(), 50);
    }
  }

  createIncomeExpenseChart(): void {
    if (!this.incomeExpenseChart || !this.incomeExpenseChart.nativeElement) return;

    const ctx = this.incomeExpenseChart.nativeElement.getContext('2d');
    if (this.incomeExpenseChartInstance) {
      this.incomeExpenseChartInstance.destroy();
    }
    this.incomeExpenseChartInstance = new Chart(ctx, {
      type: 'line',
      data: this.spendingOverTimeData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: 'white'
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: 'white'
            },
            grid: {
              color: 'rgba(255,255,255,0.1)'
            }
          },
          y: {
            ticks: {
              color: 'white'
            },
            grid: {
              color: 'rgba(255,255,255,0.1)'
            }
          }
        }
      }
    });
  }

  createCategoryChart(): void {
    if (!this.categoryChart || !this.categoryChart.nativeElement) return;

    const ctx = this.categoryChart.nativeElement.getContext('2d');
    if (this.categoryChartInstance) {
      this.categoryChartInstance.destroy();
    }
    this.categoryChartInstance = new Chart(ctx, {
      type: 'pie',
      data: this.categoryBreakdownData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'right',
            labels: {
              color: 'white'
            }
          }
        }
      }
    });
  }

  createStackedCategoryExpensesChart(): void {
    if (!this.stackedCategoryExpensesChart || !this.stackedCategoryExpensesChart.nativeElement) return;

    const ctx = this.stackedCategoryExpensesChart.nativeElement.getContext('2d');
    if (this.stackedCategoryExpensesChartInstance) {
      this.stackedCategoryExpensesChartInstance.destroy();
    }
    this.stackedCategoryExpensesChartInstance = new Chart(ctx, {
      type: 'bar', 
      data: this.stackedCategoryExpensesData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            ticks: { color: 'white' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          },
          y: {
            stacked: true,
            ticks: { color: 'white' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          },
        },
        plugins: {
          legend: {
            display: true,
            labels: { color: 'white' }
          }
        }
      }
    });
  }

  createIndividualCategoryTrendsChart(): void {
    if (!this.individualCategoryTrendsChart || !this.individualCategoryTrendsChart.nativeElement) return;

    const ctx = this.individualCategoryTrendsChart.nativeElement.getContext('2d');
    if (this.individualCategoryTrendsChartInstance) {
      this.individualCategoryTrendsChartInstance.destroy();
    }
    this.individualCategoryTrendsChartInstance = new Chart(ctx, {
      type: 'line',
      data: this.individualCategoryTrendsData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: { color: 'white' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          },
          y: {
            ticks: { color: 'white' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          }
        },
        plugins: {
          legend: {
            display: true,
            labels: { color: 'white' }
          }
        }
      }
    });
  }

  createForecastChart(): void {
    if (!this.forecastChart || !this.forecastChart.nativeElement) return;

    const ctx = this.forecastChart.nativeElement.getContext('2d');
    if (this.forecastChartInstance) {
      this.forecastChartInstance.destroy();
    }
    
    this.forecastChartInstance = new Chart(ctx, {
      type: 'line',
      data: this.forecastData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: 'white'
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} €`;
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: 'white'
            },
            grid: {
              color: 'rgba(255,255,255,0.1)'
            }
          },
          y: {
            ticks: {
              color: 'white',
              callback: function(value) {
                return value + ' €';
              }
            },
            grid: {
              color: 'rgba(255,255,255,0.1)'
            }
          }
        }
      }
    });
  }

  async applyFilters(): Promise<void> {
    console.log('Applying filters:', {
      period: this.selectedPeriod,
      category: this.selectedCategory,
      chart: this.selectedChart
    });
    await this.updateChartData();
  }

  exportData(format: 'pdf' | 'csv' | 'excel'): void {
    console.log(`Exporting data as ${format}`);
  }
}