import { Component } from '@angular/core';
import { ImprovementsComponent } from '@app/whatsnew/improvements/improvements.component';
import { FixesComponent } from './fixes/fixes.component';
import { NewFeaturesComponent } from './new-features/new-features.component';
import { SpecialComponent } from './special/special.component';
import { VersionComponent } from './version/version.component';

@Component({
  selector: 'app-whatsnew',
  imports: [VersionComponent, NewFeaturesComponent, FixesComponent, SpecialComponent, ImprovementsComponent],
  templateUrl: './whatsnew.component.html',
  styleUrl: './whatsnew.component.css',
})
export class WhatsnewComponent {}
