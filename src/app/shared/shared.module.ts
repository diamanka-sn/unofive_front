import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MatInputModule } from '@angular/material/input';
import { HttpClientModule } from '@angular/common/http';
import {  MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatRadioModule} from '@angular/material/radio';
import { BadgeModule } from 'primeng/badge';
import { ToastModule } from 'primeng/toast';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ChipModule } from 'primeng/chip';
import { SkeletonModule } from 'primeng/skeleton';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DividerModule } from 'primeng/divider';
import { CarouselModule } from 'primeng/carousel';
import {MatIconModule} from '@angular/material/icon';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { RippleModule } from 'primeng/ripple';
import {MatPaginatorModule} from '@angular/material/paginator';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ImageModule } from 'primeng/image';
import { GalleriaModule } from 'primeng/galleria';
import { DrawerModule } from 'primeng/drawer';

import { ButtonSharedComponent } from './components/button-shared/button-shared.component';
import {MatMenuModule} from '@angular/material/menu';
import { ProfilComponent } from './components/profil/profil.component';
import {MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

const PRIMENG_MODULE = [
  CardModule,
  IconFieldModule,
  InputIconModule,
  BadgeModule,
  ToastModule,
  ChipModule,
  SkeletonModule,
  ProgressSpinnerModule,
  DividerModule,
  CarouselModule,
  ButtonModule,
  DialogModule,
  AvatarGroupModule,
  AvatarModule,
  RippleModule,
  ConfirmDialogModule,
  ImageModule,
  GalleriaModule,
  DrawerModule
]

const MATERIAL_MODULE = [
  MatSnackBarModule,
  MatInputModule,
  MatDialogModule,
  MatCheckboxModule,
  MatRadioModule,
  MatDatepickerModule,
  MatNativeDateModule,
  MatPaginatorModule,
  MatIconModule,
  MatMenuModule,
  MatFormFieldModule,
  MatSelectModule,
  MatProgressSpinnerModule
]

@NgModule({
  declarations: [
     ButtonSharedComponent,
     ProfilComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    ...MATERIAL_MODULE,
    ...PRIMENG_MODULE
  ],
   exports: [
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonSharedComponent,
    ProfilComponent,
    ...MATERIAL_MODULE,
    ...PRIMENG_MODULE
  ],
  
})
export class SharedModule { }
