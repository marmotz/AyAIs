import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NewFeaturesComponent } from './new-features.component';

describe('NewFeaturesComponent', () => {
  let component: NewFeaturesComponent;
  let fixture: ComponentFixture<NewFeaturesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewFeaturesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NewFeaturesComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render new features section', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h4')?.textContent).toContain('New Features');
    expect(compiled.querySelector('ul')).toBeTruthy();
  });
});
