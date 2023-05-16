import { Component, TemplateRef, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ChronoPickerDirective } from './chrono-picker.directive';
import { Subscription, merge, of } from 'rxjs';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'chronopicker',
  templateUrl: 'chronopicker.component.html',
  styleUrls: ['./chronopicker.component.scss'],
})
export class ChronoPickerComponent {
  @ViewChild(TemplateRef, { static: true }) template?: TemplateRef<any>;
  private _trigger?: ChronoPickerDirective;
  private _attached = false;
  private _attachSubscription?: Subscription;

  hourControl = new FormControl();
  minuteControl = new FormControl();

  attached() {
    return this._attached;
  }

  attach(trigger: ChronoPickerDirective) {
    if (this._attached) {
      this.detach();
    }

    this._trigger = trigger;
    this._attached = true;

    this._attachSubscription = merge(
      of(this._trigger?.inputValue),
      this._trigger.valueSubject
    ).subscribe((x) => {
      this._updateChronoValues(x);
    });
  }

  _updateChronoValues(contents: string | null): void {
    if (contents == null) {
      this.hourControl.setValue('00');
      this.minuteControl.setValue('00');
      this._updateMasterInput();
      return;
    }

    const parts = contents.split(':');
    let hours: string, minutes: string;

    if (parts.length != 2) {
      hours = '00';
      minutes = '00';
    } else {
      hours = normalize(parts[0]);
      minutes = normalize(parts[1]);
    }

    this.hourControl.setValue(hours);
    this.minuteControl.setValue(minutes);
  }

  onBlur(event: FocusEvent, c: FormControl) {
    event.stopPropagation();
    this._addAndSanitize(c);
    this._updateMasterInput();
  }

  detach() {
    delete this._trigger;
    this._attachSubscription?.unsubscribe();
    delete this._attachSubscription;
    this._attached = false;
  }

  increment(control: FormControl) {
    this._addAndSanitize(control, 1);
    this._updateMasterInput();
  }

  decrement(control: FormControl) {
    this._addAndSanitize(control, -1);
    this._updateMasterInput();
  }

  private _addAndSanitize(control: FormControl, add?: number): boolean {
    let x = parseInt(control.value, 10) + (add ?? 0);

    const wrap = typeof add !== 'undefined' && add !== null && add !== 0;

    if (isNaN(x)) {
      x = 0;
    } else {
      // if we didn't add or subtract 1, we want to clamp between 0 and max
      x = conditionalWrapOrClamp(x, this._controlMax(control), wrap) ?? 0;
    }

    const padded = _padleft(x.toString());

    if (padded !== control.value) {
      control.setValue(padded);
      return true;
    }

    return false;
  }

  private _controlMax(c: FormControl) {
    let max = 59;
    if (c == this.hourControl) {
      max = 23;
    }
    return max;
  }

  private _updateMasterInput() {
    const hours = normalize(this.hourControl.value);
    const minutes = normalize(this.minuteControl.value);

    const value = `${hours}:${minutes}`;
    if (this._trigger?._ngControl) {
      this._trigger?._ngControl.control?.setValue(value);
      return;
    }
    const inputElement: HTMLInputElement | undefined =
      this._trigger?.element.nativeElement;

    if (inputElement) inputElement.value = value;
  }
}

function conditionalWrapOrClamp(x: number, max: number, wrap: boolean) {
  if (!wrap) {
    return Math.max(0, Math.min(max, x));
  } else if (x < 0) {
    // else warp around to max
    return max;
  } else if (x > max) {
    // else warp around to zero
    return 0;
  }
  return x;
}

function normalize(value: string) {
  if (value == null) {
    return '00';
  }

  if (value.match(/[^\d\s]+/)) {
    return '00';
  }

  const x = parseInt(value, 10);
  if (isNaN(x)) {
    console.warn('chronopicker: NaN value was changed to 00', value);
    return '00';
  }
  return _padleft(x.toString());
}

function _padleft(input: string): string {
  return input.padStart(2, '0');
}
