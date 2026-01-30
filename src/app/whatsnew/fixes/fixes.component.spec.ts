import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FixesComponent } from './fixes.component';

describe('FixesComponent', () => {
  let component: FixesComponent;
  let fixture: ComponentFixture<FixesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FixesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FixesComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render bug fixes section', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h4')?.textContent).toContain('Bug Fixes');
    expect(compiled.querySelector('ul')).toBeTruthy();
  });
});
