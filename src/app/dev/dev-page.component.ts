import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-dev-page',
  templateUrl: './dev-page.component.html',
  imports: [CardModule, ButtonModule, FaIconComponent],
  host: {
    class: 'h-full block',
  },
})
export class DevPageComponent {
  constructor(private readonly router: Router) {}

  goToUpdaterTest(): void {
    void this.router.navigate(['/app/dev/test-updater']);
  }
}
