# ADR-002: Persistencia Híbrida Intercambiable (GORM PostgreSQL y Fallback JSON en Memoria)

## Estado
**Aceptado**

## Fecha
2026-09-15

## Contexto
FinTrack se despliega en entornos de nube (Render / Supabase PostgreSQL) para usuarios finales, pero requiere operar sin fricción en entornos de desarrollo local, pruebas sin conexión a internet o entornos de CI/CD efímeros donde no hay un servidor PostgreSQL activo.

## Decisión
Implementar el **Principio de Sustitución de Liskov (LSP)** en la capa de persistencia mediante dos implementaciones completas e intercambiables de cada contrato de repositorio:
1. **`gorm_repo`**:
   - Utiliza GORM con dialecto PostgreSQL.
   - Ejecuta `AutoMigrate` al arrancar.
   - Ideal para producción multi-inquilino con índices y transacciones ACID.
2. **`memory_repo`**:
   - Mantiene los datos en slices protegidos por `sync.RWMutex` para concurrencia segura.
   - Persiste asíncronamente en archivos JSON locales (`expenses.json`, `incomes.json`, etc.).
   - Se activa automáticamente como fallback si `DATABASE_URL` no está definida o la conexión falla.

## Consecuencias
### Positivas
- Cualquier desarrollador puede clonar el repositorio y ejecutar `go run main.go` de inmediato sin instalar PostgreSQL.
- Los servicios de negocio consumen `repository.ExpenseRepository`, `repository.IncomeRepository`, etc., sin saber qué motor subyacente está activo.
- Cero interrupciones de servicio si hay fallas temporales de red hacia la base de datos externa en entornos locales.

### Negativas / Mitigaciones
- `memory_repo` no soporta consultas relacionales complejas de manera óptima a gran escala; está diseñado específicamente para desarrollo local, pruebas y modo offline.
