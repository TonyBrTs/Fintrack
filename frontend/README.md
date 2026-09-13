# FinTrack - Frontend 🎨

Interfaz web moderna y accesible de **FinTrack**, construida con **Next.js 16 (React 19)**, **Tailwind CSS v4**, capacidades PWA y análisis financiero impulsado por **Google Gemini AI**.

---

## 🛠️ Stack Tecnológico

* **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React 19)
* **Estilos & Diseño**: [Tailwind CSS v4](https://tailwindcss.com/)
* **Componentes UI**: [Radix UI](https://www.radix-ui.com/) (Diálogos, selectores accesibles, dropdowns)
* **Animaciones**: [Framer Motion](https://www.framer.com/motion/)
* **Gráficos**: [Recharts](https://recharts.org/)
* **Autenticación**: [@supabase/supabase-js](https://supabase.com/docs) (Email, Google OAuth 2.0 y recuperación de contraseña)
* **Motor de IA**: Google Gemini (Modelos 2.0 Flash / 1.5 Flash en route handler serverless)
* **PWA**: Service Worker nativo (`public/sw.js`) y Web App Manifest

---

## 🚀 Inicio Rápido

### Prerrequisitos
Tener Node.js v20+ instalado:
```bash
node -v
```

### Comandos de Desarrollo
```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo en http://localhost:3000
npm run dev

# Verificación de linter y calidad de código
npm run lint

# Compilación optimizada para producción
npm run build
npm start
```

---

## 📂 Estructura del Frontend

```
frontend/
├── public/                 # Recursos PWA (Service Worker, iconos, manifest)
├── src/
│   ├── app/                # App Router de Next.js
│   │   ├── api/ai/         # Route Handler Serverless para Gemini AI
│   │   ├── expenses/       # Vista de egresos
│   │   ├── incomes/        # Vista de ingresos
│   │   ├── goals/          # Vista de metas de ahorro
│   │   ├── layout.tsx      # Shell principal y Providers
│   │   └── page.tsx        # Dashboard analítico
│   ├── components/         # Componentes organizados por dominio
│   │   ├── auth/           # Modales de autenticación, Google OAuth y recuperación
│   │   ├── categories/     # Gestión dinámica de categorías
│   │   ├── expenses/       # Formularios y listados de gastos
│   │   ├── incomes/        # Formularios y listados de ingresos
│   │   ├── goals/          # Tarjetas y aportes a metas
│   │   ├── layout/         # Header, BrandLogo, SubNavbar animado
│   │   └── ui/             # Primitivas accesibles Radix UI
│   ├── contexts/           # Estado global (Auth, Currency, Language, Audio)
│   ├── hooks/              # Custom React Hooks
│   ├── lib/                # Clientes API, Supabase e i18n
│   └── types/              # Interfaces TypeScript compartidas
└── README.md
```

---

## 📖 Documentación Detallada

Para consultar la documentación técnica completa del proyecto:
* [Arquitectura del Sistema](../docs/ARCHITECTURE.md)
* [Principios SOLID](../docs/SOLID_PRINCIPLES.md)
* [Integración de IA con Gemini](../docs/AI_INSIGHTS.md)
* [Flujos de Autenticación y Seguridad](../docs/AUTH_AND_SECURITY.md)
* [Guía de Despliegue](../docs/DEPLOYMENT.md)
