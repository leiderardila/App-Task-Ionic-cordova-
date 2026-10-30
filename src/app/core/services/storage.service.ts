import { Injectable } from '@angular/core';

/**
 * Almacenamiento local sobre localStorage (disponible en el WebView de Cordova).
 * Mantiene la API asíncrona anterior para no cambiar a los servicios que la usan.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {

  async save(key: string, value: unknown): Promise<void> {
    localStorage.setItem(key, JSON.stringify(value));
  }

  async get(key: string) {
    const data = localStorage.getItem(key);

    return data
      ? JSON.parse(data)
      : null;
  }
}
