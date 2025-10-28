import { Component } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AlertController, IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule, HttpClientModule],
  standalone: true,
})
export class LoginPage {
  usuario: string = '';
  contrasena: string = '';
  apiUrl: string = 'https://api-login-1055084004649.us-central1.run.app';


  constructor(
    private http: HttpClient,
    private alertCtrl: AlertController,
    private router: Router
  ) {}

  async login() {
    if (!this.usuario || !this.contrasena) {
      this.mostrarAlerta(' Debes ingresar usuario y contraseña.', 'error');
      return;
    }

    const body = {
      usuario: this.usuario,
      contrasena: this.contrasena,
    };

    this.http.post(`${this.apiUrl}/login`, body).subscribe({
      next: async (res: any) => {
        if (res.success) {
          console.log('Respuesta API Login:', res);

          // Asumimos que la API devuelve estos datos
          const sku = res.sku ?? 'N/A';
          const nombre = res.nombre ?? 'N/A';
          const categoria = res.categoria ?? 'N/A';

          const mensajeExito = `Login exitoso:\n\n` +
                               `SKU: ${sku}\n` +
                               `Nombre: ${nombre}\n` +
                               `Categoría: ${categoria}`;

          await this.mostrarAlerta(mensajeExito, 'success');
          this.router.navigate(['/scanner']);

        } else {
          await this.mostrarAlerta(res.message || ' Usuario o contraseña incorrectos.', 'error');
        }
      },
      error: async (err) => {
        console.error('Error en login:', err);
        const status = err.status || 'desconocido';
        const errorDetail = err.error?.error || err.error?.message || 'Error desconocido del servidor.';
        await this.mostrarAlerta(` Error al conectar con la API (status: ${status})\n${errorDetail}`, 'error');
      },
    });
  }

  /**
   * Muestra una alerta formateada.
   */
  async mostrarAlerta(mensaje: string, type: 'success' | 'error' = 'success') {
    const alert = await this.alertCtrl.create({
      header: type === 'success' ? 'Inicio de Sesión Exitoso' : 'Error de Inicio de Sesión',
      // --- ¡LA CORRECCIÓN ESTÁ AQUÍ! ---
      message: mensaje.replace(/\n/g, '<br/>'), // Asegura saltos de línea en HTML
      buttons: ['OK'],
      backdropDismiss: false
    });
    await alert.present();
  }
}

