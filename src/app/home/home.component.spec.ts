import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Home } from './home.component';

describe('Home', () => {
  beforeEach(async () => {
    (window as any).electronAPI = {
      getLastService: vi.fn().mockResolvedValue(undefined),
      saveLastService: vi.fn(),
      openExternal: vi.fn(),
      onNavigateService: vi.fn(),
      onSelectService: vi.fn(),
    };

    await TestBed.configureTestingModule({
      declarations: [],
      imports: [Home, TranslateModule.forRoot()],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    delete (window as any).electronAPI;
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(Home);
    const home = fixture.componentInstance;
    expect(home).toBeTruthy();
  });
});
