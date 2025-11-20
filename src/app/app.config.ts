import { ApplicationConfig, NgModule, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import {CommonModule} from "@angular/common";

import { routes } from './app.routes';
import { TimerComponent } from './timer/timer.component';

NgModule({
  declarations: [
    TimerComponent
  ],
  imports: [
    CommonModule
  ],
})

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes)
  ]
};
