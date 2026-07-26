import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { SidebarContextmenuComponent } from './sidebar-contextmenu.component';

describe('SidebarContextmenuComponent', () => {
  let component: SidebarContextmenuComponent;
  let fixture: ComponentFixture<SidebarContextmenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarContextmenuComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarContextmenuComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('show', () => {
    it('should build menu items with Refresh and Remove', () => {
      const mockEvent = new MouseEvent('contextmenu');
      const mockTarget = document.createElement('button');
      Object.defineProperty(mockEvent, 'currentTarget', { value: mockTarget });
      vi.spyOn(component.contextMenu(), 'show').mockImplementation(() => {});

      component.show(mockEvent);

      expect(component.menuItems.length).toBe(3);
      expect(component.menuItems[0].label).toBe('Refresh');
      expect(component.menuItems[2].label).toBe('Remove');
    });

    it('should set target and show context menu', () => {
      const mockTarget = document.createElement('button');
      const mockEvent = new MouseEvent('contextmenu');
      Object.defineProperty(mockEvent, 'currentTarget', { value: mockTarget });
      const showSpy = vi.spyOn(component.contextMenu(), 'show').mockImplementation(() => {});

      component.show(mockEvent);

      expect(component.contextMenu().target).toBe(mockTarget);
      expect(showSpy).toHaveBeenCalledWith(mockEvent);
    });

    it('should emit serviceRefresh when Refresh command is called', () => {
      const mockEvent = new MouseEvent('contextmenu');
      const mockTarget = document.createElement('button');
      Object.defineProperty(mockEvent, 'currentTarget', { value: mockTarget });
      vi.spyOn(component.contextMenu(), 'show').mockImplementation(() => {});
      const emitSpy = vi.spyOn(component.serviceRefresh, 'emit');

      component.show(mockEvent);
      component.menuItems[0].command!({} as any);

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should emit serviceRemove when Remove command is called', () => {
      const mockEvent = new MouseEvent('contextmenu');
      const mockTarget = document.createElement('button');
      Object.defineProperty(mockEvent, 'currentTarget', { value: mockTarget });
      vi.spyOn(component.contextMenu(), 'show').mockImplementation(() => {});
      const emitSpy = vi.spyOn(component.serviceRemove, 'emit');

      component.show(mockEvent);
      component.menuItems[2].command!({} as any);

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should not include DevTools when not in dev mode', () => {
      const mockEvent = new MouseEvent('contextmenu');
      const mockTarget = document.createElement('button');
      Object.defineProperty(mockEvent, 'currentTarget', { value: mockTarget });
      vi.spyOn(component.contextMenu(), 'show').mockImplementation(() => {});

      component.show(mockEvent);

      expect(component.menuItems.some((item) => item.label === 'DevTools')).toBe(false);
    });
  });

  describe('show in dev mode', () => {
    beforeEach(async () => {
      (window as any).electronAPI = {
        isDevMode: () => Promise.resolve(true),
      };

      fixture = TestBed.createComponent(SidebarContextmenuComponent);
      component = fixture.componentInstance;
      await Promise.resolve();
    });

    it('should build menu items with DevTools when in dev mode', () => {
      const mockEvent = new MouseEvent('contextmenu');
      const mockTarget = document.createElement('button');
      Object.defineProperty(mockEvent, 'currentTarget', { value: mockTarget });
      vi.spyOn(component.contextMenu(), 'show').mockImplementation(() => {});

      component.show(mockEvent);

      expect(component.menuItems.length).toBe(4);
      expect(component.menuItems[1].label).toBe('DevTools');
    });

    it('should emit serviceDevTools when DevTools command is called', () => {
      const mockEvent = new MouseEvent('contextmenu');
      const mockTarget = document.createElement('button');
      Object.defineProperty(mockEvent, 'currentTarget', { value: mockTarget });
      vi.spyOn(component.contextMenu(), 'show').mockImplementation(() => {});
      const emitSpy = vi.spyOn(component.serviceDevTools, 'emit');

      component.show(mockEvent);
      component.menuItems[1].command!({} as any);

      expect(emitSpy).toHaveBeenCalled();
    });
  });
});
