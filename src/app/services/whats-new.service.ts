import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class WhatsNewService {
  private visible = signal(false);

  isVisible(): boolean {
    return this.visible();
  }

  open(): void {
    this.visible.set(true);
  }

  close(): void {
    this.visible.set(false);
  }

  toggle(): void {
    this.visible.update((value) => !value);
  }
}
