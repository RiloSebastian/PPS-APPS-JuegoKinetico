import { Component } from '@angular/core';
import { Router } from "@angular/router";
import { AuthService } from '../servicios/auth/auth.service';
import { ComplementosService } from 'src/app/servicios/complementos.service';
import { DeviceMotion, DeviceMotionAccelerationData } from '@ionic-native/device-motion/ngx';
import { JuegoService } from 'src/app/servicios/juego.service';
import Swal from 'sweetalert2';

@Component({
	selector: 'app-home',
	templateUrl: 'home.page.html',
	styleUrls: ['home.page.scss'],
})
export class HomePage {
	public listadoResultados: Array<any> = [];
	public usuario: any = null;
	public subU: any = null;
	public subJuegos: any = null;
	public deviceSubscription: any = null;
	public eleccion;
	public heroe: HTMLElement;
	public x; y;
	public time;
	public interval;
	public timeLeft: number;
	public flagSecc: string = null;
	public juegoProcc: boolean = false;

	constructor(private router: Router, private auth: AuthService, private comp: ComplementosService, private motion: DeviceMotion, private juego: JuegoService) {
		console.log('accede a usuario');
		this.subU = this.auth.usuario.subscribe(user => {
			if (user !== null) {
				this.usuario = user;
				this.flagSecc = 'resultados';
				console.log(this.usuario);
				this.subJuegos = this.juego.traerTodos().subscribe(ref => {
					this.listadoResultados = ref.map(y => {
						const x: any = y.payload.doc.data() as any;
						x['id'] = y.payload.doc.id;
						return { ...x };
					}).sort((a, b) => (a.mejorPuntaje > b.mejorPuntaje) ? 1 : ((b.mejorPuntaje > a.mejorPuntaje) ? -1 : 0)).slice(0, 2);
				})
			}
		});
	}

	jugar() {
		this.flagSecc = 'seleccPersonaje';
	}

	elegirPersonaje(personaje) {
		this.eleccion = personaje;
		this.flagSecc = 'Juego';
	}

	Iniciar(): void {
		this.timeLeft = 0;
		this.heroe = document.getElementById('heroe');
		this.heroe.style.left = '19vh';
		this.heroe.style.top = '32vh';
		this.startTimer();
		this.juegoProcc = true;
		this.deviceSubscription = this.motion.watchAcceleration({ frequency: 40 }).subscribe((acceleration: DeviceMotionAccelerationData) => {
			this.x = this.escalarRango(acceleration.x * -1, -7, 7, -5, 42);
			this.y = this.escalarRango(acceleration.y * -1, -7, 7, -1, 61);
			this.time = acceleration.timestamp;;
			this.heroe.style.left = `${this.x}vh`;
			this.heroe.style.top = `${this.y}vh`;
			if (this.x < -5 || this.x > 42 || this.y < -1 || this.y > 61) {
				this.terminoJuego();
			}
		});
	}

	escalarRango(eje: number, rangoEjeMin: number, rangoEjeMax: number, rangoMin: number, rangoMax: number) {
		return ((eje - rangoEjeMin) / (rangoEjeMax - rangoEjeMin) * (rangoMax - rangoMin)) + rangoMin;
	}

	public terminoJuego() {
		this.pauseTimer();
		this.juegoProcc = false;
		this.deviceSubscription.unsubscribe();
		this.juego.guardar(this.usuario, this.timeLeft).then(resp => {
			return Swal.fire({
				title: 'Juego terminado! ',
				icon: 'success',
				showCancelButton: true,
				confirmButtonText: 'Nuevo Juego',
				cancelButtonText: 'Ver records',
			});
		}).then((result) => {
			if (result.value) {
				this.flagSecc = 'seleccPersonaje';
			} else {
				this.flagSecc = 'resultados';
			}
		})
	}

	public pauseTimer() {
		clearInterval(this.interval);
	}

	public startTimer() {
		this.interval = setInterval(() => {
			if (this.timeLeft >= 0) {
				this.timeLeft++;
			} else {
				this.timeLeft = 0;
			}
		}, 1000)
	}

	public cerrarSesion() {
		this.auth.logout().then(() => {
			if (this.subU !== null) {
				this.subU.unsubscribe();
				this.subJuegos.unsubscribe();
			}
			this.comp.playAudio('error');
			this.router.navigate([''])
		});
	}

}
