# App Task — Ionic + Angular

Lista de tareas con categorías, Firebase Remote Config (feature flag) y soporte para Android e iOS con **Cordova**.

## Funcionalidades

- Tareas: agregar, completar, eliminar. Persisten en almacenamiento local (`localStorage` del WebView).
- Categorías: crear, editar, eliminar, asignar a una tarea y filtrar.
- Feature flag `categories` (Firebase Remote Config): si está en `false` se oculta todo lo relacionado con categorías.

## Estructura

```
src/app/
├── core/
│   ├── models/      task.model.ts, category.model.ts
│   └── services/    task, category, storage, feature-flag
├── pages/           home, tasks, categories
├── shared/components/  task-card, category-filter, empty-state
└── app.routes.ts
src/environments/    configuración de Firebase por entorno
```

## Requisitos

- Node.js >= 22.22.3 (requerido por Angular CLI 22)
- Ionic CLI: `npm i -g @ionic/cli`
- Cordova se instala con el proyecto (`npm install`); se invoca con `npx cordova`
- Android: Android Studio + SDK y JDK 17
- iOS: macOS con Xcode

## Ejecutar en el navegador

```bash
npm install
ionic serve
```

## Configurar Firebase y Remote Config

1. Crear un proyecto en [Firebase Console](https://console.firebase.google.com) y registrar una app web.
2. Copiar la configuración de la app web en `src/environments/environment.ts` y `environment.prod.ts`.
3. En **Remote Config** crear el parámetro `categories` (Boolean) con valor `true` y publicar.
4. Demostración: poner `categories` en `false`, publicar y reabrir la app. Se ocultan el selector de categoría, el filtro y el acceso a Categorías; la ruta `/categories` redirige a `/home`.

Si Firebase no responde o no está configurado, la app usa el valor por defecto (`true`) y no se bloquea.

## Compilar para Android e iOS (Cordova)

La configuración de la app está en [`config.xml`](config.xml). Los proyectos nativos se generan en `platforms/` (no se versionan).

```bash
ng build                          # genera www/
npx cordova platform add android  # solo la primera vez
npx cordova platform add ios      # solo la primera vez, requiere macOS
npx cordova build android         # genera el APK
npx cordova build ios             # requiere macOS y Xcode
```

- **APK (debug):** `platforms/android/app/build/outputs/apk/debug/app-debug.apk`.
- **Variables de entorno (Android):** `JAVA_HOME` apuntando a un JDK 17 (la carpeta del JDK, no su `bin`), `ANDROID_HOME` con la ruta del SDK y `gradle` disponible en el `PATH` (o Android Studio instalado).
- **Ejecutar en un dispositivo o emulador:** `npx cordova run android`.
- **IPA:** en Xcode, abrir el proyecto de `platforms/ios`, *Product > Archive* y *Distribute App* (requiere cuenta de Apple Developer y firma).
- Sin Mac, el IPA puede generarse con un servicio en la nube (Codemagic, MacStadium, etc.).

### APK e IPA con GitHub Actions

El flujo [`.github/workflows/build.yml`](.github/workflows/build.yml) genera el APK y el IPA en servidores de GitHub, sin necesidad de un Mac propio ni de una cuenta de Apple Developer:

1. En GitHub: **Actions > Build APK e IPA > Run workflow**.
2. Al terminar, descargar los artefactos de la ejecución:
   - **App-apk**: contiene `app-debug.apk`.
   - **App-unsigned-ipa**: contiene `App-unsigned.ipa`.

Los dos trabajos (`apk` en Linux e `ipa` en macOS) corren en paralelo.

> **Importante:** el IPA es **sin firma**, por lo que no se instala directamente en un iPhone. Para instalarlo hay que firmarlo con un certificado y un provisioning profile de Apple Developer, o compilar desde Xcode con una cuenta de Apple.

## Optimización de rendimiento

- Páginas con carga diferida (`loadComponent`) y precarga de rutas.
- Virtual scroll (`@angular/cdk`) en la lista de tareas: solo se renderizan los elementos visibles.
- Componentes `OnPush` y estado con signals.
- Mapa id → nombre de categoría (`computed`) para evitar búsquedas por cada tarea renderizada.
- Inicio no bloqueante: Remote Config tiene un tope de 3 s.

## Preguntas de la prueba

### ¿Cuáles fueron los principales desafíos al implementar las nuevas funcionalidades?

- **Compatibilidad de versiones:** `@angular/fire` 21 solo admite Angular 21 y TypeScript menor que 6, mientras que la plantilla de Ionic trae Angular 22. Se resolvió usando el SDK `firebase` directamente, que no depende de la versión de Angular.
- **Almacenamiento local:** `StorageService` expone una API asíncrona sobre `localStorage`, y los servicios cargan los datos al iniciar. Además, `Date` se serializa como texto en JSON y se restaura al leer.
- **Feature flag sin bloquear el inicio:** Remote Config requiere red. Se carga al arrancar con un tope de 3 s y con valores por defecto, para que la app funcione aunque Firebase falle.
- **Integridad de datos:** al eliminar una categoría, sus tareas quedaban apuntando a un id inexistente. Ahora quedan sin categoría.
- **Herramientas de compilación:** Angular CLI 22 exige Node 22.22.3 o superior, y Cordova exige tener `JAVA_HOME`, `ANDROID_HOME` y `gradle` bien configurados para compilar Android.

### ¿Qué técnicas de optimización de rendimiento aplicaste y por qué?

- **Virtual scroll** (`@angular/cdk`): con miles de tareas solo se renderizan las visibles, lo que reduce el DOM y la memoria.
- **Carga diferida de páginas** (`loadComponent`): reduce el tamaño del bundle inicial y acelera el arranque.
- **`ChangeDetectionStrategy.OnPush` y signals:** Angular solo revisa los componentes cuyos datos cambian.
- **`computed` con un mapa id → nombre de categoría:** evita buscar la categoría por cada tarea renderizada.
- **`trackBy`:** reutiliza los elementos del DOM al filtrar o modificar la lista.
- **Inicio con tope de 3 s para Remote Config:** una red lenta no retrasa la pantalla inicial.

### ¿Cómo aseguraste la calidad y mantenibilidad del código?

- **Estructura por responsabilidad:** `core` (modelos y servicios), `pages` y `shared/components`.
- **Componentes standalone, pequeños y reutilizables** (`task-card`, `category-filter`, `empty-state`).
- **Lógica fuera de los componentes:** el acceso a datos, el almacenamiento y los feature flags viven en servicios inyectables.
- **Tipado estricto de TypeScript:** el proyecto compila sin errores con `ng build`.
- **Un único punto de acceso a los flags:** `FeatureFlagService` centraliza los valores por defecto y Remote Config.
- **Comentarios en las decisiones no obvias** y commits pequeños y descriptivos.
- **Pendiente:** no se escribieron pruebas unitarias propias; el proyecto trae la configuración de Vitest y Playwright lista para añadirlas.
