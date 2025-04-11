import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, MatTooltipModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent {
  constructor(private authService: AuthService) {}
  
  async loginAsGuest() {
    const result = await this.authService.loginAsGuest();
    if (!result.success) {
      console.error('Guest-Login fehlgeschlagen:', result.error);
    }
  }
}