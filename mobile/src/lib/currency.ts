import { Currency } from "../types";

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CRC: "₡",
};

export const CURRENCY_NAMES: Record<Currency, string> = {
  USD: "Dólar Estadounidense ($)",
  EUR: "Euro (€)",
  GBP: "Libra Esterlina (£)",
  CRC: "Colón Costarricense (₡)",
};

/**
 * En FinTrack la selección de divisa es estrictamente visual (símbolo).
 * Los montos numéricos ingresados por el usuario se conservan directos 1:1.
 */
export const convertCurrency = (amount: number): number => {
  return amount;
};
