import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

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
    MatNativeDateModule
  ],
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit {
  selectedPeriod: string = 'month';
  selectedCategory: string = 'all';
  selectedChart: string = 'spending';
  
  spendingOverTimeData: ChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun'],
    datasets: [
      {
        label: 'Ausgaben',
        data: [1200, 1350, 980, 1400, 1250, 1100],
        borderColor: '#f44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        borderWidth: 2,
        fill: true
      },
      {
        label: 'Einnahmen',
        data: [1800, 1800, 1850, 1900, 1950, 2000],
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderWidth: 2,
        fill: true
      }
    ]
  };
  
  categoryBreakdownData: ChartData = {
    labels: ['Wohnen', 'Lebensmittel', 'Transport', 'Freizeit', 'Sparen', 'Sonstiges'],
    datasets: [
      {
        label: 'Ausgaben nach Kategorie',
        data: [850, 450, 200, 350, 400, 150],
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

  periods: {value: string, label: string}[] = [
    {value: 'month', label: 'Diesen Monat'},
    {value: 'quarter', label: 'Dieses Quartal'},
    {value: '6months', label: 'Letzte 6 Monate'},
    {value: 'year', label: 'Dieses Jahr'},
    {value: 'custom', label: 'Benutzerdefiniert'}
  ];
  
  categories: {value: string, label: string}[] = [
    {value: 'all', label: 'Alle Kategorien'},
    {value: 'housing', label: 'Wohnen'},
    {value: 'food', label: 'Lebensmittel'},
    {value: 'transport', label: 'Transport'},
    {value: 'leisure', label: 'Freizeit'},
    {value: 'savings', label: 'Sparen'}
  ];
  
  charts: {value: string, label: string}[] = [
    {value: 'spending', label: 'Ausgaben/Einnahmen'},
    {value: 'categories', label: 'Kategorien'},
    {value: 'trends', label: 'Trends'},
    {value: 'forecast', label: 'Prognose'}
  ];

  constructor() { }

  ngOnInit(): void {

  }

  applyFilters(): void {
    console.log('Applying filters:', {
      period: this.selectedPeriod,
      category: this.selectedCategory,
      chart: this.selectedChart
    });
  }

  exportData(format: 'pdf' | 'csv' | 'excel'): void {
    console.log(`Exporting data as ${format}`);
  }
}