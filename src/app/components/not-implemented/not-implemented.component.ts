import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-not-implemented',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="not-implemented-container">
      <mat-card class="feature-card">
        <mat-icon class="feature-icon">construction</mat-icon>
        <h1>Feature in Entwicklung</h1>
        <p>{{ featureName }} ist momentan noch nicht verfügbar.</p>
        <p class="description">Wir arbeiten daran, dieses Feature so schnell wie möglich zur Verfügung zu stellen.</p>
        <button mat-flat-button color="primary" (click)="goBack()">
          Zurück zum Dashboard
        </button>
      </mat-card>
    </div>
  `,
  styles: [`
    .not-implemented-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      background-color: #1e3045;
      padding: 20px;
    }
    
    .feature-card {
      max-width: 500px;
      padding: 40px;
      text-align: center;
      background-color: rgba(255, 255, 255, 0.05);
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }
    
    .feature-icon {
      font-size: 64px;
      height: 64px;
      width: 64px;
      margin-bottom: 24px;
      color: #ff9800;
    }
    
    h1 {
      font-size: 24px;
      font-weight: 400;
      margin-bottom: 16px;
    }
    
    p {
      margin-bottom: 8px;
      font-size: 16px;
    }
    
    .description {
      margin-bottom: 32px;
      opacity: 0.7;
    }
    
    button {
      background-color: #4caf50;
    }
  `]
})
export class NotImplementedComponent implements OnInit {
  featureName: string = 'Dieses Feature';
  
  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}
  
  ngOnInit(): void {
    this.route.data.subscribe(data => {
      if (data && data['featureName']) {
        this.featureName = data['featureName'];
      }
    });
  }
  
  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}