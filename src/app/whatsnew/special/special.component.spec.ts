import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SpecialComponent } from './special.component';

describe('SpecialComponent', () => {
  let component: SpecialComponent;
  let fixture: ComponentFixture<SpecialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpecialComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SpecialComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render special section', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h4')?.textContent).toContain('Special');
    expect(compiled.querySelector('ul')).toBeTruthy();
  });
});
