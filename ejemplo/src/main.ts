import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import 'lib-e2e-cypress-for-dummys';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
