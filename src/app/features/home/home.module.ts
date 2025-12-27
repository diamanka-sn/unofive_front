import {LOCALE_ID, NgModule} from '@angular/core';
import {CommonModule, registerLocaleData} from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { PagesComponent } from './pages/pages.component';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { LoginComponent } from './pages/login/login.component';
import localeFr from '@angular/common/locales/fr';
import { MapComponent } from './pages/map/map.component';
import { ApiComponent } from './pages/api/api.component';
import { ProfilComponent } from '../../shared/components/profil/profil.component';
import { RegisterComponent } from './pages/register/register.component';
import { authGuard } from '@/app/core/guards/auth.guard';
import { GuestGuard } from '@/app/core/guards/guest.guard';
import { CarteComponent } from './pages/carte/carte.component';
import { PrintDialogComponent } from './components/print-dialog/print-dialog.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: '',
    pathMatch: 'full',
  }, {
    path: '',
    component: PagesComponent,
    children: [
      {
        path: '',
        component: HomePageComponent,
      },{
        path: 'login',
        component: LoginComponent,
        canActivate:[GuestGuard]
      },{
        path: 'register',
        component: RegisterComponent,
        canActivate:[GuestGuard]
      },{
        path:'map',
        component: CarteComponent
      },{
        path:'api',
        component: ApiComponent
      }, {
        path: 'profil',
        component: ProfilComponent,
        canActivate:[authGuard]
      }
    ]
  }
]

@NgModule({
  declarations: [
    PagesComponent,
    LoginComponent,
    HomePageComponent,
    MapComponent,
    ApiComponent,
    RegisterComponent,
    CarteComponent,
    PrintDialogComponent
  ],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    SharedModule
  ],
  providers: [
    {provide: LOCALE_ID, useValue: 'fr-FR'}
  ]
})
export class HomeModule { }
