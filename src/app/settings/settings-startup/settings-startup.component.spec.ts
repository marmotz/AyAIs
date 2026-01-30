import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { SettingsStartupComponent } from './settings-startup.component';

describe('SettingsStartupComponent', () => {
  let component: SettingsStartupComponent;
  let fixture: ComponentFixture<SettingsStartupComponent>;

  beforeEach(async () => {
    (window as any).electronAPI = {
      getAppConfig: () => Promise.resolve({ launchAtStartup: false, launchHidden: false }),
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
