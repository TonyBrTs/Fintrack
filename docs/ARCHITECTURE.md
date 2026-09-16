# 🏛️ Arquitectura del Sistema - FinTrack

FinTrack es una plataforma de finanzas personales diseñada con **Clean Architecture** en el backend en **Go** y **Component-Driven & Service Layer Architecture** en el frontend en **Next.js 16**, garantizando alto rendimiento, desacoplamiento modular, mantenibilidad y escalabilidad.

---

## 📐 1. Vista de Alto Nivel (C4 - Diagrama de Contenedores)

```mermaid
graph TB
    User[👤 Usuario Final]

    subgraph ClientLayer ["Capas de Cliente (Frontend Next.js 16)"]
        WebPWA["📱 Next.js 16 Web & PWA<br/>(React 19, Tailwind CSS v4)"]
        ServicesLayer["🔌 Frontend Services Layer<br/>(expense, income, goal, category, recurring)"]
    end

    subgraph EdgeLayer ["Servicios Cloud & Gateway"]
        VercelCDN["☁️ Vercel Edge Network<br/>(Hosting Frontend & Next.js Serverless)"]
        GeminiAPI["🤖 Google Gemini 2.0/1.5 Flash<br/>(Motor de IA Financiera)"]
    end

    subgraph BackendLayer ["Backend API (Golang / Clean Architecture)"]
        GinAPI["⚡ Gin HTTP REST API (Go 1.23)<br/>(Clean Architecture & SOLID)"]
        AuthMiddleware["🛡️ Supabase JWT Middleware"]
        Scheduler["⏰ RecurringScheduler Worker<br/>(Procesamiento periódico de recurrencias)"]
    end

    subgraph DataLayer ["Persistencia & Autenticación"]
        SupabaseAuth["🔐 Supabase Auth (OAuth 2.0 & Email)"]
        PostgresDB["🐘 Supabase PostgreSQL (GORM)<br/>(Row Level Security & Multi-tenancy)"]
        LocalJSON["💾 Fallback JSON Storage (Local)"]
    end

    User -->|HTTPS| WebPWA
    WebPWA --> ServicesLayer
    WebPWA -->|Edge SSR / Static| VercelCDN
    WebPWA -->|Análisis de Insights| GeminiAPI
    WebPWA -->|OAuth 2.0 / Login| SupabaseAuth
    ServicesLayer -->|Bearer JWT Requests| GinAPI
    GinAPI --> AuthMiddleware
    AuthMiddleware -->|Valida Token| SupabaseAuth
    GinAPI -->|GORM SQL Queries| PostgresDB
    GinAPI -.->|Fallback si no hay BD| LocalJSON
    Scheduler -->|Procesa vencimientos| PostgresDB
```

---

## 🧱 2. Backend Clean Architecture (Go)

El backend de FinTrack implementa el patrón de **Arquitectura Limpia (Clean Architecture)** dividido en capas concéntricas con **Inversión de Dependencias (DIP)**:

```
[ HTTP Request ]
       │
       ▼
┌────────────────────────────────────────────────────────┐
│  1. Handlers Layer (internal/handlers)                 │
│  - Deserialización de JSON y enlace de DTOs            │
│  - Extracción de Claims de contexto (userID)           │
│  - Retorno de Códigos de Estado HTTP y respuestas JSON │
└──────────────────────────┬─────────────────────────────┘
                           │ (Llama a interfaces de Servicio)
                           ▼
┌────────────────────────────────────────────────────────┐
│  2. Services Layer (internal/services)                 │
│  - Lógica de Dominio y Reglas Financieras              │
│  - Validaciones de negocio (montos, categorías)        │
│  - Orquestación de transacciones y recurrencias        │
│  - RecurringScheduler (Background Worker)              │
│  - Aislamiento total de infraestructura HTTP           │
└──────────────────────────┬─────────────────────────────┘
                           │ (Llama a interfaces de Repositorio)
                           ▼
┌────────────────────────────────────────────────────────┐
│  3. Repositories Layer (internal/repository)           │
│  - Interfaces abstractas / Contratos segregados        │
│  - Implementación GORM (PostgreSQL en Producción)      │
│  - Implementación Memory/JSON (Desarrollo / Offline)   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│  4. Domain Models (internal/models)                    │
│  - Structs de datos: Expense, Income, Goal, Category   │
│  - Structs de Recurrencia: RecurringExpense, Income    │
│  - Tags de base de datos (GORM) y serialización (JSON) │
└────────────────────────────────────────────────────────┘
```

### Estructura de Paquetes en `backend/`:
```
backend/
├── internal/
│   ├── database/               # Conexión PostgreSQL (GORM) y AutoMigrate
│   ├── handlers/               # Controladores HTTP (Gin Framework)
│   ├── middleware/             # Autenticación JWT y CORS
│   ├── models/                 # Entidades del dominio
│   ├── repository/             # Interfaces abstractas de persistencia
│   │   ├── gorm_repo/          # Implementación con PostgreSQL
│   │   └── memory_repo/        # Implementación con archivos JSON locales
│   └── services/               # Reglas de negocio puras, tests y Scheduler
│       ├── interfaces.go       # Contratos centralizados de servicios
│       ├── scheduler.go        # RecurringScheduler background worker
│       ├── expense_service.go
│       ├── income_service.go
│       ├── goal_service.go
│       ├── category_service.go
│       ├── recurring_expense_service.go
│       └── recurring_income_service.go
├── main.go                     # Bootstrap e Inyección de Dependencias
└── go.mod
```

---

## 💻 3. Arquitectura del Frontend (Next.js 16 + React 19)

El frontend está estructurado mediante una clara separación de capas para maximizar modularidad, rendimiento web y testabilidad:

```
frontend/src/
├── app/                    # App Router de Next.js
│   ├── api/ai/insights/    # Route handler serverless para Google Gemini
│   ├── expenses/           # Página de gestión de egresos
│   ├── incomes/            # Página de gestión de ingresos
│   ├── goals/              # Página de metas de ahorro
│   ├── reports/            # Generación y exportación de reportes Excel/CSV
│   ├── layout.tsx          # Shell principal con Providers
│   └── page.tsx            # Dashboard principal con métricas en tiempo real
├── components/             # Jerarquía de Componentes UI
│   ├── auth/               # AuthModal, Google OAuth button, Forgot Password
│   ├── categories/         # Modales y selectores de categorías dinámicas
│   ├── expenses/           # Formulario, detalles y gestores de egresos
│   ├── incomes/            # Formulario, detalles y gestores de ingresos
│   ├── goals/              # Tarjetas de progreso y aportes a metas
│   ├── layout/             # Header, BottomNavbar, SettingsDrawer
│   └── ui/                 # Primitivas accesibles basadas en Radix UI
├── contexts/               # Estado Global React (Auth, Currency, Language, Audio)
├── hooks/                  # Custom Hooks (useCategories, useSoundEffects)
├── services/               # Capa de Servicios desacoplada (SRP / DIP)
│   ├── expenseService.ts   # Operaciones de gastos
│   ├── incomeService.ts    # Operaciones de ingresos
│   ├── goalService.ts       # Operaciones de metas
│   ├── categoryService.ts  # Operaciones de categorías
│   ├── recurringService.ts # Operaciones de recurrencias
│   └── index.ts            # Barrel file unificado
├── lib/                    # Clientes de API, Supabase, Excel y utilitarios
└── types/                  # Definiciones de tipos TypeScript compartidas
```

---

## 🔁 4. Flujo de Transacciones Recurrentes

```mermaid
sequenceDiagram
    autonumber
    actor Usuario
    participant Frontend as Frontend (Next.js)
    participant API as Backend (Gin API)
    participant Scheduler as RecurringScheduler
    participant DB as PostgreSQL

    Note over Scheduler, DB: Bucle Periódico en Segundo Plano (cada hora)
    Scheduler->>DB: ProcessAllDueExpenses / Incomes (next_due_date <= hoy)
    DB-->>Scheduler: Crea gastos/ingresos con prefijo "[Recurrente]"
    DB-->>Scheduler: Actualiza last_executed_at y avanza next_due_date

    Note over Usuario, Frontend: Sincronización Automática al Entrar
    Usuario->>Frontend: Abre /expenses o /incomes
    Frontend->>API: POST /api/recurring-expenses/sync?client_date=YYYY-MM-DD
    API->>DB: Procesa transacciones pendientes del ciclo
    API-->>Frontend: { processed_count: N, expenses: [...] }
    Frontend-->>Usuario: Toast notificando registros generados
```

---

## 🔒 5. Aislamiento Multi-Inquilino (Multi-Tenancy)

La seguridad de datos por usuario se garantiza en **todas las capas**:

1. **Cliente**: El frontend incluye el token Bearer emitido por Supabase en el encabezado `Authorization: Bearer <JWT>`.
2. **Middleware**: `backend/internal/middleware/auth.go` decodifica y verifica la firma del JWT, extrayendo el `userID` (UUID criptográfico) y guardándolo en el contexto de Gin.
3. **Servicio y Repositorio**: Cada consulta a la base de datos incluye obligatoriamente la cláusula de particionamiento:
   ```sql
   WHERE user_id = ?
   ```
4. **Base de Datos**: PostgreSQL cuenta con políticas **RLS (Row Level Security)** que impiden que cualquier usuario lea o modifique filas de otro usuario, incluso ante errores de código en capas superiores.

---

## 📜 6. Registro de Decisiones de Arquitectura (ADRs)

Las decisiones de diseño arquitectónico se documentan formalmente bajo el estándar ADR en [`docs/decisions/`](./decisions/):

| ADR | Título | Estado |
| :--- | :--- | :--- |
| [**ADR-001**](./decisions/ADR-001-clean-architecture-and-solid.md) | Adopción de Clean Architecture y Principios SOLID | Aceptado |
| [**ADR-002**](./decisions/ADR-002-dual-storage-gorm-and-memory.md) | Persistencia Híbrida Intercambiable (GORM PostgreSQL y JSON) | Aceptado |
| [**ADR-003**](./decisions/ADR-003-supabase-auth-and-multi-tenancy.md) | Autenticación con Supabase Auth y Seguridad Multi-Inquilino | Aceptado |
| [**ADR-004**](./decisions/ADR-004-frontend-service-layer-and-srp.md) | Capa de Servicios en el Frontend y Principio de Responsabilidad Única | Aceptado |
| [**ADR-005**](./decisions/ADR-005-recurring-scheduler-isolation.md) | Aislamiento del Scheduler Recurrente en el Backend (Go) | Aceptado |
