import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WhatsNewService } from '@app/services/whats-new.service';
import { describe, expect, it, vi } from 'vitest';
import { SidebarWhatsnewDialogComponent } from './sidebar-whatsnew-dialog.component';

describe('SidebarWhatsnewDialogComponent', () => {
  let component: SidebarWhatsnewDialogComponent;
  let fixture: ComponentFixture<SidebarWhatsnewDialogComponent>;
  let mockWhatsNewService: WhatsNewService;

  beforeEach(async () => {
    mockWhatsNewService = {
      isVisible: vi.fn(() => false),
      open: vi.fn(),
      close: vi.fn(),
      toggle: vi.fn(),
    } as unknown as WhatsNewService;

    await TestBed.configureTestingModule({
      imports: [SidebarWhatsnewDialogComponent],
      providers: [{ provide: WhatsNewService, useValue: mockWhatsNewService }],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarWhatsnewDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('visible', () => {
    it('should return false when service says not visible', () => {
      expect(component.visible).toBe(false);
    });

    it('should return true when service says visible', () => {
      vi.mocked(mockWhatsNewService.isVisible).mockReturnValue(true);
      expect(component.visible).toBe(true);
    });
  });

  describe('close', () => {
    it('should call whatsNewService.close', () => {
      component.close();
      expect(mockWhatsNewService.close).toHaveBeenCalled();
    });
  });
});
