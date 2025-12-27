import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotFoundComponent } from './features/not-found/not-found.component';
const routes: Routes = [
  {
    path: '',
    redirectTo: '',
    pathMatch: 'full'
  }, {
    path: '',
    loadChildren: () => import('./features/home/home.module').then(m => m.HomeModule)
  },
 
  {
    path: '**',
    component: NotFoundComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
