import { Component, Input, OnInit } from '@angular/core';
import { ModalController, AlertController, IonicModule } from '@ionic/angular'; // <-- Importar IonicModule
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common'; // <-- Importar CommonModule
import { FormsModule } from '@angular/forms'; // <-- Importar FormsModule para ngModel

@Component({
  selector: 'app-producto-form',
  templateUrl: './producto-form.page.html',
  // --- ¡LA SOLUCIÓN ESTÁ AQUÍ! ---
  // Añadimos los imports que necesita este componente Standalone
  imports: [IonicModule, CommonModule, FormsModule, HttpClientModule],
  standalone: true, // Indicamos explícitamente que es Standalone
})
export class ProductoFormPage implements OnInit {

  @Input() sku: string = '';
  
  apiUrl: string = 'https://inventario-api-1055084004649.us-central1.run.app'; 

  producto = {
    sku: '',
    nombre: '',
    categoria: '',
    precio: null as number | null, // Tipado correcto para el input numérico
    ubicacion: ''
  };

  constructor(
    private modalCtrl: ModalController,
    private http: HttpClient,
    private alertCtrl: AlertController
  ) { }

  ngOnInit() {
    this.producto.sku = this.sku;
  }

  cancelar() {
    this.modalCtrl.dismiss();
  }

  guardar() {
    // Llamamos al endpoint POST /producto que ya definimos en la API
    this.http.post(`${this.apiUrl}/producto`, this.producto).subscribe({
      next: (res: any) => {
        // Si se guarda bien, cerramos el modal y devolvemos el nuevo producto
        this.modalCtrl.dismiss({ nuevoProducto: res });
      },
      error: async (err) => {
        const alert = await this.alertCtrl.create({
          header: 'Error al Guardar',
          message: `La API devolvió un error (status: ${err.status}). Por favor, revisa el backend.`,
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }
}