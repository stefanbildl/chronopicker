import { NgModule } from '@angular/core';
import { ChronoPickerComponent } from './chrono-picker.component';
import { ChronoPickerDirective } from './chrono-picker.directive';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [ChronoPickerComponent, ChronoPickerDirective],
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
  ],
  exports: [ChronoPickerComponent, ChronoPickerDirective],
})
export class ChronoPickerModule {}
