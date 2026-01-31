import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WhatsnewComponent } from './whatsnew.component';

describe('WhatsnewComponent', () => {
  let component: WhatsnewComponent;
  let fixture: ComponentFixture<WhatsnewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhatsnewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WhatsnewComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render changelog content', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Version 0.2.0');
    expect(compiled.textContent).toContain('Version 0.1.2');
    expect(compiled.textContent).toContain('Version 0.1.1');
    expect(compiled.textContent).toContain('Version 0.1.0');
  });

  it('should render version sections with proper structure', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const versionHeaders = compiled.querySelectorAll('h3');
    expect(versionHeaders.length).toBe(4);
    expect(versionHeaders[0].textContent).toContain('0.2.0');
    expect(versionHeaders[1].textContent).toContain('0.1.2');
    expect(versionHeaders[2].textContent).toContain('0.1.1');
    expect(versionHeaders[3].textContent).toContain('0.1.0');
  });

  it('should render category sections', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('New Features');
    expect(compiled.textContent).toContain('Bug Fixes');
  });
});
