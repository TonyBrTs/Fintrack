# FinTrack - Frontend 🎨

The user interface for **FinTrack**, built with **Next.js 16**, designed for speed and interactivity.

## 🛠 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management**: React Context (Settings, Theme)
- **Data Fetching**: Fetch API + SWR (planned)
- **Charts**: [Recharts](https://recharts.org/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) based

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
npm install
```

### Development Server

```bash
# Run the development server on http://localhost:3000
npm run dev
```

### Production Build

```bash
# Build the application for production
npm run build

# Start the production server
npm start
```

## 📂 Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js App Router (Pages & Layouts)
│   │   ├── goals/        # Goals Page
│   │   ├── transactions/ # Transactions Page
│   │   └── page.tsx      # Dashboard (Home)
│   ├── components/       # React Components
│   │   ├── layout/       # Header, Sidebar, Wrapper
│   │   ├── ui/           # Reusable UI elements (Buttons, Inputs, Cards)
│   │   └── *.tsx         # Feature-specific components (Charts, KPI Cards)
│   ├── contexts/         # Global Context Providers (Settings, Theme)
│   ├── lib/              # Utilities (API helpers, Formatting)
│   └── types/            # TypeScript Definitions
├── public/               # Static assets
└── ...
```

## ✨ Key Components

- **Header**: Responsive top bar with Theme Toggle, Language/Currency Switcher, and User Profile.
- **Sidebar**: Easy navigation for Dashboard, Transactions, Goals, and Settings.
- **KPICard**: Displays key metrics like Balance, Income, Expenses.
- **SummaryCharts**: Visualizes spending trends over time.

---

_Built with ❤️ by TonyBrTs_
