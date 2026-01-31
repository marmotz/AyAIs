import { Component, computed, input, model } from '@angular/core';

export interface SettingTab {
  id: string;
  label: string;
}

@Component({
  selector: 'app-settings-tab',
  standalone: true,
  templateUrl: './settings-tab.component.html',
  imports: [],
})
export class SettingsTabComponent {
  tab = input.required<SettingTab>();
  selectedTab = model.required<string>();

  isActive = computed(() => this.selectedTab() === this.tab().id);

  select(): void {
    this.selectedTab.set(this.tab().id);
  }
}
