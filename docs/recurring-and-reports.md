# Gastos e Ingresos Recurrentes — Arquitectura y Reglas

## Visión General

Los gastos e ingresos recurrentes permiten programar cobros/pagos automáticos que se registran según una frecuencia configurada. El backend Go es el único responsable de toda lógica de recurrencia y persistencia. El frontend sólo llama la API REST.

---

## Frecuencias soportadas

| Valor `frequency` | Descripción |
|---|---|
| `biweekly` | Quincenal — día 15 y último día del mes (o cada 15 días) |
| `monthly` | Mensual — día exacto del mes configurado en `billing_day` |
| `weekly` | Semanal — cada 7 días |
| `yearly` | Anual — mismo día del mismo mes |

---

## Flujo de Ejecución Automática (Scheduler)

El servidor ejecuta `ProcessAllDueExpenses` y `ProcessAllDueIncomes` periódicamente. Para cada ítem activo cuya `next_due_date <= hoy`, se:
1. Crea un registro con la descripción prefijada `[Recurrente] <descripción>`.
2. Actualiza `last_executed_at = now()`.
3. Avanza `next_due_date` con `CalculateNextDueDate()`.

---

## Ejecución Manual Adelantada (ExecuteNow)

**Reglas:**
1. Si `last_executed_at` cae dentro del ciclo actual ? error HTTP 400 con mensaje claro.
2. La transacción generada lleva el prefijo `[Recurrente]` en la descripción.
3. Se avanza `next_due_date` normalmente.

---

## Prefijo de Transacciones

Toda transacción creada por recurrencia lleva el prefijo `[Recurrente] ` en la descripción. Es idempotente — no duplica el prefijo.

---

## Selector de Día de Cobro Mensual

Pills rápidos (1, 5, 10, 15, 20, 25, Último día) + input numérico + preview de los próximos 3 cobros.

---

## Reportes

- Botón PDF removido — solo Excel (.xlsx) y CSV.
- Link "Volver al Resumen" removido.
