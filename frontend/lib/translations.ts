export const translations = {
  en: {
    nav: {
      summary: "Summary",
      expenses: "Expenses",
      income: "Income",
      goals: "Goals",
    },
    header: {
      language: "Language",
      currency: "Currency",
      settings: "Settings",
    },
    summary: {
      balance: "Total Balance",
      income: "Income",
      expenses: "Expenses",
      netSaving: "Net Saving",
    },
    income: {
      title: "Income",
      description: "Recording and analysis of your income.",
    },
    expenses: {
      title: "Expenses",
      description: "Recording and analysis of your expenses.",
      register: "Register Expense",
      totalMonth: "Total Monthly Expense",
      highestCategory: "Highest Category",
      table: {
        date: "Date",
        description: "Description",
        category: "Category",
        amount: "Amount",
      },
    },
    goals: {
      title: "Goals",
      description: "Manage and track your financial goals.",
    },
    common: {
      loading: "Loading your finances...",
      errorTitle: "Oops! Something went wrong",
      errorMessage: "Could not load data. Make sure the backend is running.",
      retry: "Retry",
    },
  },
  es: {
    nav: {
      summary: "Resumen",
      expenses: "Gastos",
      income: "Ingresos",
      goals: "Metas",
    },
    header: {
      language: "Idioma",
      currency: "Moneda",
      settings: "Ajustes",
    },
    summary: {
      balance: "Saldo Total",
      income: "Ingresos",
      expenses: "Gastos",
      netSaving: "Ahorro Neto",
    },
    income: {
      title: "Ingresos",
      description: "Registro y análisis de tus ingresos.",
    },
    expenses: {
      title: "Gastos",
      description: "Gestión de tus gastos detallados.",
      register: "Registrar Gasto",
      totalMonth: "Gasto Total del Mes",
      highestCategory: "Categoría más alta",
      table: {
        date: "Fecha",
        description: "Descripción",
        category: "Categoría",
        amount: "Monto",
      },
    },
    goals: {
      title: "Metas",
      description: "Seguimiento de tus objetivos de ahorro.",
    },
    common: {
      loading: "Cargando tus finanzas...",
      errorTitle: "¡Ups! Algo salió mal",
      errorMessage:
        "No se pudieron cargar los datos. Asegúrate de que el servidor esté funcionando.",
      retry: "Reintentar",
    },
  },
};

export type TranslationKey = keyof typeof translations.en;
