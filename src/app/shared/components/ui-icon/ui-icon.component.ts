import { ChangeDetectionStrategy, Component, inject, input, InputSignal, Signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap } from 'rxjs';

@Component({
  selector: 'app-ui-icon',
  template: '<span [innerHTML]="svgContent()"></span>',
  styles: [
    `
      :host {
        display: block;
      }

      span {
        display: block;
        width: 100%;
        height: 100%;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiIconComponent {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly sanitizer: DomSanitizer = inject(DomSanitizer);

  readonly src: InputSignal<string> = input.required<string>();

  readonly svgContent: Signal<SafeHtml> = toSignal(
    toObservable(this.src).pipe(
      switchMap((path) => this.http.get(path, { responseType: 'text' })),
      map((svg) => this.sanitizer.bypassSecurityTrustHtml(svg)),
    ),
    { initialValue: this.sanitizer.bypassSecurityTrustHtml('') },
  );
}
