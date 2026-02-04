import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AutoUpdateService } from '@app/services/auto-update.service';
import { ProgressBar } from 'primeng/progressbar';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DownloadProgressComponent } from './download-progress.component';

describe('DownloadProgressComponent', () => {
  let component: DownloadProgressComponent;
  let fixture: ComponentFixture<DownloadProgressComponent>;
  let mockAutoUpdateService: any;

  beforeEach(async () => {
    mockAutoUpdateService = {
      downloadProgress: {
        set: vi.fn(),
      },
    };

    global.window = {
      ...global.window,
      electronAPI: {
        getPlatform: () => Promise.resolve('linux'),
        logDebug: vi.fn().mockResolvedValue(undefined),
        onUpdateAvailable: vi.fn(),
        onUpdateNotAvailable: vi.fn(),
        onUpdateDownloaded: vi.fn(),
        onUpdateDownloadProgress: vi.fn(),
        onUpdateDownloadFailed: vi.fn(),
      },
    } as any;

    await TestBed.configureTestingModule({
      imports: [CommonModule, ProgressBar, DownloadProgressComponent],
      providers: [{ provide: AutoUpdateService, useValue: mockAutoUpdateService }],
    }).compileComponents();

    fixture = TestBed.createComponent(DownloadProgressComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should format bytes correctly', () => {
    expect(component.formatBytes(0)).toBe('0 B');
    expect(component.formatBytes(1024)).toBe('1 KB');
    expect(component.formatBytes(1048576)).toBe('1 MB');
    expect(component.formatBytes(1073741824)).toBe('1 GB');
  });

  it('should format bytes with decimals', () => {
    expect(component.formatBytes(1536)).toBe('1.5 KB');
    expect(component.formatBytes(1572864)).toBe('1.5 MB');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });
});
