import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AutoUpdateService } from '@app/services/auto-update.service';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons/faArrowLeft';
import { MessageService } from 'primeng/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestUpdaterComponent } from './test-updater.component';

describe('TestUpdaterComponent', () => {
  let component: TestUpdaterComponent;
  let fixture: ComponentFixture<TestUpdaterComponent>;

  const mockElectronAPI = {
    getPlatform: () => Promise.resolve('linux'),
    logDebug: vi.fn().mockResolvedValue(undefined),
    onUpdateAvailable: vi.fn(),
    onUpdateNotAvailable: vi.fn(),
    onUpdateDownloaded: vi.fn(),
    onUpdateDownloadProgress: vi.fn(),
    onUpdateDownloadFailed: vi.fn(),
    startUpdateDownload: vi.fn(),
    quitAndInstall: vi.fn(),
    simulateUpdateAvailable: vi.fn(),
    simulateUpdateDownloaded: vi.fn(),
    notifyRendererReady: vi.fn(),
  };

  beforeEach(async () => {
    global.window = {
      ...global.window,
      electronAPI: mockElectronAPI,
    } as any;

    await TestBed.configureTestingModule({
      imports: [TestUpdaterComponent, RouterTestingModule],
      providers: [
        AutoUpdateService,
        {
          provide: MessageService,
          useValue: { add: vi.fn(), clear: vi.fn() },
        },
        {
          provide: FaIconLibrary,
          useValue: {
            addIcons: () => {},
            getIconDefinition: () => ({
              prefix: 'fas',
              iconName: 'arrow-left',
              icon: [
                640,
                512,
                [],
                'f060',
                [
                  'M192 448c-8.188 0-16.38-3.125-22.62-9.375l-160-160c-12.5-12.5-12.5-32.75 0-45.25l160-160c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25L77.25 256l137.4 137.4c12.5 12.5 12.5 32.75 0 45.25C208.4 444.9 200.2 448 192 448z',
                ],
              ],
            }),
          },
        },
      ],
    }).compileComponents();

    const iconLibrary = TestBed.inject(FaIconLibrary);
    iconLibrary.addIcons(faArrowLeft);

    fixture = TestBed.createComponent(TestUpdaterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call simulateUpdateAvailable on electronAPI', () => {
    component.simulateUpdateAvailable();
    expect(mockElectronAPI.simulateUpdateAvailable).toHaveBeenCalled();
  });

  it('should call simulateUpdateDownloaded on electronAPI', () => {
    component.simulateUpdateDownloaded();
    expect(mockElectronAPI.simulateUpdateDownloaded).toHaveBeenCalled();
  });

  it('should not call simulateUpdateAvailable when electronAPI is undefined', () => {
    const mockAPI = {
      simulateUpdateAvailable: vi.fn(),
    };

    global.window = {
      ...global.window,
      electronAPI: undefined,
    } as any;

    const newFixture = TestBed.createComponent(TestUpdaterComponent);
    const newComponent = newFixture.componentInstance;

    newComponent.simulateUpdateAvailable();
    expect(mockAPI.simulateUpdateAvailable).not.toHaveBeenCalled();
  });

  afterEach(() => {
    // Don't delete the mock - the setup file will maintain it
  });
});
