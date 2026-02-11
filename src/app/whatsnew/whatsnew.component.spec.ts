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

  it('should render category sections', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('New Features');
    expect(compiled.textContent).toContain('Bug Fixes');
  });
});
