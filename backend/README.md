# FinTrack - Backend ⚙️

Servidor API de alto rendimiento para **FinTrack**, desarrollado en **Go (Golang)** con el framework Gin y persistencia ligera en archivos JSON.

---

## 🛠 Stack Tecnológico

- **Lenguaje**: [Go 1.23+](https://go.dev/)
- **Framework Web**: [Gin Gonic](https://gin-gonic.com/)
- **Almacenamiento**: Archivos JSON locales (`expenses.json`, `incomes.json`, `goals.json`)
- **Serialización**: `encoding/json` estándar
- **Seguridad / CORS**: Middleware CORS con soporte para `http://localhost:3000`

---

## 🚀 Inicio y Configuración

### Prerrequisitos

- Tener Go instalado en tu máquina o en WSL (Windows Subsystem for Linux):
  ```bash
  go version
  ```

### Instalación de dependencias

```bash
cd backend
go mod download
```

### Ejecutar el Servidor

El servidor se inicia por defecto en el puerto `8080`:

```bash
go run main.go
```

---

## 🔌 Especificación de la API REST

### Gastos (`/api/expenses`)

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/expenses` | Obtener la lista completa de gastos |
| `POST` | `/api/expenses` | Registrar un nuevo gasto |
| `PUT` | `/api/expenses/:id` | Actualizar un gasto existente |
| `DELETE` | `/api/expenses/:id` | Eliminar un gasto por su identificador |

### Ingresos (`/api/incomes`)

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/incomes` | Obtener la lista completa de ingresos |
| `POST` | `/api/incomes` | Registrar un nuevo ingreso |
| `PUT` | `/api/incomes/:id` | Actualizar un ingreso existente |
| `DELETE` | `/api/incomes/:id` | Eliminar un ingreso por su identificador |

### Metas de Ahorro (`/api/goals`)

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/goals` | Obtener todas las metas financieras |
| `POST` | `/api/goals` | Crear una nueva meta de ahorro |
| `PUT` | `/api/goals/:id` | Actualizar meta o añadir aportes |
| `DELETE` | `/api/goals/:id` | Eliminar una meta |

### Categorías Personalizadas (`/api/categories`)

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/categories?type=expense\|income` | Obtener categorías del sistema y del usuario |
| `POST` | `/api/categories` | Crear una nueva categoría personalizada |
| `DELETE` | `/api/categories/:id?reassignTo=...` | Eliminar categoría con reasignación opcional |

---

## 📂 Estructura del Backend

```
backend/
├── internal/
│   ├── database/       # Conexión PostgreSQL (GORM) y AutoMigrate
│   ├── middleware/     # AuthMiddleware (validación JWT con caché)
│   └── models/         # Modelos (Expense, Income, Goal, Category)
├── expenses.json       # Persistencia local de gastos
├── incomes.json        # Persistencia local de ingresos
├── goals.json          # Persistencia local de metas
├── categories.json     # Persistencia local de categorías
├── go.mod              # Definición de dependencias
├── go.sum              # Checksums de dependencias
├── main.go             # Inicialización y configuración de rutas Gin
└── README.md
```

---

_Desarrollado con ❤️ por TonyBrTs_
