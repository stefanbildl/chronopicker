import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'chrono-picker-example';

  formControl = new FormControl();

  _model: string = "";

  get model(): string {
    return this._model;
  }

  set model(s: string){
    this._model = s;
    console.log('ngmodel changed to ', s);
  }


  constructor() {
    this.formControl.valueChanges.subscribe(x => console.log("FormControl value changed to", x))
  }
}
