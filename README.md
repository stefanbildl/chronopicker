# Chrono-picker

A Timepicker component compatible with Angular 16.
It works in combination with Angular reactive forms and ngModel.


## Installation

```sh
npm install --save chrono-picker@0.0.2
```

## How to

1. Import the ChronoPickerModule in the module you want to use the time picker.
2. Create a chronopicker element. and attach it to an input element.


### Import Module
```typescript
// ...
import { ChronoPickerModule } from 'chrono-picker';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    ReactiveFormsModule,
    BrowserModule,
    FormsModule,
    BrowserAnimationsModule,
    MatFormFieldModule,
    MatInputModule,

    // Import the module here
    ChronoPickerModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

### Example with Angular Reactive Forms and a formControl.

```typescript
<mat-form-field>
  <mat-label>Input with form control</mat-label>
  <input [formControl]="formControl" matInput [chronopicker]="cp" type="time">
</mat-form-field>

<chronopicker #cp/>
```

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.


## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.


## Contributing

If you want to contribute to the project, please feel free to create pull requests or issues. Thank you!

