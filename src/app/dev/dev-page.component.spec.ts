import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faRefresh } from '@fortawesome/free-solid-svg-icons/faRefresh';
import { beforeEach, describe, expect, it } from 'vitest';
import { DevPageComponent } from './dev-page.component';

describe('DevPageComponent', () => {
  let component: DevPageComponent;
  let fixture: ComponentFixture<DevPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DevPageComponent, RouterTestingModule],
      providers: [
        {
          provide: FaIconLibrary,
          useValue: {
            addIcons: () => {},
            getIconDefinition: () => ({
              prefix: 'fas',
              iconName: 'refresh',
              icon: [
                512,
                512,
                [],
                'f021',
                [
                  'M463.5 224H472c13.3 0 24-10.7 24-24V72c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228-87.6-315.8-3.1C9.3 115.7 0 140.9 0 166.8c0 40.8 22.7 77.8 60.3 101.6 31.8 20.2 72.9 24.7 109.7 14.1 6.2-1.8 12.5-3.9 18.7-6.2l16.5-6.5c5.6-2.2 9-8 8.5-14.1-.5-6-5.2-10.8-11.2-11.2l-16.9-1.2c-23.9-1.7-45.9-12.8-61.3-31.3-15.4-18.5-22-42.4-18.3-66.8 3.7-24.4 16.7-46.3 36.6-60.7 19.9-14.4 44.8-20.7 69.8-17.6 24.4 3 47.2 15.3 62.6 34.3 3.9 4.8 8.9 8.7 14.5 11.4l16.6 7.9c4.9 2.3 10.7 1.9 15.2-1.1s6.9-8.2 6.2-13.6l-2.6-20.3c-2.5-19.4-12.9-36.7-28.3-48.2-15.4-11.5-34.5-16.5-53.7-13.9-19.9 2.7-37.8 13.1-49.8 28.8-12 15.7-16.9 35.4-13.5 55.1 1.8 10.7 5.8 20.8 11.5 29.9l-13.6 9.5c-3.8 2.7-8.9 2.6-12.6-.2-9.2-7.1-16.3-16.3-20.6-26.9-4.3-10.6-5.3-22.1-2.9-33.2 2.4-11.1 8.1-21.1 16.5-28.9 8.4-7.8 18.8-12.9 30.1-14.6 11.3-1.7 22.8.3 32.9 5.7 10.1 5.4 18.3 13.7 23.5 23.8l13.3 26.9c2.4 4.9 8.1 7.5 13.5 6.3 5.4-1.2 9.3-5.9 9.3-11.4V224zM272 448c0 13.3-10.7 24-24 24s-24-10.7-24-24 10.7-24 24-24 24 10.7 24 24z',
                ],
              ],
            }),
          },
        },
      ],
    }).compileComponents();

    const iconLibrary = TestBed.inject(FaIconLibrary);
    iconLibrary.addIcons(faRefresh);

    fixture = TestBed.createComponent(DevPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
