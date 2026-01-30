import { Component, input } from '@angular/core';

@Component({
  selector: 'app-special',
  imports: [],
  templateUrl: './special.component.html',
  styleUrl: './special.component.css',
})
export class SpecialComponent {
  title = input('Special');
}
