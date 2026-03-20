import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AIService } from '@app/ai-services/interfaces';
import { describe, expect, it, vi } from 'vitest';
import { SidebarAddServiceDialogComponent } from './sidebar-add-service-dialog.component';

describe('SidebarAddServiceDialogComponent', () => {
  let component: SidebarAddServiceDialogComponent;
  let fixture: ComponentFixture<SidebarAddServiceDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarAddServiceDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarAddServiceDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('availableServices', () => {
    it('should have available services sorted by name', () => {
      expect(component.availableServices.length).toBeGreaterThan(0);
      const names = component.availableServices.map((s) => s.name);
      const sortedNames = [...names].sort((a, b) => a.localeCompare(b));
      expect(names).toEqual(sortedNames);
    });
  });

  describe('addService', () => {
    it('should emit serviceAdded and close dialog', () => {
      const emitSpy = vi.spyOn(component.serviceAdded, 'emit');
      component.visible.set(true);

      const service: AIService = {
        name: 'ChatGPT',
        url: 'https://chat.openai.com',
        icon: 'assets/ai-services/chatgpt.svg',
        internalDomains: ['chat.openai.com'],
      };

      component.addService(service);

      expect(emitSpy).toHaveBeenCalledWith(service);
      expect(component.visible()).toBe(false);
    });
  });

  describe('close', () => {
    it('should set visible to false', () => {
      component.visible.set(true);
      component.close();
      expect(component.visible()).toBe(false);
    });
  });
});
