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
import { ConfidentialiteComponent } from './pages/confidentialite/confidentialite.component';
import { SearchDialogComponent } from './components/search-dialog/search-dialog.component';
import { AccessibiliteComponent } from './pages/accessibilite/accessibilite.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { SenegalComponent } from './pages/senegal/senegal.component';

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
        title: "Accueil",
      },{
        path: 'login',
        component: LoginComponent,
        title: "Connexion",
        canActivate:[GuestGuard]
      },{
        path: 'register',
        component: RegisterComponent,
        title: "Créer un compte",
        canActivate:[GuestGuard]
      },{
        path:'map',
        component: CarteComponent,
        title: "Carte interactive"
      },{
        path: 'senegal',
        component: SenegalComponent,
        title: "Occupation du sol au Sénégal"
      },{
        path:'api',
        component: ApiComponent,
        title: "Documentation de l'API"
      }, {
        path: 'profil',
        component: ProfilComponent,
        title: "Mon profil",
        canActivate:[authGuard]
      }, {
        path: 'confidentialite',
        component: ConfidentialiteComponent,
        title: "Politique de confidentialité"
      }, {
        path: 'accessibilite',
        component: AccessibiliteComponent,
        title: "Déclaration d'accessibilité"
      }, {
        path: 'mot-de-passe-oublie',
        component: ForgotPasswordComponent,
        title: "Mot de passe oublié",
        canActivate:[GuestGuard]
      }, {
        path: 'reinitialiser-mot-de-passe',
        component: ResetPasswordComponent,
        title: "Nouveau mot de passe",
        canActivate:[GuestGuard]
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
    PrintDialogComponent,
    ConfidentialiteComponent,
    SearchDialogComponent,
    AccessibiliteComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    SenegalComponent
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
