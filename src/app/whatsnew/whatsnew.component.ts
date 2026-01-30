import { Component } from '@angular/core';
import { FixesComponent } from './fixes/fixes.component';
import { NewFeaturesComponent } from './new-features/new-features.component';
import { SpecialComponent } from './special/special.component';
import { VersionComponent } from './version/version.component';

@Component({
  selector: 'app-whatsnew',
  imports: [VersionComponent, NewFeaturesComponent, FixesComponent, SpecialComponent],
  templateUrl: './whatsnew.component.html',
  styleUrl: './whatsnew.component.css',
})
export class WhatsnewComponent {}
