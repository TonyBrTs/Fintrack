# ADR-004: Capa de Servicios en el Frontend y Principio de Responsabilidad Única (SRP)

## Estado
**Aceptado**

## Fecha
2026-09-15

## Contexto
En la interfaz de usuario en Next.js, las páginas (`expenses/page.tsx`, `incomes/page.tsx`, `goals/page.tsx`) y los modales ejecutaban directamente llamadas `safeFetch("/api/...")`, construían cadenas de consulta manuales (`?client_date=...`, `?reassignTo=...`) y parseaban respuestas JSON.
Esto causaba:
- Duplicación de lógica de transporte de red en múltiples componentes.
- Dificultad para actualizar rutas de la API (cambiar una ruta requería editar 4 o 5 archivos UI).
- Violación de SRP: los componentes de React tenían dos motivos para cambiar (cambio visual/UI y cambio en el contrato del backend).

## Decisión
Crear una **Capa de Servicios dedicada en `frontend/src/services/`**:
- `expenseService.ts`: CRUD de gastos y sincronización periódica.
- `incomeService.ts`: CRUD de ingresos y sincronización periódica.
- `goalService.ts`: CRUD de metas y aportes de ahorro.
- `categoryService.ts`: Gestión de categorías y reasignación de transacciones.
- `recurringService.ts`: Gestión de programaciones recurrentes y ejecuciones manuales (`executeNow`).
- `index.ts`: Punto de exportación centralizado.

Los componentes visuales y custom hooks solo interactúan con estas abstracciones tipadas.

## Consecuencias
### Positivas
- **Alta Cohesión y Bajo Acoplamiento**: Los componentes UI se enfocan 100% en la renderización, accesibilidad y experiencia de usuario.
- **Tipado Fuerte**: Errores de parámetros o nombres de campos se detectan inmediatamente en tiempo de compilación con TypeScript (`npx tsc --noEmit`).
- **Mantenibilidad Centralizada**: Si un endpoint cambia, solo se actualiza una función dentro de `src/services/`.
