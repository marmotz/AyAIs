import { TestBed } from '@angular/core/testing';
import { WhatsNewService } from './whats-new.service';

describe('WhatsNewService', () => {
  let service: WhatsNewService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WhatsNewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initially be not visible', () => {
    expect(service.isVisible()).toBe(false);
  });

  it('should open the modal', () => {
    service.open();
    expect(service.isVisible()).toBe(true);
  });

  it('should close the modal', () => {
    service.open();
    service.close();
    expect(service.isVisible()).toBe(false);
  });

  it('should toggle the modal', () => {
    expect(service.isVisible()).toBe(false);
    service.toggle();
    expect(service.isVisible()).toBe(true);
    service.toggle();
    expect(service.isVisible()).toBe(false);
  });
});
