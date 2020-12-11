import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class JuegoService {

  constructor(private firestore: AngularFirestore) { }

  public traerTodos(){
  	return this.firestore.collection('juegoMovKinetico').doc('subcolecciones').collection('juegos').snapshotChanges();
  }

  public guardar(jugador: any, tiempo: number){
  	let data: any = {
  		jugador: jugador.email,
  		fechaUltimoJuego: Date.now(),
  		ultimoPuntaje: tiempo,
  		mejorPuntaje: tiempo,
  	}
  	return this.firestore.collection('juegoMovKinetico').doc('subcolecciones').collection('juegos').doc(jugador.uid).get().toPromise().then(ref =>{
  		if(ref.exists && ref.data().mejorPuntaje > tiempo){
  				data.mejorPuntaje = ref.data().mejorPuntaje;
  		}
  		return this.firestore.collection('juegoMovKinetico').doc('subcolecciones').collection('juegos').doc(jugador.uid).set(data,{merge: true});

  	})
  }


}
