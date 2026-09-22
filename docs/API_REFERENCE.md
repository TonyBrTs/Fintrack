# 📡 Referencia de la API REST — FinTrack

La API REST de FinTrack proporciona operaciones CRUD completas y seguras para la gestión de finanzas personales, categorización, metas de ahorro y transacciones recurrentes.

---

## 🌐 URLs Base

| Entorno | URL Base | Descripción |
| :--- | :--- | :--- |
| **Producción (Backend Render)** | `https://fintrack-ihwb.onrender.com` | Servicio en la nube desplegado en Render |
| **Local (Desarrollo)** | `http://localhost:8080` | Servidor Go local (`go run main.go`) |
| **Ruta Serverless AI (Next.js)** | `/api/ai/insights` | Ejecutado en Vercel Edge/Serverless |

---

## 🔐 Autenticación

Todas las rutas bajo `/api/*` (excepto `/health`) están protegidas mediante **Supabase Auth**.

### Encabezado Requerido:
```http
Authorization: Bearer <TU_SUPABASE_JWT_ACCESS_TOKEN>
```
*Si no se envía el encabezado o el token está expirado/inválido, la API responderá con `401 Unauthorized`.*

---

## ⚠️ Formato de Respuestas de Error

En caso de error, la API responde con un objeto JSON uniforme:
```json
{
  "error": "Descripción detallada del motivo del fallo"
}
```

---

## 📉 1. Módulo de Gastos (`/api/expenses`)

### `GET /api/expenses`
Obtiene la lista de gastos del usuario autenticado ordenados cronológicamente descendente.

* **Headers**: `Authorization: Bearer <token>`
* **Respuesta Exitosa (`200 OK`)**:
```json
[
  {
    "id": "1741829392182938100",
    "user_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "amount": 45.50,
    "currency": "USD",
    "description": "Supermercado semanal",
    "category": "Alimentación",
    "date": "2026-03-12T14:30:00Z",
    "payment_method": "Tarjeta de Débito",
    "created_at": "2026-03-12T14:30:00Z"
  }
]
```

---

### `POST /api/expenses`
Registra un nuevo gasto para el usuario autenticado.

* **Headers**: `Content-Type: application/json`, `Authorization: Bearer <token>`
* **Cuerpo de la Petición**:
```json
{
  "amount": 89.00,
  "currency": "USD",
  "description": "Cena de negocios",
  "category": "Alimentación",
  "payment_method": "Tarjeta de Crédito",
  "date": "2026-03-12T20:00:00Z"
}
```
* **Respuesta Exitosa (`201 Created`)**: Devuelve el objeto `Expense` creado con su `id` y `user_id` asignados.

---

### `PUT /api/expenses/:id`
Actualiza un gasto existente perteneciente al usuario autenticado.

* **Parámetros de Ruta**: `id` (string) - Identificador del gasto.
* **Cuerpo de la Petición**: Campos actualizados del gasto.
* **Respuesta Exitosa (`200 OK`)**: Objeto actualizado.
* **Respuestas de Error**:
  - `400 Bad Request`: Payload JSON inválido.
  - `404 Not Found`: Gasto no encontrado o no pertenece al usuario.

---

### `DELETE /api/expenses/:id`
Elimina un gasto existente.

* **Parámetros de Ruta**: `id` (string) - Identificador del gasto.
* **Respuesta Exitosa (`204 No Content`)**: Vacío.

---

## 📈 2. Módulo de Ingresos (`/api/incomes`)

### `GET /api/incomes`
Obtiene los ingresos del usuario autenticado ordenados por fecha.

* **Respuesta Exitosa (`200 OK`)**:
```json
[
  {
    "id": "1741829392182938200",
    "user_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "amount": 2500.00,
    "currency": "USD",
    "description": "Pago Quincenal",
    "source": "Salario",
    "date": "2026-03-15T09:00:00Z",
    "payment_method": "Transferencia Bancaria",
    "created_at": "2026-03-15T09:00:00Z"
  }
]
```

### `POST /api/incomes`
Registra un nuevo ingreso (`201 Created`).

### `PUT /api/incomes/:id`
Actualiza un ingreso existente (`200 OK`).

### `DELETE /api/incomes/:id`
Elimina un ingreso (`204 No Content`).

---

## 🎯 3. Módulo de Metas de Ahorro (`/api/goals`)

### `GET /api/goals`
Lista todas las metas de ahorro del usuario con su progreso actual.

* **Respuesta Exitosa (`200 OK`)**:
```json
[
  {
    "id": "1741829392182938300",
    "user_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "name": "Fondo de Emergencia",
    "target_amount": 5000.00,
    "current_amount": 1500.00,
    "deadline": "2026-12-31T00:00:00Z",
    "category": "Ahorro",
    "created_at": "2026-01-01T10:00:00Z"
  }
]
```

### `POST /api/goals`
Crea una nueva meta de ahorro (`201 Created`).

### `PUT /api/goals/:id`
Actualiza el monto acumulado o datos de la meta (`200 OK`).

### `DELETE /api/goals/:id`
Elimina una meta de ahorro (`204 No Content`).

---

## 🏷️ 4. Módulo de Categorías Dinámicas (`/api/categories`)

### `GET /api/categories?type=expense|income`
Obtiene las categorías combinadas: categorías estándar del sistema (`is_default: true`) más las categorías personalizadas del usuario (`is_default: false`).

* **Query Parameters**:
  - `type` (opcional): `"expense"` o `"income"`.
* **Respuesta Exitosa (`200 OK`)**:
```json
[
  {
    "id": "default-exp-1",
    "name": "Alimentación",
    "type": "expense",
    "color": "emerald",
    "icon": "utensils",
    "is_default": true
  },
  {
    "id": "cat-1741829392182938400",
    "user_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "name": "Mascotas",
    "type": "expense",
    "color": "amber",
    "icon": "paw-print",
    "is_default": false
  }
]
```

---

### `POST /api/categories`
Crea una nueva categoría personalizada para el usuario autenticado.

* **Cuerpo de la Petición**:
```json
{
  "name": "Suscripciones",
  "type": "expense",
  "color": "indigo",
  "icon": "film"
}
```
* **Respuesta Exitosa (`201 Created`)**.
* **Respuestas de Error**:
  - `400 Bad Request`: Si el nombre ya existe en las categorías del sistema o entre las creadas por el usuario.

---

### `DELETE /api/categories/:id?reassignTo=...`
Elimina una categoría personalizada con protección de integridad referencial.

* **Parámetros**:
  - `id` (ruta): ID de la categoría.
  - `reassignTo` (query opcional): Nombre de la categoría a la cual transferir los movimientos asociados.
* **Comportamiento Seguro**:
  - Si la categoría tiene gastos o ingresos asociados y NO se envía `reassignTo`, la API responde con **`409 Conflict`**:
    ```json
    {
      "error": "Esta categoría está asociada a 3 transacción(es). Puedes reasignarlas antes de eliminarla.",
      "in_use": true,
      "count": 3,
      "category_name": "Suscripciones",
      "category_type": "expense"
    }
    ```
  - Si se proporciona `reassignTo`, todas las transacciones vinculadas se actualizan a la nueva categoría antes de eliminarla.
* **Respuesta Exitosa (`200 OK`)**:
```json
{
  "message": "Categoría eliminada exitosamente",
  "reassigned": true,
  "reassigned_to": "Servicios",
  "reassigned_count": 3
}
```

---

## 🔄 5. Módulo de Transacciones Fijas y Recurrentes

### Gastos Fijos (`/api/recurring-expenses`)
- `GET /api/recurring-expenses`: Lista gastos fijos programados del usuario.
- `POST /api/recurring-expenses`: Crea una regla de gasto recurrente (quincenal, mensual, etc.).
- `PUT /api/recurring-expenses/:id`: Actualiza configuración de frecuencia, monto o activa/pausa la regla.
- `DELETE /api/recurring-expenses/:id`: Elimina la regla (los gastos ya registrados previamente se conservan).
- `POST /api/recurring-expenses/sync`: Sincroniza y registra automáticamente los gastos vencidos hasta la fecha.
- `POST /api/recurring-expenses/:id/execute-now`: Fuerza el cobro/registro anticipado de un gasto hoy.

### Ingresos Fijos (`/api/recurring-incomes`)
- `GET /api/recurring-incomes`: Lista ingresos fijos programados del usuario (salario, honorarios, etc.).
- `POST /api/recurring-incomes`: Crea una regla de ingreso recurrente.
- `PUT /api/recurring-incomes/:id`: Actualiza la regla (monto, día de cobro, fuente, activo/pausado).
- `DELETE /api/recurring-incomes/:id`: Elimina la regla.
- `POST /api/recurring-incomes/sync`: Sincroniza y registra automáticamente los ingresos vencidos hasta la fecha.
- `POST /api/recurring-incomes/:id/execute-now`: Fuerza el registro anticipado de un ingreso recibido hoy.

---

## 🤖 6. Análisis con IA (`/api/ai/insights`)

### `POST /api/ai/insights`
Genera recomendaciones financieras avanzadas utilizando modelos de **Google Gemini** con fallback automático.

* **Cuerpo de la Petición**:
```json
{
  "expenses": [...],
  "incomes": [...],
  "goals": [...],
  "language": "es"
}
```
* **Respuesta Exitosa (`200 OK`)**:
```json
[
  {
    "id": "ins-1",
    "type": "warning",
    "title": "Gasto Elevado en Alimentación",
    "description": "El 42% de tus egresos de este mes corresponden a restaurantes.",
    "category": "Alimentación",
    "priority": "high"
  }
]
```

---

## 🩺 7. Verificación de Salud (`/health`)

### `GET /health`
Ruta pública para balanceadores de carga y monitoreo.

* **Respuesta Exitosa (`200 OK`)**:
```json
{
  "status": "healthy",
  "database": true
}
```
