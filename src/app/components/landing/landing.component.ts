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
  constructor(private authService: AuthService) {
    this.checkForInvalidSession();
  }
  
  private async checkForInvalidSession() {
    try {
      const currentUser = this.authService.getCurrentUser();
      
      if (currentUser) {
        const isValid = await this.authService.validateSession();
        
        if (!isValid) {
          await this.authService.signOut();
        }
      }
    } catch (err) {}
  }
  
  async loginAsGuest() {
    try {
      await this.checkForInvalidSession();
      
      const result = await this.authService.loginAsGuest();
      
      if (!result.success) {
        if (result.error && String(result.error).includes('already logged in')) {
          await this.authService.signOut();
          await this.authService.loginAsGuest();
        }
      }
    } catch (error) {}
  }
}
