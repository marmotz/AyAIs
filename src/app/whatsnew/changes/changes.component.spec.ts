import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ChangesComponent } from './changes.component';

describe('ChangesComponent', () => {
  let component: ChangesComponent;
  let fixture: ComponentFixture<ChangesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangesComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render technical changes section', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h4')?.textContent).toContain('Technical Changes');
    expect(compiled.querySelector('ul')).toBeTruthy();
  });
});
