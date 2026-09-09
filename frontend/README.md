# FinTrack - Frontend 🎨

Interfaz web moderna de **FinTrack**, construida con **Next.js 16 (React 19)**, **Tailwind CSS v4** y una estética cuidada con soporte para PWA, micro-animaciones y diseño adaptativo.

---

## 🛠 Stack Tecnológico

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React 19)
- **Estilos**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Componentes Primitivos**: [Radix UI](https://www.radix-ui.com/) (Select, Popovers, Dropdowns)
- **Animaciones**: [Framer Motion](https://www.framer.com/motion/)
- **Gráficos**: [Recharts](https://recharts.org/)
- **Iconografía**: [Lucide React](https://lucide.dev/)
- **Logotipo Vectorial**: Componente SVG personalizado adaptativo ([BrandLogo.tsx](src/components/layout/BrandLogo.tsx))
- **Notificaciones**: [Sonner](https://sonner.emilkowal.ski/)
- **PWA**: Service Worker (`public/sw.js`) y Web App Manifest (`src/app/manifest.ts`)

---

## 🚀 Inicio y Scripts Disponibles

### Instalación de dependencias

```bash
cd frontend
npm install
```

### Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará accesible en [http://localhost:3000](http://localhost:3000).

### Compilación para Producción

```bash
npm run build
npm start
```

### Comprobación de Calidad y Linter

```bash
npm run lint
```

---

## 🌐 Enrutamiento y Páginas

- `/`: **Resumen / Dashboard** — Vista general, métricas financieras clave, carrusel animado de transacciones recientes, gráficos de distribución y metas destacadas.
- `/expenses`: **Gastos** — Gestión, categorización y filtros dinámicos por descripción y categoría.
- `/incomes`: **Ingresos** — Registro y análisis de entradas por fuente de ingresos.
- `/goals`: **Metas** — Monitoreo de ahorros y contribución interactiva a objetivos.

---

## 📂 Estructura del Código Fuente

```
frontend/
├── public/                     # Recursos estáticos y PWA
│   ├── sw.js                   # Service worker para caché offline
│   ├── icon-192.png            # Icono PWA para dispositivos
│   └── icon-512.png            # Icono PWA splash screen
├── src/
│   ├── app/                    # Rutas de Next.js App Router
│   │   ├── expenses/           # Página de Gastos
│   │   ├── incomes/            # Página de Ingresos
│   │   ├── goals/              # Página de Metas
│   │   ├── layout.tsx          # Layout principal (Providers, Header, SubNavbar)
│   │   ├── page.tsx            # Dashboard / Resumen
│   │   ├── manifest.ts         # Generador de Web App Manifest
│   │   └── globals.css         # Tokens de diseño Tailwind v4 y scrollbar personalizado
│   ├── components/
│   │   ├── expenses/           # Modales de creación/edición de gastos
│   │   ├── incomes/            # Modales de creación/edición de ingresos
│   │   ├── goals/              # Tarjetas interactivas y modales de metas
│   │   ├── layout/             # Header, SubNavbar, BrandLogo SVG, ServiceWorkerRegister
│   │   └── ui/                 # Componentes Radix UI estilizados (Select, Sheet, KPICard)
│   ├── contexts/               # SettingsContext (idiomas en/es, monedas USD/EUR/GBP/CRC)
│   ├── lib/                    # Translations, clientes API y utilidades de formato
│   └── types/                  # Definiciones de tipos TypeScript (Expense, Income, Goal)
├── next.config.ts              # Configuración de Next.js y variables de entorno
├── package.json
└── README.md
```

---

## 🌟 Características de la Interfaz

1. **Carrusel de Actividad Reciente**:
   - Avance automático cada 3.5 segundos con transición continua en bucle infinito.
   - Pausa al interactuar con el ratón o en pantallas táctiles.
   - Indicador minimalista de progreso y botones de navegación manual.
2. **Filtros Radix UI Glassmorphic**:
   - Menús desplegables con desenfoque de fondo y borde refinado, sin depender de los controles nativos del sistema operativo.
3. **SubNavbar Segmentado**:
   - Pestañas con micro-animaciones mediante `layoutId` de Framer Motion e íconos temáticos para cada vista.
4. **Menú Lateral Completo en Móviles**:
   - Implementado con `createPortal` para evitar recortes de `backdrop-filter`, con controles táctiles para tema, idioma y moneda.

---

_Desarrollado con ❤️ por TonyBrTs_
