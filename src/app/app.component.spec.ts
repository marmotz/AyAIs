import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ElectronService } from '@app/services/electron.service';
import { TranslateModule } from '@ngx-translate/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [],
      imports: [App, TranslateModule.forRoot()],
      providers: [provideRouter([]), ElectronService],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent<any>(App as any);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });
});
