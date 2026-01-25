import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-setting-tab',
  standalone: true,
  templateUrl: './setting-tab.component.html',
  imports: [CommonModule],
})
export class SettingTabComponent {
  @Input() selectedTab: 'startup' | 'shortcuts' = 'startup';
  @Output() tabSelected = new EventEmitter<'startup' | 'shortcuts'>();

  select(tab: 'startup' | 'shortcuts') {
    this.tabSelected.emit(tab);
  }
}
