import { Component, input } from '@angular/core';

@Component({
  selector: 'app-version',
  imports: [],
  templateUrl: './version.component.html',
  styleUrl: './version.component.css',
})
export class VersionComponent {
  version = input.required<string>();
  date = input.required<string>();
}
