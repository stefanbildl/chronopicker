import {
  Directive,
  ElementRef,
  OnInit,
  inject,
  Input,
  ViewContainerRef,
  Optional,
  Inject,
  Host,
  DestroyRef,
  HostListener,
} from '@angular/core';
import { NgControl } from '@angular/forms';
import { Observable, Subject, filter, fromEvent, merge } from 'rxjs';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ConnectedPosition,
  FlexibleConnectedPositionStrategy,
  Overlay,
  OverlayConfig,
  OverlayRef,
  PositionStrategy,
  ViewportRuler,
} from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { ChronoPickerComponent } from './chrono-picker.component';
import { MAT_FORM_FIELD, MatFormField } from '@angular/material/form-field';
import { ESCAPE, UP_ARROW, hasModifierKey } from '@angular/cdk/keycodes';
import { DOCUMENT } from '@angular/common';
import { _getEventTarget } from '@angular/cdk/platform';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'input[chronopicker]',
})
export class ChronoPickerDirective implements OnInit {
  valueSubject = new Subject<string | null>();
  element: ElementRef<HTMLInputElement> = inject(ElementRef);

  private _overlayRef?: OverlayRef | null;
  private _portal?: TemplatePortal;
  private _overlayAttached = false;
  private _positionStrategy?: FlexibleConnectedPositionStrategy;

  // only used when user input something to check whether or not we changed something
  private _previousValue!: string | null;

  get formField(): MatFormField | null {
    return this._formField;
  }

  /** Whether or not the autocomplete panel is open. */
  get panelOpen(): boolean {
    return this._overlayAttached;
  }

  @Input() chronopicker?: ChronoPickerComponent;

  constructor(
    @Optional()
    @Inject(NgControl)
    @Host()
    public _ngControl: NgControl,

    @Optional()
    @Inject(MAT_FORM_FIELD)
    @Host()
    private _formField: MatFormField | null,

    private _destroyRef: DestroyRef,
    private _overlay: Overlay,
    private _viewContainerRef: ViewContainerRef,
    private _viewportRuler: ViewportRuler,
    private _element: ElementRef<HTMLInputElement>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Optional() @Inject(DOCUMENT) private _document?: any
  ) {}

  ngOnInit(): void {
    this._getOutsideClickStream()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(() => {
        this._detachOverlay();
      });
  }

  get inputValue(): string | null {
    return this.element.nativeElement.value;
  }

  private _attachOverlay() {
    const chronopicker = this.chronopicker;

    if (!chronopicker?.template) {
      console.error('chronopicker: please initialize me correctly.');
      return;
    }

    let overlayRef = this._overlayRef;
    if (!overlayRef) {
      this._portal = new TemplatePortal(
        chronopicker.template,
        this._viewContainerRef,
        {
          id: this._formField?.getLabelId(),
        }
      );

      overlayRef = this._overlay.create(this._getOverlayConfig());
      this._overlayRef = overlayRef;
      this._handleOverlayEvents(overlayRef);
      this._viewportRuler
        .change()
        .pipe(takeUntilDestroyed(this._destroyRef))
        .subscribe(() => {
          if (this.panelOpen && overlayRef) {
            overlayRef.updateSize({ width: this._getPanelWidth() });
          }
        });
    } else {
      // Update the trigger, panel width and direction, in case anything has changed.
      this._positionStrategy?.setOrigin(this._getConnectedElement());
      overlayRef.updateSize({ width: this._getPanelWidth() });
    }

    if (overlayRef && !overlayRef.hasAttached()) {
      overlayRef.attach(this._portal);
      this.chronopicker?.attach(this);
      this._overlayAttached = true;
    }
  }

  private _getPanelWidth(): number {
    return this._getConnectedElement().nativeElement.getBoundingClientRect()
      .width;
  }

  /** Handles keyboard events coming from the overlay panel. */
  private _handleOverlayEvents(overlayRef: OverlayRef) {
    // Use the `keydownEvents` in order to take advantage of
    // the overlay event targeting provided by the CDK overlay.
    overlayRef.keydownEvents().subscribe((event) => {
      // Close when pressing ESCAPE or ALT + UP_ARROW, based on the a11y guidelines.
      // See: https://www.w3.org/TR/wai-aria-practices-1.1/#textbox-keyboard-interaction
      if (
        (event.keyCode === ESCAPE && !hasModifierKey(event)) ||
        (event.keyCode === UP_ARROW && hasModifierKey(event, 'altKey'))
      ) {
        // If the user had typed something in before we autoselected an option, and they decided
        // to cancel the selection, restore the input value to the one they had typed in.

        // We need to stop propagation, otherwise the event will eventually
        // reach the input itself and cause the overlay to be reopened.
        event.stopPropagation();
        event.preventDefault();
      }
    });

    // Subscribe to the pointer events stream so that it doesn't get picked up by other overlays.
    // TODO(crisbeto): we should switch `_getOutsideClickStream` eventually to use this stream,
    // but the behvior isn't exactly the same and it ends up breaking some internal tests.
    overlayRef.outsidePointerEvents().subscribe();
  }

  private _detachOverlay() {
    this.closePanel();
  }

  private _getOverlayConfig(): OverlayConfig {
    return {
      positionStrategy: this._getOverlayPosition(),
    };
  }

  private _getOverlayPosition(): PositionStrategy {
    const strategy = this._overlay
      .position()
      .flexibleConnectedTo(this._getConnectedElement())
      .withFlexibleDimensions(false)
      .withDefaultOffsetY(8)
      .withPush(false);

    this._setStrategyPositions(strategy);
    this._positionStrategy = strategy;
    return strategy;
  }

  private _getConnectedElement(): ElementRef<HTMLElement> {
    return this._formField
      ? this._formField?.getConnectedOverlayOrigin()
      : this._element;
  }

  /** Sets the positions on a position strategy based on the directive's input state. */
  private _setStrategyPositions(
    positionStrategy: FlexibleConnectedPositionStrategy
  ) {
    // Note that we provide horizontal fallback positions, even though by default the dropdown
    // width matches the input, because consumers can override the width. See #18854.
    const belowPositions: ConnectedPosition[] = [
      {
        originX: 'start',
        originY: 'bottom',
        overlayX: 'start',
        overlayY: 'top',
      },
      { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top' },
    ];

    positionStrategy.withPositions(belowPositions);
  }

  @HostListener('input', ['$event'])
  _handleInput($event: KeyboardEvent) {
    const target = $event.target as HTMLInputElement;
    const value = target.value;
    // If the input has a placeholder, IE will fire the `input` event on page load,
    // focus and blur, in addition to when the user actually changed the value. To
    // filter out all of the extra events, we save the value on focus and between
    // `input` events, and we check whether it changed.
    // See: https://connect.microsoft.com/IE/feedback/details/885747/
    if (this._previousValue !== value) {
      this._previousValue = value;
      this.valueSubject.next(value);
    }
  }

  @HostListener('focus', ['$event'])
  _handleFocus($event: KeyboardEvent) {
    this._previousValue = ($event.target as HTMLInputElement).value;
    this._attachOverlay();
  }

  /** Stream of clicks outside of the autocomplete panel. */
  private _getOutsideClickStream(): Observable<UIEvent> {
    return merge(
      fromEvent(this._document, 'click') as Observable<MouseEvent>,
      fromEvent(this._document, 'auxclick') as Observable<MouseEvent>,
      fromEvent(this._document, 'touchend') as Observable<TouchEvent>
    ).pipe(
      filter((event) => {
        // If we're in the Shadow DOM, the event target will be the shadow root, so we have to
        // fall back to check the first element in the path of the click event.
        const clickTarget = _getEventTarget<HTMLElement>(event);
        const formField = this._formField
          ? this._formField._elementRef.nativeElement
          : null;

        return (
          this._overlayAttached &&
          clickTarget !== this._element.nativeElement &&
          // Normally focus moves inside `mousedown` so this condition will almost always be
          // true. Its main purpose is to handle the case where the input is focused from an
          // outside click which propagates up to the `body` listener within the same sequence
          // and causes the panel to close immediately (see #3106).
          this._document.activeElement !== this._element.nativeElement &&
          (!formField || !formField.contains(clickTarget)) &&
          !!this._overlayRef &&
          !this._overlayRef.overlayElement.contains(clickTarget)
        );
      })
    );
  }

  closePanel(): void {
    if (!this._overlayAttached) {
      return;
    }

    if (this._overlayRef && this._overlayRef.hasAttached()) {
      this._overlayRef.detach();
    }
    this._overlayAttached = false;
  }
}
