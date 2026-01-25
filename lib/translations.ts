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
    },
    goals: {
      title: "Goals",
      description: "Manage and track your financial goals.",
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
    },
    goals: {
      title: "Metas",
      description: "Seguimiento de tus objetivos de ahorro.",
    },
  },
};

export type TranslationKey = keyof typeof translations.en;
