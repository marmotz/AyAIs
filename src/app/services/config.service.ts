import { computed, Injectable, signal } from '@angular/core';
import { AppConfig } from '@shared/types/app-config.interface';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private readonly appConfigSignal = signal<AppConfig | null>(null);

  readonly appConfig = computed(() => this.appConfigSignal());
  readonly configuredServices = computed(() => this.appConfigSignal()?.configuredServices ?? []);
  readonly shortcuts = computed(() => this.appConfigSignal()?.shortcuts);

  async loadConfig(): Promise<void> {
    try {
      const config = await window.electronAPI.getAppConfig();
      this.appConfigSignal.set(config);
    } catch (error) {
      console.error('Failed to load app config:', error);
    }
  }

  setConfig(config: AppConfig): void {
    this.appConfigSignal.set(config);
  }

  async updateConfig(partialConfig: Partial<AppConfig>): Promise<void> {
    try {
      await window.electronAPI.saveAppConfig(partialConfig);
      const currentConfig = this.appConfigSignal();
      if (currentConfig) {
        this.appConfigSignal.set({ ...currentConfig, ...partialConfig });
      }
    } catch (error) {
      console.error('Failed to update app config:', error);
    }
  }
}
