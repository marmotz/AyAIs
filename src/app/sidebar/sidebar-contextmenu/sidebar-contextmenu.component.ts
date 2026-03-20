import { Component, output, viewChild } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MenuItem } from 'primeng/api';
import { ContextMenu } from 'primeng/contextmenu';

@Component({
  selector: 'app-sidebar-contextmenu',
  imports: [ContextMenu, FaIconComponent],
  templateUrl: './sidebar-contextmenu.component.html',
})
export class SidebarContextmenuComponent {
  serviceRefresh = output<void>();
  serviceRemove = output<void>();

  readonly contextMenu = viewChild.required<ContextMenu>('contextMenu');
  menuItems: MenuItem[] = [];

  show(event: MouseEvent): void {
    this.menuItems = [
      {
        label: 'Refresh',
        icon: 'fas rotate-right',
        command: () => this.serviceRefresh.emit(),
      },
      {
        separator: true,
      },
      {
        label: 'Remove',
        icon: 'fas trash',
        command: () => this.serviceRemove.emit(),
      },
    ];
    this.contextMenu().target = event.currentTarget as HTMLElement;
    this.contextMenu().show(event);
  }
}
