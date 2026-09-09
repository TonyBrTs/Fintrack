# FinTrack 🚀

**FinTrack** es una plataforma integral y moderna para la gestión financiera personal. Diseñada con un enfoque de alto rendimiento, estética contemporánea (diseño en modo oscuro obsidian, modo claro limpio, glassmorphism y micro-animaciones fluidas), soporte multimoneda, internacionalización bilingüe y capacidades PWA.

---

## ✨ Tecnologías Principales

| Componente | Stack Tecnológico | Características Clave |
| :--- | :--- | :--- |
| **Frontend** | [Next.js 16](https://nextjs.org/) (React 19), [Tailwind CSS v4](https://tailwindcss.com/) | Radix UI, Framer Motion, Recharts, Lucide Icons, Sonner (Toasts) |
| **Backend** | [Go 1.23](https://go.dev/), [Gin Framework](https://gin-gonic.com/) | API RESTful ultra-rápida, almacenamiento JSON local, middleware CORS |
| **PWA** | Web App Manifest & Service Worker nativo | Instalable como Progressive Web App, caché offline de recursos estáticos |

---

## 🌟 Funcionalidades Destacadas

- **Dashboard Financiero Completo**: Vista en tiempo real del saldo total, ingresos, egresos, tasa de ahorro neta y consejos inteligentes (*Financial Insights*).
- **Filtros Dinámicos con Radix UI**: Desplegables estilizados con *glassmorphism* (`backdrop-blur-2xl bg-card/95`), rotación fluida de chevron y selección por mes, categoría o fuente.
- **Carrusel de Actividad Reciente con Loop Automático**:
  - Avance automático continuo cada 3.5 segundos.
  - Transición fluida en bucle infinito (*loop*).
  - Pausa inteligente por interacción (`hover` en ratón o `touch` en móviles).
  - Botones de navegación manuales y barra indicadora de progreso.
- **Barra de Navegación Segmentada (`SubNavbar`)**: Píldora interactiva con indicador animado por Framer Motion (`layoutId="activeSubTab"`) e íconos cromáticos temáticos.
- **Menú Lateral Full-Screen en Móviles**: Cajón desplegable optimizado con `createPortal` para evitar recortes de `backdrop-filter`, con controles de tema, idioma y divisas.
- **Gestión de Metas de Ahorro**: Seguimiento de objetivos financieros, barras de progreso y cálculo de monto restante.
- **Multimoneda Dinámica**: Compatibilidad nativa con **USD ($)**, **EUR (€)**, **GBP (£)** y **CRC (₡)**.
- **Bilingüe (i18n)**: Soporte completo en **Español** e **Inglés**.
- **Tema Adaptable**: Modo Claro pulido y Modo Oscuro profundo con persistencia en `localStorage`.

---

## 🚀 Inicio Rápido

### Requisitos Previos

- [Node.js](https://nodejs.org/) v20 o superior
- [Go](https://go.dev/) v1.23 o superior (o entorno WSL en Windows)

---

### 1. Configurar y Ejecutar el Backend

El backend se ejecuta por defecto en el puerto `8080`.

```bash
cd backend
go run main.go
```

> **Nota:** La API almacena los datos en archivos JSON locales (`expenses.json`, `incomes.json`, `goals.json`).

---

### 2. Configurar y Ejecutar el Frontend

El frontend se ejecuta en `http://localhost:3000`.

```bash
cd frontend
npm install
npm run dev
```

Para crear la versión de producción optimizada:

```bash
npm run build
npm start
```

---

## 🔌 Endpoints de la API REST

### Gastos (`/api/expenses`)
- `GET /api/expenses`: Obtener todos los gastos registrados.
- `POST /api/expenses`: Registrar un nuevo gasto.
- `PUT /api/expenses/:id`: Actualizar los datos de un gasto.
- `DELETE /api/expenses/:id`: Eliminar un gasto.

### Ingresos (`/api/incomes`)
- `GET /api/incomes`: Obtener todos los ingresos registrados.
- `POST /api/incomes`: Registrar un nuevo ingreso.
- `PUT /api/incomes/:id`: Actualizar un ingreso existente.
- `DELETE /api/incomes/:id`: Eliminar un ingreso.

### Metas de Ahorro (`/api/goals`)
- `GET /api/goals`: Obtener todas las metas.
- `POST /api/goals`: Crear una nueva meta.
- `PUT /api/goals/:id`: Actualizar o registrar aportes a una meta.
- `DELETE /api/goals/:id`: Eliminar una meta.

---

## 📂 Estructura del Repositorio

```
Fintrack/
├── backend/
│   ├── internal/
│   │   ├── handlers/       # Controladores de solicitudes HTTP
│   │   ├── models/         # Modelos de datos (Expense, Income, Goal)
│   │   └── repository/     # Capa de persistencia en archivos JSON
│   ├── expenses.json       # Base de datos JSON de gastos
│   ├── incomes.json        # Base de datos JSON de ingresos
│   ├── goals.json          # Base de datos JSON de metas
│   ├── go.mod              # Módulos y dependencias de Go
│   ├── main.go             # Punto de entrada del servidor Gin
│   └── README.md
│
├── frontend/
│   ├── public/             # PWA manifest, service worker e iconos
│   │   ├── sw.js           # Service Worker para caché offline
│   │   ├── icon-192.png    # Icono PWA (192x192)
│   │   └── icon-512.png    # Icono PWA (512x512)
│   ├── src/
│   │   ├── app/
│   │   │   ├── expenses/   # Página de Gastos con filtros
│   │   │   ├── incomes/    # Página de Ingresos con filtros
│   │   │   ├── goals/      # Página de Metas de ahorro
│   │   │   ├── layout.tsx  # Layout raíz con Providers y Navbar
│   │   │   ├── page.tsx    # Dashboard / Resumen financiero
│   │   │   └── globals.css # Tokens de diseño y utilidades
│   │   ├── components/
│   │   │   ├── expenses/   # Modales y detalles de gastos
│   │   │   ├── incomes/    # Modales y detalles de ingresos
│   │   │   ├── goals/      # Tarjetas y modales de metas
│   │   │   ├── layout/     # Header, BrandLogo SVG, SubNavbar
│   │   │   └── ui/         # Componentes Radix UI (Select, Sheet, etc.)
│   │   ├── contexts/       # SettingsContext (idioma, divisas)
│   │   ├── lib/            # Traducciones, llamadas a API y utilidades
│   │   └── types/          # Definiciones TypeScript
│   ├── next.config.ts
│   ├── package.json
│   └── README.md
│
└── README.md               # Documentación general del proyecto
```

---

_Desarrollado con ❤️ por TonyBrTs_
