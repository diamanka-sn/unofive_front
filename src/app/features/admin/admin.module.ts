import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagesComponent } from './pages/pages.component';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '@/app/shared/shared.module';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UsersComponent } from './pages/users/users.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { DisastersComponent } from './pages/disasters/disasters.component';
import { GeoDataComponent } from './pages/geo-data/geo-data.component';

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
      },{
        path: 'users',
        component: UsersComponent,
      },
      {
        path: 'settings',
        component: SettingsComponent,
      },{
        path: 'disasters',
        component: DisastersComponent,
      },{
        path: 'geo-data',
        component: GeoDataComponent,
      }
    ]
  }
]


@NgModule({
  declarations: [
    PagesComponent,
    UsersComponent,
    SettingsComponent,
    DisastersComponent,
    GeoDataComponent
  ],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    SharedModule
  ]
})
export class AdminModule { }
