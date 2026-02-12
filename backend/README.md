# FinTrack - Backend ⚙️

The robust API server for **FinTrack**, built with **Go (Golang)** for high performance and reliability.

## 🛠 Tech Stack

- **Language**: [Go 1.23](https://go.dev/)
- **Web Framework**: [Gin Gonic](https://gin-gonic.com/)
- **Data Storage**: JSON File System (Lightweight, NoSQL-like)
- **Serialization**: Standard `encoding/json`

## 🚀 Getting Started

### Prerequisites

Ensure Go is installed and added to your PATH.

### Installation

```bash
# Navigate to the backend directory
cd backend

# Download dependencies
go mod download
```

### Running the Server

The server runs on port `8080` by default.

```bash
# Run the application
go run cmd/main.go
# OR simply
go run main.go
```

## 🔌 API Endpoints

### Transactions (Expenses & Incomes)

| Method   | Endpoint            | Description           |
| -------- | ------------------- | --------------------- |
| `GET`    | `/api/expenses`     | Retrieve all expenses |
| `POST`   | `/api/expenses`     | Add a new expense     |
| `DELETE` | `/api/expenses/:id` | Delete an expense     |
| `GET`    | `/api/incomes`      | Retrieve all incomes  |
| `POST`   | `/api/incomes`      | Add a new income      |
| `DELETE` | `/api/incomes/:id`  | Delete an income      |

### Goals

| Method   | Endpoint         | Description                  |
| -------- | ---------------- | ---------------------------- |
| `GET`    | `/api/goals`     | Retrieve all financial goals |
| `POST`   | `/api/goals`     | Create a new financial goal  |
| `PUT`    | `/api/goals/:id` | Update goal progress         |
| `DELETE` | `/api/goals/:id` | Delete a goal                |

## 📂 Project Structure

```
backend/
├── cmd/
│   └── main.go       # Application entry point
├── internal/
│   ├── handlers/     # Request handlers (Controllers)
│   ├── models/       # Data structures
│   └── repository/   # Data access layer (JSON file ops)
├── data/             # JSON storage files (expenses.json, etc.)
└── go.mod            # Dependency definitions
```

---

_Built with ❤️ by TonyBrTs_
