import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-not-implemented',
  templateUrl: './not-implemented.component.html',
  styleUrls: ['./not-implemented.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class NotImplementedComponent {
  
  constructor(private location: Location) {}
  
  goBack(): void {
    this.location.back();
  }
}