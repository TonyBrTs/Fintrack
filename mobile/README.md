# FinTrack Mobile

Aplicación móvil oficial de **FinTrack** desarrollada con **Expo (React Native)**, **TypeScript** y **Tailwind CSS (NativeWind v4)**.

Conectada directamente al backend de Go en producción (`https://fintrack-ihwb.onrender.com`) y a **Supabase Auth** con almacenamiento de sesión cifrado nativo (`expo-secure-store`).

---

## Requisitos Previos

1. [Node.js](https://nodejs.org/) v20 o superior.
2. La app gratuita **Expo Go** en tu teléfono:
   - [Expo Go en Google Play (Android)](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [Expo Go en App Store (iOS)](https://apps.apple.com/app/expo-go/id982107779)

---

## Cómo ejecutar la app en tu teléfono (Desarrollo)

1. Sitúate en la carpeta `mobile`:
   ```bash
   cd mobile
   ```

2. Instala dependencias si es la primera vez:
   ```bash
   npm install
   ```

3. Inicia el servidor Metro:
   ```bash
   npx expo start
   ```

4. **Conecta tu teléfono**:
   - **Android**: Abre **Expo Go** y selecciona *"Scan QR code"*.
   - **iOS**: Abre la cámara nativa de tu iPhone y escanea el código QR de la terminal.

---

## Compilación de Producción (Deploy APK)

Para generar un instalable nativo `.apk` descargable mediante **EAS Build**:

1. Instala el CLI de EAS globalmente:
   ```bash
   npm install -g eas-cli
   ```

2. Inicia sesión con tu cuenta de Expo:
   ```bash
   eas login
   ```

3. Compila el APK para Android:
   ```bash
   eas build --platform android --profile preview
   ```

---

## Estructura del Proyecto

```
mobile/
├── assets/                 # Iconos, favicons y logos adaptativos
├── src/
│   ├── components/         # Modales, hojas de acción, gráficos y widgets reutilizables
│   ├── context/            # Proveedores de estado global (Auth, Settings)
│   ├── lib/                # API REST, Supabase, constantes y formateadores
│   ├── navigation/         # Tab Navigator y barra inferior flotante
│   ├── screens/            # Pantallas (Dashboard, Transacciones, Recurrentes, Metas, Reportes, Login)
│   └── types/              # Definiciones TypeScript de entidades
├── App.tsx                 # Bootstrap y navegación condicional
├── app.json                # Configuración nativa de Expo
├── eas.json                # Configuración de compilación en la nube
├── global.css              # Directivas de Tailwind CSS
├── tailwind.config.js      # Configuración y paleta de diseño de Tailwind
└── package.json
```
