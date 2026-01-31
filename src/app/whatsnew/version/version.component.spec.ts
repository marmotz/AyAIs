import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { VersionComponent } from './version.component';

@Component({
  standalone: true,
  imports: [VersionComponent],
  template: `
    <app-version
      version="0.3.0"
      date="30 January 2026"
    />
  `,
})
class TestHostComponent {}

describe('VersionComponent', () => {
  let component: VersionComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, VersionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    component = fixture.debugElement.children[0].componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render version with date', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Version 0.3.0');
    expect(compiled.textContent).toContain('30 January 2026');
  });

  it('should have sticky header', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    const header = compiled.querySelector('.sticky');
    expect(header).toBeTruthy();
  });
});
