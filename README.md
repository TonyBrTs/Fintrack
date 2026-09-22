# FinTrack 🚀

[![Go Version](https://img.shields.io/badge/Go-1.23+-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://go.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20Postgres-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI%20Insights-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Architecture](https://img.shields.io/badge/Architecture-Clean%20%26%20SOLID-FF6B6B?style=for-the-badge)](./docs/SOLID_PRINCIPLES.md)

**FinTrack** es una plataforma integral para la gestión y análisis de finanzas personales, diseñada con un estándar riguroso de ingeniería de software. Cuenta con una arquitectura desacoplada en el backend en **Go** basada en principios **SOLID** y **Clean Architecture**, un frontend moderno en **Next.js 16** con **Tailwind CSS v4**, autenticación segura multi-proveedor (Email, Google OAuth 2.0 y recuperación de contraseñas), persistencia en **PostgreSQL** con aislamiento multi-inquilino (*Multi-tenancy*), y un motor inteligente de asesoría financiera impulsado por **Google Gemini AI**.

---

## 🌐 Enlaces en Vivo

* 📱 **Frontend en Producción**: [https://fintrack-six-opal.vercel.app](https://fintrack-six-opal.vercel.app)
* ⚡ **Backend API en Producción**: [https://fintrack-ihwb.onrender.com/health](https://fintrack-ihwb.onrender.com/health)
* 🐙 **Repositorio GitHub**: [https://github.com/TonyBrTs/Fintrack](https://github.com/TonyBrTs/Fintrack)

---

## 🏗️ Arquitectura del Sistema

```mermaid
graph TB
    subgraph Client ["Frontend (Next.js 16 / React 19 / PWA)"]
        UI["Dashboard & Vistas Financieras"]
        AuthCtx["Auth Context & Modales"]
        AIClient["Gemini AI Client (/api/ai/insights)"]
    end

    subgraph AuthSecurity ["Autenticación & Identidad"]
        SupabaseAuth["Supabase Auth (JWT + Google OAuth 2.0)"]
    end

    subgraph BackendGo ["Backend API (Golang / Clean Architecture)"]
        Handlers["HTTP Handlers (Gin)"]
        Services["Business Services (Domain Logic)"]
        Repos["Repositories (Contracts & Implementations)"]
    end

    subgraph DataStorage ["Persistencia"]
        GormPostgres["Supabase PostgreSQL (GORM + RLS)"]
        MemoryJSON["JSON Fallback Storage"]
    end

    UI --> AuthCtx
    UI --> AIClient
    UI --> ServicesLayer["Capa de Servicios Frontend"]
    ServicesLayer -->|Bearer Token HTTP| Handlers
    Handlers --> Services
    Services --> Repos
    Repos -->|Producción| GormPostgres
    Repos -.->|Fallback Local| MemoryJSON
    AuthCtx --> SupabaseAuth
    Handlers -->|Verifica JWT| SupabaseAuth
```

---

## 💎 Principios SOLID Implementados

| Principio | Implementación en FinTrack |
| :--- | :--- |
| **S — Single Responsibility** | Separación estricta en 4 capas: Handlers (solo HTTP), Services (solo lógica financiera), Repositories (solo persistencia) y Models (solo estructuras de datos). |
| **O — Open/Closed** | El sistema es extensible a nuevas bases de datos (Redis, MongoDB, DynamoDB) implementando las interfaces de `internal/repository` sin tocar código existente. |
| **L — Liskov Substitution** | `GormExpenseRepository` y `MemoryExpenseRepository` son 100% intercambiables; los servicios operan idénticamente con cualquiera. |
| **I — Interface Segregation** | Interfaces granulares y segregadas (`ExpenseRepository`, `IncomeRepository`, `GoalRepository`, `CategoryRepository`) en lugar de interfaces gigantes. |
| **D — Dependency Inversion** | Los Handlers dependen de interfaces de Services; los Services dependen de interfaces de Repositories. Inyección limpia de dependencias en `main.go`. |

> 📖 Consulta el análisis completo con código y pruebas en [docs/SOLID_PRINCIPLES.md](./docs/SOLID_PRINCIPLES.md).

---

## 🌟 Funcionalidades Principales

* 📊 **Dashboard Financiero en Tiempo Real**: Balance consolidado, ingresos, egresos, tasa de ahorro neta y gráficos analíticos interactivos.
* 🤖 **AI Financial Insights con Google Gemini**: Recomendaciones predictivas sobre hábitos de gasto con sistema de fallback en cascada y caché en memoria.
* 🔐 **Autenticación Integral**:
  * Inicio de sesión con correo y contraseña.
  * **"Continuar con Google"** (Google OAuth 2.0).
  * **"¿Olvidaste tu contraseña?"**: Flujo automatizado de recuperación por correo y restablecimiento seguro.
* 🏷️ **Categorías Personalizadas y Protección de Integridad**:
  * Categorías del sistema + categorías dinámicas por usuario con selector de colores e íconos Lucide.
  * Protección referencial: si una categoría tiene movimientos asociados, la API requiere reasignación antes de permitir eliminarla.
* 🎯 **Gestión de Metas de Ahorro**: Seguimiento de objetivos financieros con aportes en tiempo real y barras de progreso.
* 💱 **Soporte Multimoneda Dinámico**: Dólar estadounidense (**USD**), Euro (**EUR**), Libra esterlina (**GBP**) y Colón costarricense (**CRC**).
* 🌍 **Internacionalización Bilingüe (i18n)**: Soporte completo e instantáneo en **Español** e **Inglés**.
* 📱 **PWA (Progressive Web App)**: Instalable en dispositivos móviles y de escritorio con soporte responsivo.
* 📑 **Auditoría y Exportación Contable**: Generación de estados de cuenta membretados en PDF e informes en Excel (.xlsx) y CSV.

---

## 📚 Documentación Técnica Detallada

Toda la arquitectura, base de datos, APIs y manual de usuario están documentados a profundidad en la carpeta [`docs/`](./docs/):

| Documento | Descripción |
| :--- | :--- |
| 📘 [**docs/MANUAL_DE_USO.md**](./docs/MANUAL_DE_USO.md) | **Manual Oficial de Usuario** con capturas reales de pantalla y guías paso a paso. |
| 🏛️ [**docs/ARCHITECTURE.md**](./docs/ARCHITECTURE.md) | Clean Architecture, C4, flujo de datos, multi-tenancy y motor de IA (Gemini). |
| 💎 [**docs/SOLID_PRINCIPLES.md**](./docs/SOLID_PRINCIPLES.md) | Detalle exhaustivo de los 5 principios SOLID en Go y TypeScript/React con ejemplos. |
| 📜 [**docs/decisions/**](./docs/decisions/) | Registros de Decisiones de Arquitectura (ADRs de 001 a 005). |
| 📡 [**docs/API_REFERENCE.md**](./docs/API_REFERENCE.md) | Catálogo completo de endpoints REST, headers de autorización, payloads y códigos de error. |
| 🗄️ [**docs/DATABASE.md**](./docs/DATABASE.md) | Diagrama ERD, esquemas SQL de PostgreSQL, tipos de datos, índices y políticas RLS. |
| 🔐 [**docs/AUTH_AND_SECURITY.md**](./docs/AUTH_AND_SECURITY.md) | Flujos de OAuth 2.0, validación de JWT Bearer en Go, recuperación de contraseñas y CORS. |
| 🚀 [**docs/DEPLOYMENT.md**](./docs/DEPLOYMENT.md) | Guía de despliegue paso a paso en Vercel, Render y Supabase con matriz de variables. |

---

## ⚡ Inicio Rápido en Local

### Requisitos Previos:
- [Node.js](https://nodejs.org/) v20 o superior
- [Go](https://go.dev/) v1.22 o superior

### 1. Clonar el repositorio
```bash
git clone https://github.com/TonyBrTs/Fintrack.git
cd Fintrack
```

### 2. Ejecutar el Backend en Go
```bash
cd backend
go run main.go
```
*El servidor arrancará en `http://localhost:8080` (utilizará almacenamiento local JSON si no detecta PostgreSQL).*

### 3. Ejecutar el Frontend en Next.js
En otra terminal:
```bash
cd frontend
npm install
npm run dev
```
*Abre [http://localhost:3000](http://localhost:3000) en tu navegador.*

### 4. Ejecutar Pruebas Unitarias del Backend
```bash
cd backend
go test -v ./internal/services/...
```

---

## 📁 Estructura del Repositorio

```
Fintrack/
├── backend/                        # Backend REST API en Golang
│   ├── internal/
│   │   ├── database/               # Conexión PostgreSQL (GORM) y AutoMigrate
│   │   ├── handlers/               # Controladores HTTP (Gin Framework)
│   │   ├── middleware/             # Auth JWT Supabase y CORS
│   │   ├── models/                 # Entidades del dominio
│   │   ├── repository/             # Interfaces abstractas de persistencia
│   │   │   ├── gorm_repo/          # Implementación PostgreSQL / GORM
│   │   │   └── memory_repo/        # Implementación Local / Fallback JSON
│   │   └── services/               # Lógica de negocio, Scheduler y pruebas unitarias
│   │       ├── interfaces.go       # Contratos centralizados de servicios
│   │       ├── scheduler.go        # Background RecurringScheduler worker
│   │       └── ...
│   ├── main.go                     # Bootstrap e Inyección de Dependencias
│   └── go.mod
│
├── frontend/                       # Frontend Next.js 16 (React 19)
│   ├── public/                     # PWA manifest, iconos y Service Worker
│   └── src/
│       ├── app/                    # Next.js App Router (Rutas y AI API)
│       ├── components/             # Componentes UI organizados por dominio
│       ├── contexts/               # Contextos globales (Auth, Currency, Language)
│       ├── hooks/                  # Custom React Hooks
│       ├── services/               # Capa de Servicios desacoplada (SRP / DIP)
│       │   ├── expenseService.ts   # CRUD y sincronización de gastos
│       │   ├── incomeService.ts    # CRUD y sincronización de ingresos
│       │   ├── goalService.ts      # Metas y aportes
│       │   ├── categoryService.ts  # Categorías y reasignación
│       │   ├── recurringService.ts # Programaciones y ejecuciones
│       │   └── index.ts            # Barrel file unificado
│       ├── lib/                    # Clientes API, Supabase, Excel e i18n
│       └── types/                  # Tipado TypeScript compartido
│
├── docs/                           # Documentación Técnica Integral y Manual
│   ├── decisions/                  # Architecture Decision Records (ADR 001 - 005)
│   ├── img/                        # Capturas de pantalla reales del sistema
│   ├── MANUAL_DE_USO.md            # Manual de usuario final
│   ├── ARCHITECTURE.md             # Arquitectura, Clean Architecture y Google Gemini
│   ├── SOLID_PRINCIPLES.md         # Detalle de principios SOLID
│   ├── API_REFERENCE.md            # Catálogo de endpoints REST
│   ├── DATABASE.md                 # Modelo de datos ERD y RLS
│   ├── AUTH_AND_SECURITY.md        # Autenticación, JWT y seguridad
│   └── DEPLOYMENT.md               # Guía DevOps de despliegue
│
└── README.md                       # Documentación principal del proyecto
```

---

## 👨‍💻 Autor

Desarrollado por **TonyBrTs**  
*Repositorio oficial*: [https://github.com/TonyBrTs/Fintrack](https://github.com/TonyBrTs/Fintrack)
