# 📘 FinTrack: Arquitectura, Funcionamiento y Requisitos

Este documento detalla la arquitectura completa de **FinTrack**, las tecnologías y librerías utilizadas, el flujo de autenticación y persistencia de datos en la nube, el esquema de la base de datos y los requisitos de configuración para su ejecución en desarrollo y producción.

---

## 🏗️ 1. Visión General y Arquitectura

FinTrack es una plataforma moderna para la gestión financiera personal con arquitectura desacoplada (**Frontend en Next.js** + **Backend RESTful en Go** + **Base de Datos y Autenticación en Supabase**).

```mermaid
graph TD
    subgraph Cliente ["💻 / 📱 Cliente (Navegador)"]
        UI["Interfaz FinTrack (React 19 / Next.js 16)"]
        AuthCtx["AuthContext & supabaseClient"]
        APIClient["lib/api.ts (Inyector de Bearer Token)"]
    end

    subgraph Supabase ["☁️ Supabase Cloud"]
        AuthService["🔐 Supabase Auth (GoTrue)"]
        AuthUsers[("Tabla auth.users")]
        Postgres[("🗄️ PostgreSQL 17 (expenses, incomes, goals)")]
    end

    subgraph Backend ["⚡ Backend API (Go 1.23 + Gin)"]
        Router["Gin Router (CORS & Endpoints)"]
        AuthMW["AuthMiddleware (Validador JWT)"]
        DBLayer["GORM Database Layer (Filtro por user_id)"]
        LocalJSON["📁 Archivos .json (Modo Contingencia Offline)"]
    end

    UI --> AuthCtx
    AuthCtx -->|Registro / Login HTTPS| AuthService
    AuthService --> AuthUsers
    AuthService -.->|Emite Access Token JWT| AuthCtx

    UI --> APIClient
    APIClient -->|Headers: Authorization Bearer JWT| Router
    Router --> AuthMW
    AuthMW -->|1. Valida firma/expiración\n2. Extrae user_id| DBLayer
    
    DBLayer -->|DATABASE_URL configurada| Postgres
    DBLayer -.->|DATABASE_URL vacía| LocalJSON
```

---

## 🛠️ 2. Tecnologías y Librerías Utilizadas

### Frontend (Web / PWA)
- **[Next.js 16](https://nextjs.org/)** con **React 19**: Framework full-stack para renderizado híbrido y rutas de cliente ultra-rápidas.
- **[Tailwind CSS v4](https://tailwindcss.com/)**: Motor de estilos utility-first con variables CSS nativas.
- **[@supabase/supabase-js](https://supabase.com/docs/reference/javascript/installing)**: SDK oficial de Supabase para autenticación y persistencia de tokens en el navegador.
- **[Framer Motion](https://www.framer.com/motion/)**: Animaciones fluidas, transiciones de modales y pestañas animadas.
- **[Radix UI](https://www.radix-ui.com/)**: Primitivas de interfaz accesibles (`Dialog`, `DropdownMenu`, `Select`, `Avatar`).
- **[Sonner](https://sonner.emilkowal.ski/)**: Sistema de notificaciones *Toast* con animaciones y soporte para temas.
- **[Lucide React](https://lucide.dev/)**: Colección de íconos vectoriales modernos.

### Backend (API RESTful)
- **[Go 1.23+](https://go.dev/)**: Lenguaje compilado concurrente y de alto rendimiento.
- **[Gin Web Framework](https://gin-gonic.com/)**: Enrutador HTTP ultra-rápido para microservicios y APIs REST.
- **[GORM](https://gorm.io/)**: ORM idiomático para Go con soporte para transacciones y consultas parametrizadas.
- **[gorm.io/driver/postgres](https://github.com/go-gorm/postgres)**: Driver optimizado para PostgreSQL mediante `pgx/v5`.
- **[golang-jwt/jwt/v5](https://github.com/golang-jwt/jwt)**: Validación criptográfica de tokens JWT estándar HMAC/RSA.
- **[godotenv](https://github.com/joho/godotenv)**: Carga automática de variables de entorno desde el archivo `.env`.

### Base de Datos y Seguridad (Cloud)
- **[Supabase PostgreSQL 17](https://supabase.com/)**: Motor de base de datos relacional administrado en la nube.
- **Supabase Auth**: Servicio de autenticación con hashing de contraseñas de alta seguridad (bcrypt/argon2) y emisión de JWTs.
- **Row-Level Security (RLS)**: Políticas de seguridad a nivel de motor de base de datos que aíslan los datos de cada usuario.

---

## 🔄 3. Flujo de Funcionamiento Paso a Paso

### A. Registro e Inicio de Sesión
1. El usuario completa el formulario en el modal de autenticación (`AuthModal.tsx`).
2. El cliente de Supabase (`supabase.auth.signUp` o `signInWithPassword`) envía las credenciales encriptadas vía HTTPS a **Supabase Auth**.
3. Supabase valida o crea el usuario en `auth.users`, genera un par de tokens (**Access Token JWT** y **Refresh Token**) y lo devuelve al navegador.
4. `AuthContext.tsx` captura la sesión y la persiste automáticamente en el almacenamiento local del navegador (`localStorage`).

### B. Ejecución de Consultas Financieras (Gastos, Ingresos, Metas)
1. Cada vez que el frontend realiza una petición (por ejemplo `GET /api/expenses` o `POST /api/expenses`), el archivo `src/lib/api.ts` inyecta automáticamente el encabezado:
   ```http
   Authorization: Bearer <access_token_jwt>
   ```
2. La petición llega al backend en Go. El middleware **`AuthMiddleware`**:
   - Extrae el token del encabezado `Authorization`.
   - Verifica su firma y vigencia (utilizando caché en memoria con TTL para responder en microsegundos sin sobrecargar la red).
   - Extrae el identificador único del usuario (`claims.Subject` / UUID de Supabase).
   - Inyecta `c.Set("userID", uuid)` en el contexto de la petición.
3. El controlador de Go ejecuta la consulta en PostgreSQL con **doble barrera de seguridad**:
   - **Barrera 1 (Backend)**: Toda consulta incluye obligatoriamente `WHERE user_id = ?`.
   - **Barrera 2 (Base de Datos)**: Las políticas de RLS comprueban que el registro coincida con `auth.uid()`.
4. Si la base de datos no está configurada (`DATABASE_URL` ausente), el backend activa el **Modo Contingencia**: guarda temporalmente la transacción en archivos JSON locales (`expenses.json`), pero conservando el `user_id` para no perder la pertenencia de los datos.

---

## 🗄️ 4. Esquema de Base de Datos y Políticas de Seguridad

### Tablas Creadas

#### 1. `public.expenses` (Gastos)
| Campo | Tipo | Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `TEXT` | `PRIMARY KEY` | Identificador único de la transacción |
| `user_id` | `UUID` | `NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE` | Llave foránea del usuario propietario |
| `amount` | `NUMERIC(12,2)` | `NOT NULL` | Monto del gasto |
| `currency` | `VARCHAR(10)` | `DEFAULT 'USD'` | Divisa (USD, EUR, GBP, CRC) |
| `description`| `TEXT` | `NOT NULL` | Concepto del gasto |
| `category` | `VARCHAR(100)` | `NOT NULL` | Categoría (Alimentación, Transporte, etc.) |
| `date` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Fecha y hora de la transacción |
| `payment_method` | `VARCHAR(100)` | `NOT NULL` | Método de pago (Efectivo, Débito, etc.) |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Fecha de creación del registro |

#### 2. `public.incomes` (Ingresos)
Campos idénticos adaptados con columna `source` (Salario, Freelance, Inversiones, etc.).

#### 3. `public.goals` (Metas de Ahorro)
Campos: `id`, `user_id`, `name`, `target_amount`, `current_amount`, `deadline`, `category`, `created_at`.

#### 4. `public.categories` (Categorías Personalizadas)
| Campo | Tipo | Restricción | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(100)` | `PRIMARY KEY` | Identificador único de la categoría |
| `user_id` | `UUID` | `NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE` | Llave foránea del usuario propietario |
| `name` | `VARCHAR(100)` | `NOT NULL` | Nombre de la categoría (máx. 50 caracteres) |
| `type` | `VARCHAR(20)` | `NOT NULL DEFAULT 'expense'` | Tipo (`expense` o `income`) |
| `color` | `VARCHAR(50)` | `DEFAULT 'blue'` | Color temático distintivo |
| `icon` | `VARCHAR(50)` | `DEFAULT 'tag'` | Identificador del icono visual |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Fecha de creación del registro |

### Índices de Alto Rendimiento
- `idx_expenses_user_date ON public.expenses(user_id, date DESC)`
- `idx_incomes_user_date ON public.incomes(user_id, date DESC)`
- `idx_goals_user ON public.goals(user_id)`
- `idx_categories_user ON public.categories(user_id, type)`

### Políticas de Row Level Security (RLS)
Cada tabla tiene RLS activado (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`) con 4 políticas:
```sql
CREATE POLICY "Users can only view their own expenses" 
  ON public.expenses FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own expenses" 
  ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own expenses" 
  ON public.expenses FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own expenses" 
  ON public.expenses FOR DELETE USING (auth.uid() = user_id);
```
*(De manera análoga, se aplican las 4 políticas para `public.incomes`, `public.goals` y `public.categories`).*


---

## 📋 5. Requisitos del Entorno

### Requisitos de Software
- **Node.js**: v20.x o superior.
- **npm**: v10.x o superior.
- **Go**: v1.23.x o superior (o entorno WSL Ubuntu en Windows).
- **Git**: Para control de versiones.
- **Cuenta activa en Supabase**: Proyecto creado en [supabase.com](https://supabase.com).

---

## ⚙️ 6. Variables de Entorno Requeridas

### A. Backend (`backend/.env`)
Crea un archivo llamado `.env` dentro de la carpeta `backend/` con los siguientes valores:

```env
# Puerto del servidor Go (8080 en local, asignado dinámicamente en Render)
PORT=8080

# URL de origen permitida para CORS
FRONTEND_URL=http://localhost:3000

# Cadena de conexión directa a PostgreSQL en Supabase
# Reemplaza [TU_PASSWORD] por la contraseña de tu base de datos en Supabase:
DATABASE_URL=postgresql://postgres:[TU_PASSWORD]@db.tjloylnetfaefuoyfwxy.supabase.co:5432/postgres?sslmode=require

# Configuración de Supabase Auth
SUPABASE_URL=https://tjloylnetfaefuoyfwxy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqbG95bG5ldGZhZWZ1b3lmd3h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMjgyNDEsImV4cCI6MjEwNDgwNDI0MX0.m37ei41UitZJ5J7EMrokNQnFy4sezNkqEkGuj1Mu_Ho

# Opcional (para validación instantánea sin llamadas HTTP):
# SUPABASE_JWT_SECRET=tu_jwt_secret
```

### B. Frontend (`frontend/.env.local`)
Crea o edita `.env.local` en la carpeta `frontend/`:

```env
# URL de la API del Backend en Go
NEXT_PUBLIC_API_URL=http://localhost:8080

# Credenciales de Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tjloylnetfaefuoyfwxy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqbG95bG5ldGZhZWZ1b3lmd3h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMjgyNDEsImV4cCI6MjEwNDgwNDI0MX0.m37ei41UitZJ5J7EMrokNQnFy4sezNkqEkGuj1Mu_Ho
```

---

## 🚀 7. Instrucciones de Ejecución Local

### Paso 1: Iniciar el Backend
En tu terminal (WSL o PowerShell):
```bash
cd backend
go run main.go
```
*Si `DATABASE_URL` está configurada correctamente, verás:*
```text
[Database] Successfully connected to Supabase PostgreSQL!
Server starting on port 8080...
```

### Paso 2: Iniciar el Frontend
En otra ventana de terminal:
```bash
cd frontend
npm run dev
```
Abre tu navegador en [http://localhost:3000](http://localhost:3000).

---

## 📊 8. Dónde Visualizar los Datos Almacenados en la Nube

1. **Usuarios Registrados**:
   - URL: [https://supabase.com/dashboard/project/tjloylnetfaefuoyfwxy/auth/users](https://supabase.com/dashboard/project/tjloylnetfaefuoyfwxy/auth/users)
   - Permite ver correos, proveedores de login, fechas de registro y desactivar accesos.

2. **Tablas de Finanzas (Table Editor)**:
   - URL: [https://supabase.com/dashboard/project/tjloylnetfaefuoyfwxy/editor](https://supabase.com/dashboard/project/tjloylnetfaefuoyfwxy/editor)
   - Visualizador en tiempo real de `expenses`, `incomes` y `goals` con opciones de ordenamiento, filtrado y exportación a CSV.

3. **Editor de Consultas SQL (SQL Editor)**:
   - URL: [https://supabase.com/dashboard/project/tjloylnetfaefuoyfwxy/sql](https://supabase.com/dashboard/project/tjloylnetfaefuoyfwxy/sql)
   - Permite ejecutar consultas directas como:
     ```sql
     SELECT * FROM public.expenses ORDER BY date DESC;
     ```
