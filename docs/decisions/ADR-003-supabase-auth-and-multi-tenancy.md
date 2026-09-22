# ADR-003: Autenticación con Supabase Auth y Seguridad Multi-Inquilino

## Estado
**Aceptado**

## Fecha
2026-09-15

## Contexto
FinTrack maneja información financiera sensible personal (ingresos, gastos, metas bancarias). Se requiere un sistema de autenticación robusto que soporte:
- Registro e inicio de sesión por email y contraseña.
- Proveedor social **Google OAuth 2.0**.
- Flujo automatizado de recuperación de contraseñas.
- Aislamiento estricto de datos por usuario en todas las capas del sistema.

## Decisión
1. **Identidad & Tokens**:
   - Se utiliza **Supabase Auth** como Identity Provider (IdP).
   - El cliente Next.js obtiene un JWT firmado con estándar Bearer.
2. **Middleware en Go (`internal/middleware/auth.go`)**:
   - Cada petición entrante a las rutas `/api/*` pasa por el middleware de autenticación.
   - El middleware valida la cabecera `Authorization: Bearer <token>` y extrae el identificador criptográfico del usuario (`userID`).
   - El `userID` se inyecta en el contexto de Gin (`c.Set("userID", userID)`).
3. **Aislamiento en Servicios y Repositorios**:
   - Cada consulta de lectura, creación, actualización o eliminación exige como primer parámetro el `userID`.
   - Las consultas SQL aplican siempre el filtro `WHERE user_id = ?`.
   - En PostgreSQL se configuran políticas **Row Level Security (RLS)** como salvaguarda adicional a nivel de base de datos.

## Consecuencias
### Positivas
- Cero fugas de información entre usuarios (aislamiento multi-tenant estricto).
- Soporte nativo para inicio de sesión social y recuperación segura de claves sin mantener lógica criptográfica propietaria de contraseñas.
- Cumplimiento de estándares modernos de seguridad en aplicaciones financieras.
