import { Component, OnDestroy } from '@angular/core';
import { BarcodeScanner, Barcode } from '@capacitor-mlkit/barcode-scanning';
// Eliminé imports no utilizados como NgModule, Platform (a menos que lo uses en otra parte)
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule } from '@ionic/angular'; // Platform eliminado si no se usa
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
// Eliminado CameraPreview ya que acordamos no usarlo
// import { CameraPreview, CameraPreviewOptions } from '@capacitor-community/camera-preview';
import { ModalController } from '@ionic/angular'; // Importar ModalController si usas abrirFormularioProducto
import { ProductoFormPage } from '../producto-form/producto-form.page'; // Asegúrate que la ruta sea correcta

@Component({
  selector: 'app-scanner',
  templateUrl: './scanner.page.html',
  styleUrls: ['./scanner.page.scss'],
  // Esta línea es necesaria si estás usando Standalone Components.
  // Si usas NgModules (tienes scanner.module.ts), esta línea no va aquí,
  // sino en scanner.module.ts como lo hicimos antes. Basado en errores previos,
  // parece que sí usas Standalone, así que la dejamos.
  imports: [IonicModule, CommonModule, FormsModule, HttpClientModule],
  standalone: true, // Confirmamos que es Standalone
})
export class ScannerPage implements OnDestroy {
  scannedResult: string = '';
  isScanning: boolean = false;
  listener: any = null; // Mantenemos el listener
  historialEscaneos: any[] = [];

  apiUrl: string = 'https://api-inventario-1055084004649.us-central1.run.app';
  apiURL: string ='https://api-toma-inv-1055084004649.us-central1.run.app'; // API para registrar

  constructor(
    private alertCtrl: AlertController,
    private http: HttpClient,
    private modalCtrl: ModalController // Necesario para abrir el formulario
  ) {}


  /**
   * REGISTRAR SKU (llama a api-toma-inv)
   */
  async startScan2() {
    if (this.isScanning) { return; }
    this.isScanning = true;

    try {
      const permission = await BarcodeScanner.requestPermissions();
      if (permission.camera !== 'granted') {
        await this.presentAlert('Permiso de cámara denegado.', 'error');
        this.isScanning = false;
        return;
      }

      // --- YA NO SE USA CameraPreview ---

      this.listener = await BarcodeScanner.addListener('barcodesScanned', async (event) => {
        this.stopScanner(); // Detiene inmediatamente al recibir CUALQUIER resultado

        if (event.barcodes && event.barcodes.length > 0) {
          const barcode: Barcode = event.barcodes[0];
          this.scannedResult = barcode.displayValue;
          const skuNumberStr = this.scannedResult.trim(); // Usamos string aquí

          // Convertimos a número SOLO para la llamada a la API si es necesario
          // Asumiendo que la API /scan espera un número
          let skuToSend: number | string = skuNumberStr;
          if (!isNaN(Number(skuNumberStr))) {
              skuToSend = Number(skuNumberStr);
          } else {
              // Si no es un número válido, podrías mostrar error o enviarlo como string
              // Depende de cómo esté hecha tu API /scan
              // Por ahora, lo enviamos como string si no es número.
              // await this.presentAlert('El código escaneado no es un número válido.', 'error');
              // return; // Quitamos el return para intentar enviarlo como string
          }


          this.http.post(`${this.apiURL}/scan`, { sku: skuToSend }).subscribe({
            next: async (data: any) => {
              // --- FORMATO DE ALERTA CORREGIDO ---
              let alertMessage = '';
              if (data.producto) {
                // Aseguramos que los valores existan antes de mostrarlos
                const sku = data.producto.sku ?? 'N/A';
                const nombre = data.producto.nombre ?? 'N/A';
                const cantidad = data.producto.cantidad_escaneos ?? 'N/A';

                alertMessage = `Producto escaneado correctamente:\n` +
                               `SKU: ${sku}\n` +
                               `Nombre: ${nombre}\n` +
                               `Cantidad de escaneos: ${cantidad}`;
                this.addToHistory(data.producto);
              } else {
                 alertMessage = data.message || `SKU ${skuNumberStr} registrado.`;
              }
              await this.presentAlert(alertMessage, 'success');
            },
            error: async (err) => {
              const status = err.status || 'desconocido';
              const errorDetail = err.error?.error || err.error?.message || 'Error desconocido del servidor.';
              await this.presentAlert(`Error API startScan2 (status: ${status})\n${errorDetail}`, 'error');
            },
          });
        }
      });

      await BarcodeScanner.startScan();

    } catch (error: any) {
      console.error('Error en startScan2:', error);
      const errorMessage = (error.message === 'scan cancelled') ? 'Escaneo cancelado.' : 'Error inesperado.';
      await this.presentAlert(errorMessage, 'error');
    } finally {
      // No reseteamos isScanning aquí, se hace en stopScanner que es llamado por el listener
      // this.isScanning = false; // <-- ESTA LÍNEA NO DEBE IR AQUÍ
    }
  }

  /**
   * CONSULTAR SKU (llama a api-inventario)
   */
  async startScan() {
    if (this.isScanning) { return; }
    this.isScanning = true;

    try {
      const permission = await BarcodeScanner.requestPermissions();
      if (permission.camera !== 'granted') {
        await this.presentAlert('Permiso de cámara denegado.', 'error');
        this.isScanning = false;
        return;
      }

      // --- YA NO SE USA CameraPreview ---

      this.listener = await BarcodeScanner.addListener('barcodesScanned', async (event) => {
        this.stopScanner();

        if (event.barcodes && event.barcodes.length > 0) {
          const barcode: Barcode = event.barcodes[0];
          this.scannedResult = barcode.displayValue;
          const skuNumberStr = this.scannedResult.trim();

          this.http.get(`${this.apiUrl}/producto/${skuNumberStr}`).subscribe({
            next: (data: any) => {
              this.addToHistory(data);
              // --- FORMATO DE ALERTA CORREGIDO ---
              // Aseguramos que los valores existan
              const sku = data.sku ?? 'N/A';
              const nombre = data.nombre ?? 'N/A';
              const categoria = data.categoria ?? 'N/A';
              const precio = data.precio !== null ? data.precio : 'N/A';
              const ubicacion = data.ubicacion ?? 'N/A';

              const alertMessage = `Producto encontrado:\n\n` +
                                   `SKU: ${sku}\n` +
                                   `Nombre: ${nombre}\n` +
                                   `Categoría: ${categoria}\n` +
                                   `Precio: ${precio}\n` +
                                   `Ubicación: ${ubicacion}`;
              this.presentAlert(alertMessage, 'success');
            },
            error: async (err) => {
                if (err.status === 404) {
                    Haptics.impact({ style: ImpactStyle.Medium });
                    const confirmAlert = await this.alertCtrl.create({
                        header: 'Producto no encontrado',
                        message: `El SKU ${skuNumberStr} no existe en el catálogo. ¿Deseas añadirlo ahora?`,
                        buttons: [
                            { text: 'Cancelar', role: 'cancel' },
                            { text: 'Añadir', handler: () => this.abrirFormularioProducto(skuNumberStr) }
                        ]
                    });
                    await confirmAlert.present();
                } else {
                    const status = err.status || 'desconocido';
                    const errorDetail = err.error?.error || err.error?.message || 'Error desconocido del servidor.';
                    this.presentAlert(`Error consultando API (status: ${status})\n${errorDetail}`, 'error');
                }
            }
          });
        }
      });

      await BarcodeScanner.startScan();

    } catch (error: any) {
      console.error('Error en startScan:', error);
      const errorMessage = (error.message === 'scan cancelled') ? 'Escaneo cancelado.' : 'Error inesperado.';
      await this.presentAlert(errorMessage, 'warning');
    } finally {
      // this.isScanning = false; // <-- ESTA LÍNEA NO DEBE IR AQUÍ
    }
  }

  /**
   * Abre el modal del formulario para crear un nuevo producto.
   */
  async abrirFormularioProducto(sku: string) {
    // Primero nos aseguramos que cualquier escaneo previo esté detenido
    this.stopScanner();

    const modal = await this.modalCtrl.create({
      component: ProductoFormPage,
      componentProps: { sku: sku }
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data && data.nuevoProducto) {
      this.addToHistory(data.nuevoProducto);
      await this.presentAlert("Producto guardado con éxito.", "success");
    }
    // No reseteamos isScanning aquí, ya se hizo en stopScanner
  }


  /**
   * Detiene el escáner y el listener, y resetea el estado.
   */
  stopScanner() {
    // Intentamos detener el escaneo, puede fallar si ya está detenido
    BarcodeScanner.stopScan().catch(e => console.warn("stopScan falló (puede ser normal):", e));
    // Removemos el listener si existe
    if (this.listener) {
      try {
        this.listener.remove();
        console.log("Listener removido");
      } catch (e) {
        console.warn("Listener ya había sido removido o falló al remover:", e);
      }
      this.listener = null;
    }
    // Reseteamos el estado de escaneo
    this.isScanning = false;
    console.log("Estado de escaneo reseteado a false");
  }

  addToHistory(producto: any) {
    const itemHistorial = {
        sku: producto.sku ?? 'N/A',
        nombre: producto.nombre || 'Producto sin nombre',
        timestamp: new Date()
    };
    this.historialEscaneos.unshift(itemHistorial);
    if (this.historialEscaneos.length > 5) {
      this.historialEscaneos.pop();
    }
  }

  async presentAlert(message: string, type: 'success' | 'error' | 'warning' = 'success') {
    // Vibración
    if (type === 'success') Haptics.impact({ style: ImpactStyle.Light });
    if (type === 'error') Haptics.vibrate();
    if (type === 'warning') Haptics.impact({ style: ImpactStyle.Medium });

    const alert = await this.alertCtrl.create({
      header: type.charAt(0).toUpperCase() + type.slice(1),
      // --- LA CLAVE ESTÁ AQUÍ: Reemplazar \n con <br/> ---
      message: message.replace(/\n/g, '<br/>'),
      cssClass: 'custom-alert',
      backdropDismiss: false,
      buttons: ['OK'],
    });

    // Asegurarse de detener cualquier posible escaneo antes de mostrar alerta
    this.stopScanner();

    await alert.present();
  }

  ngOnDestroy() {
    // Asegurarse de detener todo al destruir el componente
    this.stopScanner();
    // --- YA NO SE USA CameraPreview ---
    // CameraPreview.stop();
  }

  async crearTabla() {
    // Esta función debería llamar a la API correcta (/crear_tabla)
    this.http.post(`${this.apiURL}/crear_tabla`, {}).subscribe({
      next: async (res: any) => {
        await this.presentAlert(res.message || 'Tabla creada correctamente.', 'success');
      },
      error: async (err) => {
        console.error('Error creando tabla:', err);
        const status = err.status || 'desconocido';
        const errorDetail = err.error?.error || err.error?.message || 'Error desconocido.';
        await this.presentAlert(`Error al crear tabla (status: ${status})\n${errorDetail}`, 'error');
      },
    });
  }
}

