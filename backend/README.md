# FinTrack - Backend API ⚡

Servidor API RESTful de alto rendimiento para **FinTrack**, desarrollado en **Go (Golang)** bajo **Clean Architecture** y principios **SOLID**.

---

## 🛠️ Stack Tecnológico

* **Lenguaje**: [Go 1.23+](https://go.dev/)
* **Framework Web**: [Gin Framework](https://gin-gonic.com/)
* **ORM & Persistencia**: [GORM](https://gorm.io/) con PostgreSQL (Supabase) y modo contingencia en memoria/JSON
* **Autenticación**: Supabase Auth (Validación criptográfica de JWTs HMAC/RSA)
* **Arquitectura**: Clean Architecture (Handlers ➔ Services ➔ Repositories ➔ Models)

---

## 🚀 Inicio Rápido

### Prerrequisitos
Tener Go 1.22+ instalado (o entorno WSL en Windows):
```bash
go version
```

### Ejecutar en Desarrollo
```bash
# Descargar dependencias
go mod download

# Iniciar servidor (puerto 8080 por defecto)
go run main.go
```

### Ejecutar Pruebas Unitarias
```bash
go test -v ./internal/services/...
```

---

## 📂 Estructura del Backend (SOLID)

```
backend/
├── internal/
│   ├── database/       # Conexión GORM PostgreSQL y AutoMigrate
│   ├── handlers/       # Controladores HTTP puros (Single Responsibility)
│   ├── middleware/     # Auth JWT y CORS Middleware
│   ├── models/         # Entidades del dominio (Expense, Income, Goal, Category, Recurrences)
│   ├── repository/     # Contratos e implementaciones intercambiables (Liskov / DIP)
│   │   ├── gorm_repo/  # Implementación con PostgreSQL
│   │   └── memory_repo/# Implementación local / JSON fallback
│   └── services/       # Lógica de negocio, Scheduler y pruebas unitarias con Mocks
│       ├── interfaces.go # Contratos de servicios centralizados
│       ├── scheduler.go  # RecurringScheduler (Background worker aislado)
│       └── ...
├── go.mod
├── main.go             # Inyección de dependencias y bootstrapping
└── README.md
```

---

## 📖 Documentación Detallada

Para más información técnica, consulta:
* [Arquitectura del Sistema](../docs/ARCHITECTURE.md)
* [Principios SOLID en FinTrack](../docs/SOLID_PRINCIPLES.md)
* [Registros de Decisiones de Arquitectura (ADRs)](../docs/decisions/)
* [Referencia de la API REST](../docs/API_REFERENCE.md)
* [Esquema de Base de Datos](../docs/DATABASE.md)
* [Autenticación y Seguridad](../docs/AUTH_AND_SECURITY.md)
* [Despliegue en Producción](../docs/DEPLOYMENT.md)

