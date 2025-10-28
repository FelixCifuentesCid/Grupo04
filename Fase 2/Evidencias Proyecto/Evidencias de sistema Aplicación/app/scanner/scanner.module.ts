import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ScannerPageRoutingModule } from './scanner-routing.module';
import { ScannerPage } from './scanner.page';
import { ProductoFormPage } from '../producto-form/producto-form.page';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ScannerPageRoutingModule,
    HttpClientModule,
    // --- LA CORRECCIÓN ESTÁ AQUÍ ---
    // Los componentes Standalone se importan, no se declaran.
    ScannerPage, 
    ProductoFormPage
  ],
  // El array de 'declarations' ahora debe estar vacío para este módulo.
  declarations: []
})
export class ScannerPageModule {}