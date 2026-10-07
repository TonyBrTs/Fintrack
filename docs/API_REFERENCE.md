# 📡 FinTrack REST API — Especificación Técnica Formal

- **Versión de la API:** `2.0.0`
- **Protocolo:** `HTTPS` / `RESTful JSON`
- **Arquitectura de Ejecución:** Go 1.24 (Gin Framework) + Arquitectura Hexagonal / Repositorios desacoplados
- **Capa de Persistencia:** PostgreSQL 15 en Supabase (GORM ORM) con fallback en memoria/JSON
- **Seguridad y Aislamiento:** Row Level Security (RLS) + Dual Authentication (JWT / SHA-256 API Keys)

---

## 🌐 1. Entornos y Direcciones Base (Base URLs)

| Entorno | URL Base | Propósito |
| :--- | :--- | :--- |
| **Producción (Render)** | `https://fintrack-ihwb.onrender.com` | Servicio principal en la nube |
| **Desarrollo Local** | `http://localhost:8080` | Servidor backend en entorno local |
| **Edge Serverless (Next.js)** | `https://fintrack-six-opal.vercel.app/api/ai` | Módulos de IA y analítica frontend |

---

## 🔐 2. Modelo de Autenticación y Autorización

FinTrack implementa un **modelo de autenticación dual** diseñado para soportar tanto clientes interactivos (Single Page Applications) como sistemas automatizados (pipelines n8n, webhooks bancarios, cron jobs y scripts).

```
                      ┌───────────────────────────────────────────────┐
                      │              Petición Entrante                │
                      └──────────────────────┬────────────────────────┘
                                             │
                       ¿Contiene X-API-Key o Bearer fntk_live_*?
                                             │
                        ┌────────────────────┴────────────────────┐
                        ▼                                         ▼
                     [ SÍ ]                                    [ NO ]
                        │                                         │
           Validar Hash SHA-256 en DB                  Validar Supabase JWT
           Verificar IsActive & ExpiresAt             (Firma RS256/HS256)
                        │                                         │
                        ▼                                         ▼
             Inyectar Contexto:                        Inyectar Contexto:
             - c.Set("userID", key.UserID)             - c.Set("userID", claims.Sub)
             - Asíncrono: Update LastUsedAt            - c.Set("email", claims.Email)
                        │                                         │
                        └────────────────────┬────────────────────┘
                                             ▼
                                c.Next() -> Controlador
```

### 2.1. Métodos de Autenticación Soportados

#### A. Claves de API Persistentes (`API Keys`) — *Recomendado para Automatizaciones*
- **Formato:** Cadena alfanumérica con prefijo obligatorio: `fntk_live_<hex32>` (ej. `fntk_live_3f9a8b1c4e2d0f5a6b7c8d9e0f1a2b3c`).
- **Mecanismo de Verificación:** 
  1. El servidor computa el hash `SHA-256(plain_token)` en tiempo constante.
  2. Consulta la tabla `api_keys` por `key_hash`.
  3. Verifica que `is_active == true` y que `expires_at == null || now() < expires_at`.
  4. Extrae el `user_id` asociado y lo inyecta en el contexto de ejecución.
  5. Despacha una goroutine en segundo plano para actualizar la marca de tiempo `last_used_at`.
- **Cabeceras HTTP Aceptadas:**
  ```http
  X-API-Key: fntk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  ```
  o alternativamente:
  ```http
  Authorization: Bearer fntk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  ```

#### B. Tokens JWT de Supabase — *Para Sesiones Web y Móviles*
- **Formato:** JSON Web Token RFC 7519 emitido por Supabase Auth.
- **Cabecera HTTP:**
  ```http
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

---

## ⚠️ 3. Códigos de Estado y Formato de Errores

Todas las respuestas con código de error retornan un payload JSON consistente bajo la estructura:

```json
{
  "error": "Descripción legible del error",
  "code": "CODIGO_DE_ERROR_OPCIONAL"
}
```

| Código HTTP | Significado | Causa común |
| :--- | :--- | :--- |
| `200 OK` | Operación exitosa | Petición GET, PUT o DELETE procesada correctamente |
| `201 Created` | Recurso creado | Registro exitoso de gastos, ingresos, metas o claves |
| `400 Bad Request` | Payload inválido | Error de sintaxis JSON o campo obligatorio ausente |
| `401 Unauthorized` | Autenticación fallida | Clave API inexistente, revocada, expirada o JWT inválido |
| `404 Not Found` | Recurso no encontrado | El ID solicitado no existe o no pertenece al usuario autenticado |
| `500 Internal Error`| Error del servidor | Fallo de conexión con la base de datos o fallo interno |

---

## 📋 4. Catálogo Completo de Endpoints

### 4.1. Diagnóstico y Monitoreo

#### `GET /health`
Verifica la disponibilidad del servicio y la conectividad con la base de datos.
- **Autenticación requerida:** Ninguna (Público).
- **Respuesta (`200 OK`):**
  ```json
  {
    "status": "ok",
    "timestamp": "2026-10-06T20:30:00Z",
    "database": "connected"
  }
  ```

---

### 4.2. Consulta de Métodos de Pago (`/api/payment-methods`)

#### `GET /api/payment-methods`
Retorna los métodos de pago estándar aceptados por FinTrack. Puede ser consumido por automatizaciones (n8n, scripts) para poblar selectores o validar datos.
- **Headers:** `X-API-Key` o `Authorization: Bearer <token>` (también disponible como endpoint público en `/payment-methods`)
- **Query Parameters (Opcionales):**
  - `?type=expense` (o `gasto`): Retorna únicamente los métodos de pago para gastos.
  - `?type=income` (o `ingreso`): Retorna únicamente los métodos de pago para ingresos.
- **Respuesta completa (`200 OK`):**
  ```json
  {
    "expense_methods": [
      "Tarjeta de Crédito",
      "Tarjeta de Débito",
      "Efectivo",
      "Transferencia",
      "Automático (API)",
      "PayPal",
      "SINPE Móvil",
      "Depósito Bancario",
      "Otro"
    ],
    "income_methods": [
      "Transferencia",
      "Efectivo",
      "Depósito Bancario",
      "Automático (API)",
      "PayPal",
      "SINPE Móvil",
      "Cheque",
      "Otro"
    ]
  }
  ```
- **Respuesta filtrada (`GET /api/payment-methods?type=expense`):**
  ```json
  [
    "Tarjeta de Crédito",
    "Tarjeta de Débito",
    "Efectivo",
    "Transferencia",
    "Automático (API)",
    "PayPal",
    "SINPE Móvil",
    "Depósito Bancario",
    "Otro"
  ]
  ```

> [!NOTE]
> Al registrar gastos o ingresos vía API (`POST /api/expenses`), FinTrack es flexible y permite enviar **cualquier** método de pago en el campo `payment_method` (por ejemplo: `"Apple Pay"`, `"SINPE Móvil"`, `"Efectivo"` o `"Tarjeta de Crédito"`). Si se omite, se asigna `"Automático (API)"`.

---

### 4.2. Módulo de Gestión de API Keys (`/api/api-keys`)

#### `GET /api/api-keys`
Retorna la lista de todas las claves generadas por el usuario actual. Por seguridad, **nunca retorna la clave completa**, solo el prefijo y los últimos 4 caracteres.
- **Headers:** `X-API-Key` o `Authorization: Bearer <jwt>`
- **Respuesta (`200 OK`):**
  ```json
  [
    {
      "id": "key_9b1deb4d3b7d",
      "user_id": "c1f7a28e-5b12-4c8d-93e5-82b1c4e7f9a2",
      "name": "Pipeline n8n Facturas",
      "key_prefix": "fntk_live_",
      "key_last4": "a9f2",
      "created_at": "2026-10-01T15:20:00Z",
      "last_used_at": "2026-10-06T18:45:10Z",
      "expires_at": null,
      "is_active": true
    }
  ]
  ```

#### `POST /api/api-keys`
Genera una nueva clave criptográfica para el usuario.
- **Cuerpo (`application/json`):**
  ```json
  {
    "name": "Bot de Gastos WhatsApp"
  }
  ```
- **Respuesta (`201 Created`):**
  > [!IMPORTANT]
  > El campo `plain_key` contiene la clave secreta en texto claro. Esta es la **única vez** que se transmitirá. Debe ser almacenada de inmediato.
  ```json
  {
    "id": "key_e4b2c1d0f5a6",
    "user_id": "c1f7a28e-5b12-4c8d-93e5-82b1c4e7f9a2",
    "name": "Bot de Gastos WhatsApp",
    "key_prefix": "fntk_live_",
    "key_last4": "8b3c",
    "plain_key": "fntk_live_a8c9e0f1b2d3c4e5f6a7b8c9d0e1f2a3",
    "created_at": "2026-10-06T20:45:00Z",
    "is_active": true
  }
  ```

#### `DELETE /api/api-keys/:id`
Revoca y elimina inmediatamente la clave especificada.
- **Parámetros de ruta:** `id` (Identificador único de la clave).
- **Respuesta (`200 OK`):**
  ```json
  {
    "message": "API key revoked successfully"
  }
  ```

---

### 4.3. Módulo de Gastos (`/api/expenses`)

#### `GET /api/expenses`
Obtiene los gastos del usuario autenticado ordenados cronológicamente de forma descendente.
- **Headers:** `X-API-Key` o `Authorization: Bearer <token>`
- **Respuesta (`200 OK`):**
  ```json
  [
    {
      "id": "exp_8f7b2c1a",
      "user_id": "c1f7a28e-5b12-4c8d-93e5-82b1c4e7f9a2",
      "amount": 34.50,
      "currency": "USD",
      "description": "Almuerzo de trabajo",
      "category": "Alimentación",
      "payment_method": "Tarjeta de Débito",
      "date": "2026-10-06T13:30:00Z",
      "created_at": "2026-10-06T13:30:05Z"
    }
  ]
  ```

#### `POST /api/expenses`
Registra un nuevo gasto. Soporta tanto identificadores únicos (`category_id`, `payment_method_id`) como nombres directos en texto plano.

> [!TIP]
> **Patrón Recomendado para Integraciones (Uso de IDs):**
> 1. Consulta primero las opciones disponibles para tu usuario mediante `GET /api/categories` y `GET /api/payment-methods`.
> 2. Envía `category_id` (ej. `"default-exp-1"` para Alimentación, o el ID de tu categoría personalizada `"cat_..."`) y `payment_method_id` (ej. `"pm_tarjeta_credito"`).
> 3. **Seguridad y Aislamiento Multiusuario:** FinTrack valida que la categoría pertenezca estrictamente al usuario autenticado (o sea del sistema global). Nadie puede usar categorías de otros usuarios.
> 4. **Inferencia Automática:** Si no envías ni `category` ni `category_id`, FinTrack analiza la `description` y clasifica el gasto automáticamente.

- **Payload Recomendado (por IDs):**
  ```json
  {
    "amount": 45.00,
    "currency": "USD",
    "description": "Supermercado Walmart",
    "category_id": "default-exp-1",
    "payment_method_id": "pm_tarjeta_debito",
    "date": "2026-10-06T18:00:00Z"
  }
  ```
- **Payload Alternativo (por Nombres en Texto):**
  ```json
  {
    "amount": 45.00,
    "currency": "USD",
    "description": "Supermercado Walmart",
    "category": "Alimentación",
    "payment_method": "Tarjeta de Débito",
    "date": "2026-10-06T18:00:00Z"
  }
  ```
- **Payload Mínimo Válido (para automatizaciones ágiles con auto-categorización):**
  ```json
  {
    "amount": 45.00,
    "description": "Supermercado Walmart"
  }
  ```
- **Respuesta (`201 Created`):**
  ```json
  {
    "id": "exp_8f7b2c1a",
    "user_id": "c1f7a28e-5b12-4c8d-93e5-82b1c4e7f9a2",
    "amount": 45.00,
    "currency": "USD",
    "description": "Supermercado Walmart",
    "category": "Alimentación",
    "payment_method": "Tarjeta de Débito",
    "date": "2026-10-06T18:00:00Z",
    "created_at": "2026-10-06T18:00:02Z"
  }
  ```

#### `PUT /api/expenses/:id`
Actualiza un gasto existente.
- **Parámetros de ruta:** `id` (Identificador del gasto).
- **Cuerpo:** Campos a modificar en formato JSON.
- **Respuesta (`200 OK`):** Objeto `Expense` actualizado.

#### `DELETE /api/expenses/:id`
Elimina un registro de gasto.
- **Parámetros de ruta:** `id` (Identificador del gasto).
- **Respuesta (`200 OK`):**
  ```json
  {
    "message": "Expense deleted successfully"
  }
  ```

---

### 4.4. Módulo de Ingresos (`/api/incomes`)

#### `GET /api/incomes`
Lista los ingresos del usuario autenticado.
- **Respuesta (`200 OK`):** Lista de objetos `Income`.

#### `POST /api/incomes`
Registra un nuevo ingreso.
- **Cuerpo:**
  ```json
  {
    "amount": 2200.00,
    "currency": "USD",
    "description": "Salario Primera Quincena",
    "source": "Salario",
    "payment_method": "Transferencia Bancaria",
    "date": "2026-10-15T09:00:00Z"
  }
  ```
- *Valores estándar de `source`:* `Salario`, `Freelance`, `Inversiones`, `Regalo`, `Otros`.
- **Respuesta (`201 Created`):** Objeto `Income` creado.

#### `PUT /api/incomes/:id`
Actualiza un ingreso existente (`200 OK`).

#### `DELETE /api/incomes/:id`
Elimina un ingreso (`200 OK`).

---

### 4.5. Módulo de Transacciones Recurrentes (`/api/recurring-expenses` & `/api/recurring-incomes`)

Permite programar gastos o ingresos fijos con ejecución automática mediante un scheduler en segundo plano.

| Endpoint | Método | Descripción |
| :--- | :--- | :--- |
| `/api/recurring-expenses` | `GET` | Lista todos los gastos periódicos activos |
| `/api/recurring-expenses` | `POST` | Programa una nueva regla de gasto recurrente |
| `/api/recurring-expenses/:id` | `PUT` | Actualiza montos, periodicidad o estado |
| `/api/recurring-expenses/:id` | `DELETE` | Elimina la regla recurrente |
| `/api/recurring-expenses/sync` | `POST` | Fuerza la sincronización de cuotas pendientes |
| `/api/recurring-expenses/:id/execute-now` | `POST` | Dispara y registra una cuota inmediatamente |

- **Esquema de Creación (`POST /api/recurring-expenses`):**
  ```json
  {
    "description": "Suscripción Internet Fibra Óptica",
    "amount": 55.00,
    "currency": "USD",
    "category": "Servicios",
    "payment_method": "Débito Automático",
    "frequency": "monthly",
    "billing_day": 20,
    "start_date": "2026-10-01T00:00:00Z",
    "auto_register": true
  }
  ```
- *Frecuencias soportadas:* `monthly` (mensual), `biweekly` (quincenal: días 15 y fin de mes), `weekly` (semanal), `yearly` (anual).

---

### 4.6. Módulo de Metas de Ahorro (`/api/goals`)

#### `GET /api/goals`
Lista todas las metas financieras y su nivel de avance.
- **Respuesta (`200 OK`):**
  ```json
  [
    {
      "id": "goal_3f8a1b2c",
      "user_id": "c1f7a28e-5b12-4c8d-93e5-82b1c4e7f9a2",
      "name": "Fondo de Emergencia",
      "target_amount": 5000.00,
      "current_amount": 1850.00,
      "deadline": "2026-12-31T00:00:00Z",
      "category": "Ahorro",
      "created_at": "2026-08-01T10:00:00Z"
    }
  ]
  ```

#### `POST /api/goals`
Crea una nueva meta de ahorro.
- **Cuerpo:**
  ```json
  {
    "name": "Viaje de Vacaciones",
    "target_amount": 2000.00,
    "current_amount": 300.00,
    "deadline": "2027-06-30T00:00:00Z",
    "category": "Viajes"
  }
  ```
- **Respuesta (`201 Created`)**.

#### `PUT /api/goals/:id`
Actualiza el progreso o atributos de la meta (`200 OK`).

#### `DELETE /api/goals/:id`
Elimina la meta financiera (`200 OK`).

---

### 4.7. Módulo de Categorías Personalizadas (`/api/categories`)

- **`GET /api/categories`**: Retorna el catálogo unificado de categorías predefinidas del sistema y categorías personalizadas del usuario.
- **`POST /api/categories`**: Registra una nueva categoría:
  ```json
  {
    "name": "Gimnasio & Suplementos",
    "type": "expense",
    "icon": "dumbbell",
    "color": "#10B981"
  }
  ```
- **`DELETE /api/categories/:id`**: Elimina una categoría personalizada garantizando la integridad de transacciones existentes.

---

## 💻 5. Ejemplos Prácticos de Implementación

### A. cURL (Terminal / Bash)
```bash
curl -X POST "https://fintrack-ihwb.onrender.com/api/expenses" \
  -H "X-API-Key: fntk_live_tu_clave_secreta_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 28.50,
    "currency": "USD",
    "description": "Almuerzo cafetería",
    "payment_method": "Tarjeta de Débito"
  }'
```

### B. Node.js / TypeScript
```typescript
interface ExpenseInput {
  amount: number;
  description: string;
  currency?: string;
  category?: string;
  payment_method?: string;
}

async function registerExpense(expense: ExpenseInput) {
  const response = await fetch("https://fintrack-ihwb.onrender.com/api/expenses", {
    method: "POST",
    headers: {
      "X-API-Key": process.env.FINTRACK_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(expense),
  });

  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(`FinTrack Error [${response.status}]: ${errorBody.error}`);
  }

  return await response.json();
}
```

### C. Python 3
```python
import os
import requests

FINTRACK_URL = "https://fintrack-ihwb.onrender.com/api/expenses"
API_KEY = os.getenv("FINTRACK_API_KEY", "fntk_live_tu_clave_secreta")

def create_expense(amount: float, description: str):
    headers = {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "amount": amount,
        "description": description,
        "currency": "USD"
    }
    
    res = requests.post(FINTRACK_URL, json=payload, headers=headers)
    res.raise_for_status()
    return res.json()

if __name__ == "__main__":
    result = create_expense(15.75, "Gasolina semanal")
    print("Gasto registrado con ID:", result.get("id"))
```

### D. Configuración en Automatizadores (n8n / Make)
1. **Nodo:** `HTTP Request`
2. **Método:** `POST`
3. **URL:** `https://fintrack-ihwb.onrender.com/api/expenses`
4. **Authentication:** `None` (autenticación directa vía headers)
5. **Headers:**
   - Nombre: `X-API-Key` | Valor: `fntk_live_xxxxxxxx`
   - Nombre: `Content-Type` | Valor: `application/json`
6. **Body (JSON / Raw):**
   ```json
   {
     "amount": {{ $json.monto }},
     "description": "{{ $json.comercio_o_concepto }}",
     "currency": "USD"
   }
   ```
