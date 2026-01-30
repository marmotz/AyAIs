import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { SettingsTabComponent, SettingTab } from './settings-tab.component';

describe('SettingsTabComponent', () => {
  let component: SettingsTabComponent;
  let fixture: ComponentFixture<SettingsTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsTabComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsTabComponent);
    component = fixture.componentInstance;
    const tab: SettingTab = { id: 'test', label: 'Test Tab' };
    fixture.componentRef.setInput('tab', tab);
    fixture.componentRef.setInput('selectedTab', 'other');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update selectedTab when select is called', () => {
    component.select();
    expect(component.selectedTab()).toBe('test');
  });

  it('should return true for isActive when selectedTab matches tab id', () => {
    fixture.componentRef.setInput('selectedTab', 'test');
    fixture.detectChanges();
    expect(component.isActive()).toBe(true);
  });

  it('should return false for isActive when selectedTab does not match tab id', () => {
    fixture.componentRef.setInput('selectedTab', 'other');
    fixture.detectChanges();
    expect(component.isActive()).toBe(false);
  });
});
