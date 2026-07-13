import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layout/header/header.component';
import { SidenavComponent } from './layout/sidenav/sidenav.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, SidenavComponent],
  templateUrl: './app.html',
})
export class App {}
