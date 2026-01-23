import { Directive, effect, ElementRef, inject, input } from '@angular/core';

@Directive({
  selector: 'webview2',
})
export class WebviewDirective {
  readonly src = input.required<string>();

  private readonly el = inject(ElementRef<HTMLElement>);

  constructor() {
    effect(() => {
      const src = this.src();
      if (src) {
        this.el.nativeElement.src = src;
      }
    });
  }
}
