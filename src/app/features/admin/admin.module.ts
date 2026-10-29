import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagesComponent } from './pages/pages.component';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '@/app/shared/shared.module';
import { MatIconModule } from '@angular/material/icon';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UsersComponent } from './pages/users/users.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { DisastersComponent } from './pages/disasters/disasters.component';
import { GeoDataComponent } from './pages/geo-data/geo-data.component';
import { OccsolComponent } from './pages/occsol/occsol.component';

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
        component: DashboardComponent,
        title: "Tableau de bord - Administration",
      },{
        path: 'users',
        component: UsersComponent,
        title: "Utilisateurs - Administration",
      },
      {
        path: 'settings',
        component: SettingsComponent,
        title: "Paramètres - Administration",
      },{
        path: 'disasters',
        component: DisastersComponent,
        title: "Importer des catastrophes - Administration",
      },{
        path: 'geo-data',
        component: GeoDataComponent,
        title: "Importer les limites des pays - Administration",
      },{
        path: 'occsol',
        component: OccsolComponent,
        title: "Occupation du sol du Sénégal - Administration",
      }
    ]
  }
]


@NgModule({
  declarations: [
    PagesComponent,
    DashboardComponent,
    UsersComponent,
    SettingsComponent,
    DisastersComponent,
    GeoDataComponent,
    OccsolComponent
  ],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    SharedModule,
    MatIconModule
  ]
})
export class AdminModule { }
