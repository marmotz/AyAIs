import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ImprovementsComponent } from './improvements.component';

describe('ImprovementsComponent', () => {
  let component: ImprovementsComponent;
  let fixture: ComponentFixture<ImprovementsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImprovementsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImprovementsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render improvements section', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h4')?.textContent).toContain('Improvements');
    expect(compiled.querySelector('ul')).toBeTruthy();
  });
});
