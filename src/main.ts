import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

import { App } from '@app/app.component';
import { appConfig } from '@app/app.config';
import { APP_CONFIG } from '@env';

if (APP_CONFIG.production) {
  enableProdMode();
}

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
