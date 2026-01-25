import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { Home } from './home.component';

describe('Home', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [],
      imports: [Home, TranslateModule.forRoot()],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent<any>(Home as any);
    const home = fixture.debugElement.componentInstance;
    expect(home).toBeTruthy();
  });
});
