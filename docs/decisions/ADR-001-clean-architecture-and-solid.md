# ADR-001: Adopción de Clean Architecture y Principios SOLID en FinTrack

## Estado
**Aceptado**

## Fecha
2026-09-15

## Contexto
En las primeras iteraciones de FinTrack, el backend en Go se implementó de forma monolítica en `main.go`. Todas las operaciones —manejo de peticiones HTTP con Gin, consultas directas con GORM, validaciones de negocio, persistencia en archivos JSON y concurrencia— se encontraban acopladas en un único archivo de cerca de 1,000 líneas.
En el frontend, los componentes visuales realizaban llamadas directas a `fetch`, construían URLs y parseaban payloads manualmente, violando la separación de responsabilidades y dificultando la extensibilidad y testeo automatizado.

## Decisión
1. **Backend (Go)**:
   - Dividir el código en 4 capas estrictas con **Inversión de Dependencias (DIP)**:
     - `internal/models`: Entidades del dominio y estructuras de datos.
     - `internal/repository`: Contratos abstractos de persistencia (`interfaces.go`) e implementaciones desacopladas (`gorm_repo` y `memory_repo`).
     - `internal/services`: Lógica financiera, validaciones y reglas de negocio puras, aisladas de HTTP.
     - `internal/handlers`: Controladores Gin encargados únicamente de transporte HTTP (deserialización, claims, serialización JSON).
     - `internal/middleware`: Filtros transversales de seguridad (CORS, JWT).
2. **Frontend (Next.js / React)**:
   - Implementar una **Capa de Servicios dedicada (`src/services/`)** que encapsule todas las peticiones a la API REST, dejando a los componentes y hooks enfocados únicamente en la experiencia de usuario y estado visual.

## Consecuencias
### Positivas
- **Mantenibilidad**: Modificar la estructura de la base de datos o el motor de persistencia no afecta a los servicios ni a los controladores.
- **Testabilidad**: Pruebas unitarias de servicios (`*_service_test.go`) ejecutables en milisegundos inyectando repositorios mock en memoria sin necesidad de levantar bases de datos reales.
- **Extensibilidad**: Se pueden agregar nuevos adaptadores (Redis, DynamoDB, MongoDB) simplemente implementando las interfaces existentes (Principio de Abierto/Cerrado).

### Negativas / Mitigaciones
- Mayor cantidad de archivos y paquetes en el proyecto. Se mitiga mediante convenciones claras de nombres y documentación arquitectónica centralizada en `docs/`.
