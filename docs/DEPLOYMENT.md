# 🚀 Guía de Despliegue y DevOps — FinTrack

FinTrack está preparado para un despliegue continuo y eficiente en infraestructura moderna en la nube utilizando **Vercel** (Frontend), **Render** (Backend en Go) y **Supabase** (PostgreSQL y Auth).

---

## ☁️ 1. Despliegue del Backend en Render

### Paso a paso:
1. Crea un nuevo **Web Service** en [Render Dashboard](https://dashboard.render.com/).
2. Conecta tu repositorio de GitHub `TonyBrTs/Fintrack`.
3. Configura los parámetros del servicio:
   * **Root Directory**: `backend`
   * **Runtime**: `Go`
   * **Build Command**: `go build -o fintrack-backend .`
   * **Start Command**: `./fintrack-backend`
4. Agrega las **Variables de Entorno** en Render:
   * `PORT`: `8080` (o el asignado por Render)
   * `FRONTEND_URL`: `https://fintrack-six-opal.vercel.app`
   * `DATABASE_URL`: Tu Connection String de Supabase PostgreSQL (`postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres?sslmode=require`)
   * `SUPABASE_JWT_SECRET`: Tu JWT Secret de Supabase (en Supabase > Project Settings > API > JWT Secret)

---

## ⚡ 2. Despliegue del Frontend en Vercel

### Paso a paso:
1. Conecta tu repositorio de GitHub en [Vercel Dashboard](https://vercel.com/new).
2. Configura los parámetros del proyecto:
   * **Framework Preset**: `Next.js`
   * **Root Directory**: `frontend`
3. Agrega las **Variables de Entorno** en Vercel:
   * `NEXT_PUBLIC_API_URL`: La URL pública de tu backend en Render (ej. `https://fintrack-ihwb.onrender.com`).
   * `NEXT_PUBLIC_SUPABASE_URL`: Tu URL del proyecto Supabase (ej. `https://tjloylnetfaefuoyfwxy.supabase.co`).
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Tu clave anónima pública de Supabase.
   * `GEMINI_API_KEY`: Tu clave de API de Google AI Studio para los insights financieros.
4. Haz clic en **Deploy**. Cada commit a la rama `master` desplegará automáticamente una nueva versión.

---

## 🔐 3. Configuración en Supabase

1. **Tablas e Índices**:
   Ejecuta el script SQL documentado en [`docs/DATABASE.md`](./DATABASE.md) desde el **SQL Editor** de Supabase para crear las tablas con índices y políticas RLS.
2. **URL Configuration (Para Google OAuth y Recuperación de Contraseña)**:
   * Ve a **Authentication > URL Configuration**.
   * **Site URL**: `https://fintrack-six-opal.vercel.app`
   * **Redirect URLs**:
     - `https://fintrack-six-opal.vercel.app/**`
     - `http://localhost:3000/**`
3. **Google OAuth**:
   * En **Authentication > Providers > Google**:
     - Habilitar Google.
     - Pegar el **Client ID** y **Client Secret** obtenidos de Google Cloud Console.

---

## 📋 Matriz de Variables de Entorno

| Variable | Servicio | Entorno | Descripción |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Frontend | Vercel / Local | URL base del backend en Go |
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend | Vercel / Local | URL de la API de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend | Vercel / Local | Clave anónima pública de Supabase |
| `GEMINI_API_KEY` | Frontend | Vercel / Local | Clave de Google AI para análisis inteligente |
| `DATABASE_URL` | Backend | Render / Local | Cadena de conexión PostgreSQL (GORM) |
| `SUPABASE_JWT_SECRET` | Backend | Render / Local | Clave secreta para validar tokens JWT en Go |
| `FRONTEND_URL` | Backend | Render / Local | Origen autorizado para peticiones CORS |
| `PORT` | Backend | Render / Local | Puerto de escucha HTTP de la API (def. 8080) |
