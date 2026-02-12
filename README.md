# FinTrack 🚀

**FinTrack** is a modern, full-stack personal finance application designed to help users track expenses, incomes, and goals with ease. Built with a focus on performance, aesthetics, and user experience.

## ✨ Technical Overview

This project is a monorepo consisting of a high-performance **Go** backend and a dynamic **Next.js** frontend.

| Component    | Technology Stack                                                                          | Key Features                                                                          |
| ------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Frontend** | [Next.js 16](https://nextjs.org/) (React 19), [Tailwind CSS v4](https://tailwindcss.com/) | Dark Mode, Responsive Design, Interactive Charts (Recharts), Framer Motion Animations |
| **Backend**  | [Go 1.23](https://go.dev/), [Gin Framework](https://gin-gonic.com/)                       | RESTful API, JSON File Storage (NoSQL-lite approach), Fast Execution                  |

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- [Go](https://go.dev/) (v1.23+)

### 1. Backend Setup

The backend runs on port `8080`.

```bash
cd backend
go mod download
go run main.go
```

### 2. Frontend Setup

The frontend runs on `http://localhost:3000`.

```bash
cd frontend
npm install
npm run dev
```

## 🌟 Key Features

- **Dashboard Summary**: Real-time overview of your financial health (Balance, Income, Expenses, Savings Rate).
- **Goal Tracking**: Set and visualize financial goals with progress bars.
- **Transaction Management**: Easy-to-use interface for adding and viewing transactions.
- **Multi-Currency Support**: Switch between USD, EUR, GBP, and CRC seamlessly.
- **Theme Customization**: Beautiful Light and Dark modes.
- **Global Search & Shortcuts**: Quick access to features (triggered by shortcuts).

## 📂 Project Structure

```
fintrack-ai/
├── backend/            # Go REST API
│   ├── cmd/            # Entry point
│   ├── internal/       # Business logic & handlers
│   └── *.json          # Data storage files
├── frontend/           # Next.js Application
│   ├── src/            # Source code
│   │   ├── app/        # App Router pages
│   │   ├── components/ # Reusable UI components
│   │   └── lib/        # Utilities & API clients
└── README.md           # You are here
```

---

_Built with ❤️ by TonyBrTs_
