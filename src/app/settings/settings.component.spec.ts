import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SettingsAboutComponent } from '@app/settings/settings-about/settings-about.component';
import { SettingsShortcutsComponent } from '@app/settings/settings-shortcuts/settings-shortcuts.component';
import { SettingsStartupComponent } from '@app/settings/settings-startup/settings-startup.component';
import { MessageService } from 'primeng/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsComponent } from './settings.component';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;

  beforeEach(async () => {
    vi.clearAllMocks();

    (window as any).electronAPI = {
      getPlatform: () => Promise.resolve('linux'),
      logDebug: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [SettingsComponent, SettingsAboutComponent, SettingsShortcutsComponent, SettingsStartupComponent],
      providers: [MessageService],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct host classes', () => {
    const element = fixture.nativeElement;
    expect(element.classList.contains('block')).toBe(true);
    expect(element.classList.contains('h-full')).toBe(true);
  });
});
