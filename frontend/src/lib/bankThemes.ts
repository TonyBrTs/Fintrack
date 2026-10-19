import type { BankId, CardNetwork } from "@/types";

export interface BankTheme {
  id: BankId;
  name: string;
  gradientClass: string;
  bgGradient: string;
  accentColor: string;
  textColor: string;
  defaultNetwork: CardNetwork;
  cardLogoText: string;
  chipColor: "gold" | "silver";
  patternType: "waves" | "geometric" | "shimmer" | "brushed" | "minimal";
  badgeBorder?: string;
  bankPhone?: string;
}

export const BANK_THEMES: Record<BankId, BankTheme> = {
  bbva: {
    id: "bbva",
    name: "BBVA",
    gradientClass: "from-[#004481] via-[#043263] to-[#00183F]",
    bgGradient: "linear-gradient(135deg, #004481 0%, #043263 50%, #00183F 100%)",
    accentColor: "#00A9E0",
    textColor: "text-white",
    defaultNetwork: "visa",
    cardLogoText: "BBVA",
    chipColor: "silver",
    patternType: "geometric",
    bankPhone: "55 5226 2663",
  },
  nu: {
    id: "nu",
    name: "Nu (Nubank)",
    gradientClass: "from-[#820AD1] via-[#5C069A] to-[#2D024E]",
    bgGradient: "linear-gradient(135deg, #820AD1 0%, #5C069A 55%, #2D024E 100%)",
    accentColor: "#D199FF",
    textColor: "text-white",
    defaultNetwork: "mastercard",
    cardLogoText: "nu",
    chipColor: "gold",
    patternType: "shimmer",
    bankPhone: "800 099 1133",
  },
  santander: {
    id: "santander",
    name: "Santander",
    gradientClass: "from-[#EC0000] via-[#BA0000] to-[#6B0000]",
    bgGradient: "linear-gradient(135deg, #EC0000 0%, #BA0000 55%, #6B0000 100%)",
    accentColor: "#FF8080",
    textColor: "text-white",
    defaultNetwork: "mastercard",
    cardLogoText: "Santander",
    chipColor: "silver",
    patternType: "waves",
    bankPhone: "55 5169 4300",
  },
  citibanamex: {
    id: "citibanamex",
    name: "Citibanamex",
    gradientClass: "from-[#002D72] via-[#004B93] to-[#001A44]",
    bgGradient: "linear-gradient(135deg, #002D72 0%, #004B93 50%, #001A44 100%)",
    accentColor: "#00A3E0",
    textColor: "text-white",
    defaultNetwork: "mastercard",
    cardLogoText: "citibanamex",
    chipColor: "gold",
    patternType: "waves",
    bankPhone: "55 1226 2639",
  },
  banorte: {
    id: "banorte",
    name: "Banorte",
    gradientClass: "from-[#EB0029] via-[#850014] to-[#1F2421]",
    bgGradient: "linear-gradient(135deg, #EB0029 0%, #850014 50%, #1F2421 100%)",
    accentColor: "#FFFFFF",
    textColor: "text-white",
    defaultNetwork: "visa",
    cardLogoText: "BANORTE",
    chipColor: "silver",
    patternType: "geometric",
    bankPhone: "81 8156 9600",
  },
  mercadopago: {
    id: "mercadopago",
    name: "Mercado Pago",
    gradientClass: "from-[#009EE3] via-[#007BB0] to-[#003B5C]",
    bgGradient: "linear-gradient(135deg, #009EE3 0%, #007BB0 55%, #003B5C 100%)",
    accentColor: "#FFE600",
    textColor: "text-white",
    defaultNetwork: "mastercard",
    cardLogoText: "mercado pago",
    chipColor: "silver",
    patternType: "minimal",
    bankPhone: "800 105 5210",
  },
  amex: {
    id: "amex",
    name: "American Express Platinum",
    gradientClass: "from-[#D6D6D6] via-[#8E8E8E] to-[#424242]",
    bgGradient: "linear-gradient(135deg, #EBEBEB 0%, #A8A8A8 50%, #3D3D3D 100%)",
    accentColor: "#FFFFFF",
    textColor: "text-slate-900",
    defaultNetwork: "amex",
    cardLogoText: "AMERICAN EXPRESS",
    chipColor: "gold",
    patternType: "brushed",
    badgeBorder: "border-slate-400/50",
    bankPhone: "800 504 0400",
  },
  hsbc: {
    id: "hsbc",
    name: "HSBC",
    gradientClass: "from-[#DB0011] via-[#82000A] to-[#1A1A1A]",
    bgGradient: "linear-gradient(135deg, #DB0011 0%, #82000A 50%, #1A1A1A 100%)",
    accentColor: "#FFFFFF",
    textColor: "text-white",
    defaultNetwork: "visa",
    cardLogoText: "HSBC",
    chipColor: "silver",
    patternType: "geometric",
    bankPhone: "55 5721 3390",
  },
  scotiabank: {
    id: "scotiabank",
    name: "Scotiabank",
    gradientClass: "from-[#EC111A] via-[#9E060D] to-[#2B0003]",
    bgGradient: "linear-gradient(135deg, #EC111A 0%, #9E060D 50%, #2B0003 100%)",
    accentColor: "#FFFFFF",
    textColor: "text-white",
    defaultNetwork: "visa",
    cardLogoText: "Scotiabank",
    chipColor: "silver",
    patternType: "minimal",
    bankPhone: "55 5728 1900",
  },
  rappi: {
    id: "rappi",
    name: "RappiCard",
    gradientClass: "from-[#FF441F] via-[#FF6633] to-[#B31D00]",
    bgGradient: "linear-gradient(135deg, #FF441F 0%, #FF6633 50%, #B31D00 100%)",
    accentColor: "#FFF3E0",
    textColor: "text-white",
    defaultNetwork: "visa",
    cardLogoText: "RappiCard",
    chipColor: "gold",
    patternType: "minimal",
    bankPhone: "55 8526 8282",
  },
  stori: {
    id: "stori",
    name: "Stori",
    gradientClass: "from-[#00E599] via-[#00A86B] to-[#063826]",
    bgGradient: "linear-gradient(135deg, #00E599 0%, #00A86B 50%, #063826 100%)",
    accentColor: "#FFFFFF",
    textColor: "text-slate-950",
    defaultNetwork: "mastercard",
    cardLogoText: "stori",
    chipColor: "silver",
    patternType: "shimmer",
    bankPhone: "55 7822 6646",
  },
  klar: {
    id: "klar",
    name: "Klar",
    gradientClass: "from-[#FF3366] via-[#BA133B] to-[#400010]",
    bgGradient: "linear-gradient(135deg, #FF3366 0%, #BA133B 50%, #400010 100%)",
    accentColor: "#FFFFFF",
    textColor: "text-white",
    defaultNetwork: "mastercard",
    cardLogoText: "klar",
    chipColor: "silver",
    patternType: "minimal",
    bankPhone: "55 2629 2797",
  },
  uala: {
    id: "uala",
    name: "Ualá",
    gradientClass: "from-[#FF3A44] via-[#6366F1] to-[#1E1B4B]",
    bgGradient: "linear-gradient(135deg, #FF3A44 0%, #6366F1 50%, #1E1B4B 100%)",
    accentColor: "#FFFFFF",
    textColor: "text-white",
    defaultNetwork: "mastercard",
    cardLogoText: "ualá",
    chipColor: "gold",
    patternType: "waves",
    bankPhone: "800 099 0252",
  },
  revolut: {
    id: "revolut",
    name: "Revolut Metal",
    gradientClass: "from-[#0075FF] via-[#7B2CBF] to-[#10002B]",
    bgGradient: "linear-gradient(135deg, #0075FF 0%, #7B2CBF 50%, #10002B 100%)",
    accentColor: "#00E5FF",
    textColor: "text-white",
    defaultNetwork: "visa",
    cardLogoText: "Revolut",
    chipColor: "silver",
    patternType: "shimmer",
  },
  other: {
    id: "other",
    name: "Obsidian Metal",
    gradientClass: "from-[#232526] via-[#414345] to-[#121314]",
    bgGradient: "linear-gradient(135deg, #232526 0%, #414345 50%, #121314 100%)",
    accentColor: "#C0C0C0",
    textColor: "text-white",
    defaultNetwork: "mastercard",
    cardLogoText: "CARD",
    chipColor: "gold",
    patternType: "brushed",
  },
};

export function getBankTheme(bankId?: string): BankTheme {
  if (!bankId || !(bankId in BANK_THEMES)) {
    return BANK_THEMES.other;
  }
  return BANK_THEMES[bankId as BankId];
}

export const BANK_PRESETS = BANK_THEMES;

