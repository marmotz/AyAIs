import { Component, inject } from '@angular/core';
import { APP_CONFIG } from '@env';
import { TranslateService } from '@ngx-translate/core';
import { ElectronService } from './core/services/electron/electron.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    standalone: true,
    imports: []
})
export class AppComponent {
  private electronService = inject(ElectronService);
  private translate = inject(TranslateService);

  constructor() {
    const electronService = this.electronService;

    this.translate.setDefaultLang('en');
    console.log('APP_CONFIG', APP_CONFIG);

    if (electronService.isElectron) {
      console.log(process.env);
      console.log('Run in electron');
      console.log('Electron ipcRenderer', this.electronService.ipcRenderer);
      console.log('NodeJS childProcess', this.electronService.childProcess);
    } else {
      console.log('Run in browser');
    }
  }
}
