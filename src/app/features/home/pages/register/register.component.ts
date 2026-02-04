import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil, tap, delay } from 'rxjs';
import * as L from 'leaflet';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit, OnDestroy, AfterViewInit {
  private map!: L.Map;
  isLoading = false;

  private destroy$ = new Subject<void>();
  form!: FormGroup;

  constructor(
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  matchPasswords(control: FormControl): { [s: string]: boolean } | null {
    if (this.form) {
      return control.value === this.form.get('password')?.value
        ? null
        : { mismatch: true };
    }
    return null;
  }
  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [12.37, -1.53],
      zoom: 5,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        maxZoom: 19,
      }
    ).addTo(this.map);
    const capitalesCEDEAO = [
      { name: 'Nouakchott, Mauritanie', coords: [18.0848, -15.9785] },
      { name: 'Dakar, Sénégal', coords: [14.7167, -17.4677] },
      { name: 'Praia, Cap-Vert', coords: [14.9177, -23.5092] },
      { name: 'Banjul, Gambie', coords: [13.4549, -16.579] },
      { name: 'Bissau, Guinée-Bissau', coords: [11.8632, -15.5948] },
      { name: 'Conakry, Guinée', coords: [9.5092, -13.7122] },
      { name: 'Freetown, Sierra Leone', coords: [8.4844, -13.2344] },
      { name: 'Monrovia, Liberia', coords: [6.3005, -10.7969] },
      { name: 'Abidjan, Côte d’Ivoire', coords: [5.36, -4.0083] }, 
      { name: 'Accra, Ghana', coords: [5.6037, -0.187] },
      { name: 'Lomé, Togo', coords: [6.1375, 1.2123] },
      { name: 'Porto-Novo, Bénin', coords: [6.4969, 2.6289] },
      { name: 'Abuja, Nigeria', coords: [9.0765, 7.3986] },
      { name: 'Ouagadougou, Burkina Faso', coords: [12.3714, -1.5197] },
      { name: 'Bamako, Mali', coords: [12.6392, -8.0029] },
      { name: 'Niamey, Niger', coords: [13.5116, 2.1254] },
    ];

    const circleOptions = {
      color: '#f59e0b', 
      fillColor: '#f59e0b',
      fillOpacity: 0.3,
      weight: 2,
      radius: 35000, 
    };

    capitalesCEDEAO.forEach((ville) => {
      L.circle(ville.coords as L.LatLngExpression, circleOptions)
        .addTo(this.map)
        .bindTooltip(ville.name, {
          permanent: false,
          direction: 'top',
          className: 'uno-tooltip',
        });
    });
    setTimeout(() => {
      this.map.invalidateSize();
    }, 400);
  }

  init() {
    this.form = new FormGroup({
      email: new FormControl('', [Validators.email, Validators.required]),
      password: new FormControl('', [
        Validators.minLength(8),
        Validators.required,
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/),
      ]),
      nom: new FormControl('', [Validators.required]),
      confirmPassword: new FormControl('', [
        Validators.required,
        this.matchPasswords.bind(this),
      ]),
    });
  }

  ngOnInit(): void {
    this.init();
  }

  get email(): FormControl {
    return this.form.get('email') as FormControl;
  }
  get nom(): FormControl {
    return this.form.get('nom') as FormControl;
  }

  get confirmPassword(): FormControl {
    return this.form.get('confirmPassword') as FormControl;
  }

  get password(): FormControl {
    return this.form.get('password') as FormControl;
  }

  onSubmit() {
    if (this.form.valid && !this.isLoading) {
      this.isLoading = true;

      const loginData = {
        email: this.email.value,
        password: this.password.value,
        nom: this.nom.value,
      };

      this.authService
        .register(loginData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response) {
              this.router.navigate(['/']);
            }
          },
          error: (err: any) => {
            console.error('Erreur de connexion', err);
            this.isLoading = false;
          },
          complete: () => {
            this.isLoading = false;
          },
        });
    }
  }

  register() {
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.map) {
      this.map.remove();
    }
  }
}
