import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { SettingsStartupComponent } from './settings-startup.component';

describe('SettingsStartupComponent', () => {
  let component: SettingsStartupComponent;
  let fixture: ComponentFixture<SettingsStartupComponent>;

  beforeEach(async () => {
    (window as any).electronAPI = {
      getAppConfig: () =>
        Promise.resolve({
          launchAtStartup: false,
          launchHidden: false,
          shortcuts: {
            previousService: 'Ctrl+Shift+Tab',
            nextService: 'Ctrl+Tab',
            services: {
              service1: 'Ctrl+1',
              service2: 'Ctrl+2',
              service3: 'Ctrl+3',
              service4: 'Ctrl+4',
              service5: 'Ctrl+5',
              service6: 'Ctrl+6',
              service7: 'Ctrl+7',
              service8: 'Ctrl+8',
              service9: 'Ctrl+9',
              service10: 'Ctrl+0',
            },
          },
        }),
      saveAppConfig: () => Promise.resolve(),
    };

    await TestBed.configureTestingModule({
      imports: [SettingsStartupComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsStartupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
