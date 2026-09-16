# 🛡️ Aplicación de Principios SOLID en FinTrack

Este documento detalla cómo la base de código de **FinTrack** implementa los 5 principios fundamentales de diseño orientado a objetos y arquitectura de software (**SOLID**), tanto en el **Backend (Golang)** como en el **Frontend (Next.js 16 / TypeScript / React 19)**, asegurando un sistema desacoplado, testeable y fácilmente extensible.

---

# 🔷 PARTE I: Principios SOLID en el Backend (Golang)

---

## 📌 1. S - Single Responsibility Principle (Principio de Responsabilidad Única)

> *"Una clase o módulo debe tener una sola razón para cambiar."*

### ❌ Estado Previo (Antipatrón Monolítico)
En versiones anteriores, `backend/main.go` concentraba múltiples responsabilidades en un solo archivo:
- Lectura y escritura directa de archivos JSON en disco.
- Conexión y migración de base de datos.
- Sincronización concurrente de memoria con `sync.RWMutex`.
- Mapeo de rutas HTTP de Gin.
- Validaciones de formato y reglas de negocio financiero.
- Ejecución periódica en bucles cron/ticker inline.

### ✅ Estado Actual (Clean Separation & Scheduler Service)
Cada componente tiene **una única responsabilidad bien delimitada**:

| Componente | Responsabilidad Única | Motivo para Cambiar |
| :--- | :--- | :--- |
| **`internal/models/`** | Definir la estructura de datos del dominio y sus tags | Cambia solo si el modelo de datos cambia. |
| **`internal/repository/`** | Persistir y recuperar datos del motor de almacenamiento | Cambia solo si cambia la persistencia (SQL, GORM, JSON). |
| **`internal/services/`** | Ejecutar reglas de negocio financieras y validaciones lógicas | Cambia solo si las reglas del negocio financiero evolucionan. |
| **`internal/services/scheduler.go`** | Controlar el ciclo de vida de tareas en segundo plano (`RecurringScheduler`) | Cambia solo si cambia la frecuencia o lógica de sondeo programado. |
| **`internal/handlers/`** | Recibir la petición HTTP, extraer parámetros y responder JSON | Cambia solo si cambia el protocolo o contrato de transporte HTTP. |
| **`internal/middleware/`** | Interceptar peticiones para seguridad transversal (CORS, JWT) | Cambia solo si cambian las políticas de seguridad o CORS. |
| **`main.go`** | Inyección de dependencias e inicio del servidor web | Cambia solo si se añaden dependencias globales o variables de entorno. |

---

## 🔓 2. O - Open/Closed Principle (Principio de Abierto/Cerrado)

> *"Las entidades de software deben estar abiertas para su extensión, pero cerradas para su modificación."*

### ✅ Implementación en FinTrack
La capa de persistencia se diseñó en base a interfaces en `internal/repository/interfaces.go`:

```go
type ExpenseRepository interface {
    FindByUserID(ctx context.Context, userID string) ([]models.Expense, error)
    Create(ctx context.Context, expense *models.Expense) error
    Update(ctx context.Context, id, userID string, expense *models.Expense) (*models.Expense, error)
    Delete(ctx context.Context, id, userID string) error
    CountByCategory(ctx context.Context, userID, category string) (int64, error)
    ReassignCategory(ctx context.Context, userID, oldCategory, newCategory string) error
}
```

- Si en el futuro deseamos almacenar transacciones en **Redis**, **MongoDB** o **DynamoDB**, **no modificamos ni una sola línea de los Servicios ni de los Handlers**.
- Simplemente creamos un nuevo struct (ejemplo `RedisExpenseRepository`) que implemente la interfaz `ExpenseRepository` y lo inyectamos en `main.go`. El sistema se extiende sin modificar código existente.

---

## 🔄 3. L - Liskov Substitution Principle (Principio de Sustitución de Liskov)

> *"Los objetos de un programa deben ser reemplazables por instancias de sus subtipos sin alterar la corrección del programa."*

### ✅ Implementación en FinTrack
FinTrack cuenta con dos implementaciones completas e intercambiables de la capa de almacenamiento:
1. **`gorm_repo.GormExpenseRepository`**: Persistencia relacional en PostgreSQL.
2. **`memory_repo.MemoryExpenseRepository`**: Persistencia local en memoria sincronizada con archivos JSON.

Ambas implementaciones satisfacen exactamente el mismo contrato (`repository.ExpenseRepository`). En `backend/main.go`, el servicio se inicializa sin importar cuál repositorio se esté utilizando:

```go
var expenseRepo repository.ExpenseRepository

if db != nil {
    expenseRepo = gorm_repo.NewGormExpenseRepository(db)
} else {
    expenseRepo = memory_repo.NewMemoryExpenseRepository(expensesFile)
}

// ExpenseService funciona de manera 100% idéntica con cualquiera de las dos implementaciones:
expenseService := services.NewExpenseService(expenseRepo)
```

Ninguna regla de negocio en `ExpenseService` necesita saber si los datos vienen de una base de datos PostgreSQL en la nube o de un archivo JSON en disco local.

---

## ✂️ 4. I - Interface Segregation Principle (Principio de Segregación de Interfaces)

> *"Los clientes no deben verse obligados a depender de interfaces que no utilizan."*

### ✅ Implementación en FinTrack
En lugar de crear una interfaz monolítica "God Repository" que contenga todos los métodos de gastos, ingresos, metas y categorías juntos, FinTrack **segrega las interfaces por dominio cohesivo en `internal/services/interfaces.go`**:

- `ExpenseService`: Métodos exclusivos para la gestión de gastos.
- `IncomeService`: Métodos exclusivos para la gestión de ingresos.
- `GoalService`: Métodos exclusivos para las metas de ahorro.
- `CategoryService`: Métodos exclusivos para categorías personalizadas.
- `RecurringExpenseService`: Operaciones de cobros y sincronizaciones de egresos fijos.
- `RecurringIncomeService`: Operaciones de cobros y sincronizaciones de ingresos fijos.
- `Scheduler`: Contrato mínimo para ciclo de vida en segundo plano (`Start`, `Stop`).

Ejemplo: `GoalService` únicamente recibe `repository.GoalRepository`. No tiene acceso ni acoplamiento accidental con métodos de gastos o categorías:

```go
type goalService struct {
    repo repository.GoalRepository // Solo depende de lo que realmente usa
}
```

---

## 🔌 5. D - Dependency Inversion Principle (Principio de Inversión de Dependencias)

> *"Los módulos de alto nivel no deben depender de los módulos de bajo nivel. Ambos deben depender de abstracciones. Las abstracciones no deben depender de los detalles; los detalles deben depender de las abstracciones."*

### ❌ Estado Previo (Acoplamiento a Detalles Concretos)
Los endpoints dependían directamente de una variable global `*gorm.DB` y de slices globales en memoria (`var expenses []models.Expense`).

### ✅ Estado Actual (Inversión Mediante Interfaces e Inyección de Dependencias)
Los módulos de alto nivel (Handlers, Services y Scheduler) dependen **únicamente de interfaces abstractas**:

1. **`ExpenseHandler`** depende de la abstracción `services.ExpenseService`:
   ```go
   type ExpenseHandler struct {
       service services.ExpenseService
   }
   func NewExpenseHandler(service services.ExpenseService) *ExpenseHandler {
       return &ExpenseHandler{service: service}
   }
   ```

2. **`ExpenseService`** depende de la abstracción `repository.ExpenseRepository`:
   ```go
   type expenseService struct {
       repo repository.ExpenseRepository
   }
   func NewExpenseService(repo repository.ExpenseRepository) ExpenseService {
       return &expenseService{repo: repo}
   }
   ```

3. **`RecurringScheduler`** depende de las abstracciones `RecurringExpenseService` y `RecurringIncomeService`:
   ```go
   type RecurringScheduler struct {
       expenseService RecurringExpenseService
       incomeService  RecurringIncomeService
       interval       time.Duration
       stopChan       chan struct{}
   }
   ```

### 🧪 Beneficio Inmediato: Testabilidad
Gracias a la Inversión de Dependencias, las pruebas unitarias (`backend/internal/services/expense_service_test.go`) no requieren una base de datos real. Se puede inyectar un `MockExpenseRepository` en memoria y ejecutar pruebas unitarias en milisegundos de forma 100% aislada:

```go
func TestExpenseService_CreateAndGet(t *testing.T) {
    mockRepo := &MockExpenseRepository{}
    svc := services.NewExpenseService(mockRepo) // Inyección de mock

    created, err := svc.CreateExpense(context.Background(), "user-123", &models.Expense{
        Amount: 45.50,
        Description: "Almuerzo",
    })
    // Verificación rápida y confiable
}
```

---

# 🔶 PARTE II: Principios SOLID en el Frontend (Next.js 16 / TypeScript / React 19)

---

## 📌 1. S - Single Responsibility Principle en Frontend

### ❌ Estado Previo
Los componentes de página (`app/expenses/page.tsx`, `app/goals/page.tsx`) y modales realizaban peticiones directas vía `fetch`, concatenaban URLs a mano (`/api/recurring-expenses/sync?client_date=...`), parseaban JSON y gestionaban toasts. Tenían múltiples razones para cambiar: cambios de diseño UI, cambios de URLs o cambios en la serialización de datos.

### ✅ Estado Actual: Capa de Servicios (`frontend/src/services/`)
Se introdujo una capa de servicios desacoplada:
- `expenseService`: Manejo exclusivo de llamadas a endpoints de gastos.
- `incomeService`: Manejo exclusivo de llamadas a endpoints de ingresos.
- `goalService`: Manejo exclusivo de llamadas a endpoints de metas.
- `categoryService`: Manejo exclusivo de categorías y reasignación.
- `recurringService`: Programaciones y ejecuciones de recurrencia.

Los componentes visuales ahora **solo se encargan de pintar la vista y manejar eventos del usuario**:

```typescript
// En la página de gastos:
const res = await expenseService.getExpenses();
if (res.ok) {
  setExpenses(res.data || []);
}
```

---

## 🔓 2. O - Open/Closed Principle en Frontend

### ✅ Estrategia de Exportación y Formatters
- El módulo `excelExport.ts` y los utilitarios de formateo están diseñados para extenderse con nuevas hojas de cálculo, columnas o formatos (como CSV o futuros PDFs) sin modificar los componentes del Dashboard ni de Reportes.
- El sistema de íconos (`AppIcons.tsx`) y paletas de categorías permite registrar nuevos paquetes de iconos o temas sin reescribir las tablas ni las tarjetas.

---

## 🔄 3. L - Liskov Substitution Principle en Frontend

### ✅ Proveedores de Contexto y Componentes Base
- Los contextos de React (`SettingsContext`, `AuthContext`) definen contratos de estado e interfaces sustituibles. En entornos de pruebas unitarias (Jest / Vitest / Playwright), cualquier proveedor puede ser sustituido por un Mock Provider que implemente exactamente la misma interfaz sin que los componentes hijos fallen.
- Los componentes atómicos de UI en `components/ui/` (como `Button`, `Input`) extienden las interfaces HTML nativas estándar (`React.ButtonHTMLAttributes<HTMLButtonElement>`), garantizando sustitución transparente donde se use un elemento HTML nativo.

---

## ✂️ 4. I - Interface Segregation Principle en Frontend

### ✅ Tipos e Interfaces de Entrada Segregados
En lugar de forzar a los componentes de formularios a enviar un objeto `Expense` completo con campos autogenerados por el servidor (`id`, `created_at`), se definen tipos de entrada precisos y estrechos:

```typescript
export type CreateExpenseInput = Omit<Expense, "id">;
export type UpdateExpenseInput = Partial<Omit<Expense, "id">>;

export type CreateGoalInput = Omit<Goal, "id">;
export type UpdateGoalInput = Partial<Goal>;
```

Esto evita que un formulario tenga que fabricar IDs falsos o fechas de auditoría innecesarias.

---

## 🔌 5. D - Dependency Inversion Principle en Frontend

### ✅ Inversión de Dependencias en Vistas
- Las páginas y componentes no dependen directamente de la red ni de la implementación subyacente de `window.fetch`.
- Dependen de la abstracción proporcionada por la capa `services/` y `safeFetch`.
- Las configuraciones de moneda, idioma y autenticación se consumen a través de hooks de abstracción (`useSettings()`, `useAuth()`) que aíslan a los componentes de los detalles de almacenamiento (LocalStorage, Supabase SDK).
