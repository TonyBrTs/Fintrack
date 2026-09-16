# ADR-005: Aislamiento del Scheduler Recurrente en el Backend (Go)

## Estado
**Aceptado**

## Fecha
2026-09-15

## Contexto
El servidor backend debe procesar periódicamente las transacciones recurrentes (gastos e ingresos automáticos por quincena, mes o año) cuya fecha de cobro haya vencido.
Anteriormente, esta lógica corría en una goroutine anónima con un `time.Ticker` inline colocada directamente en medio de la función `main()` de `backend/main.go`. Esto mezclaba la configuración de arranque de la aplicación HTTP con la ejecución en segundo plano y el control de ciclo de vida de tareas programadas (violando SRP).

## Decisión
1. Definir la interfaz abstracta `Scheduler` en `internal/services/interfaces.go`:
   ```go
   type Scheduler interface {
       Start(ctx context.Context)
       Stop()
   }
   ```
2. Implementar el struct desacoplado `RecurringScheduler` en `internal/services/scheduler.go`:
   - Recibe `RecurringExpenseService` y `RecurringIncomeService` por Inyección de Dependencias.
   - Maneja su propio ticker de intervalo, canal de parada (`stopChan`) y contexto (`ctx.Done()`).
   - Procesa los ciclos de evaluación de forma aislada y no bloqueante.
3. En `main.go`, simplemente se instancia y arranca:
   ```go
   scheduler := services.NewRecurringScheduler(recurringService, recurringIncomeService, 1*time.Hour)
   scheduler.Start(context.Background())
   ```

## Consecuencias
### Positivas
- `main.go` recupera su responsabilidad única: bootstrapping, inyección de dependencias e inicio del servidor web.
- El scheduler es completamente testeable de forma unitaria o configurable con diferentes intervalos de sondeo según el entorno (e.g. 5 minutos en pruebas, 1 hora en producción).
- Soporte para apagado elegante (*graceful shutdown*) llamando a `scheduler.Stop()`.
