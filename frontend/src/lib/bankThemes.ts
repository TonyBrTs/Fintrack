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
  bac: {
    id: "bac",
    name: "BAC Credomatic",
    gradientClass: "from-[#E30613] via-[#B30006] to-[#5A0004]",
    bgGradient: "linear-gradient(135deg, #E30613 0%, #B30006 55%, #4A0003 100%)",
    accentColor: "#FFFFFF",
    textColor: "text-white",
    defaultNetwork: "visa",
    cardLogoText: "BAC",
    chipColor: "silver",
    patternType: "geometric",
    bankPhone: "2295-9898",
  },
  bncr: {
    id: "bncr",
    name: "Banco Nacional (BNCR)",
    gradientClass: "from-[#002F6C] via-[#001E47] to-[#001026]",
    bgGradient: "linear-gradient(135deg, #002F6C 0%, #001E47 50%, #000F24 100%)",
    accentColor: "#F2A900",
    textColor: "text-white",
    defaultNetwork: "visa",
    cardLogoText: "BN",
    chipColor: "gold",
    patternType: "waves",
    bankPhone: "2212-2000",
  },
  bcr: {
    id: "bcr",
    name: "Banco de Costa Rica (BCR)",
    gradientClass: "from-[#0033A0] via-[#002166] to-[#001133]",
    bgGradient: "linear-gradient(135deg, #0033A0 0%, #001F61 55%, #D22630 140%)",
    accentColor: "#D22630",
    textColor: "text-white",
    defaultNetwork: "mastercard",
    cardLogoText: "BCR",
    chipColor: "silver",
    patternType: "shimmer",
    bankPhone: "2211-1111",
  },
  popular: {
    id: "popular",
    name: "Banco Popular",
    gradientClass: "from-[#007A3D] via-[#005229] to-[#002E17]",
    bgGradient: "linear-gradient(135deg, #007A3D 0%, #004D26 60%, #002914 100%)",
    accentColor: "#F9A01B",
    textColor: "text-white",
    defaultNetwork: "visa",
    cardLogoText: "POPULAR",
    chipColor: "gold",
    patternType: "waves",
    bankPhone: "2202-2020",
  },
  scotiabank: {
    id: "scotiabank",
    name: "Scotiabank Costa Rica",
    gradientClass: "from-[#ED111B] via-[#9E0007] to-[#470003]",
    bgGradient: "linear-gradient(135deg, #ED111B 0%, #9E0007 65%, #3B0002 100%)",
    accentColor: "#FFFFFF",
    textColor: "text-white",
    defaultNetwork: "mastercard",
    cardLogoText: "Scotiabank",
    chipColor: "silver",
    patternType: "minimal",
    bankPhone: "8001-726842",
  },
  davivienda: {
    id: "davivienda",
    name: "Davivienda",
    gradientClass: "from-[#ED1C24] via-[#AA0E14] to-[#450508]",
    bgGradient: "linear-gradient(135deg, #ED1C24 0%, #A30D13 60%, #3D0407 100%)",
    accentColor: "#FFCC00",
    textColor: "text-white",
    defaultNetwork: "mastercard",
    cardLogoText: "DAVIVIENDA",
    chipColor: "silver",
    patternType: "geometric",
    bankPhone: "2287-1111",
  },
  promerica: {
    id: "promerica",
    name: "Banco Promerica",
    gradientClass: "from-[#008542] via-[#005A2C] to-[#002E17]",
    bgGradient: "linear-gradient(135deg, #008542 0%, #005A2C 55%, #002E17 100%)",
    accentColor: "#90EE90",
    textColor: "text-white",
    defaultNetwork: "visa",
    cardLogoText: "PROMERICA",
    chipColor: "gold",
    patternType: "shimmer",
    bankPhone: "2519-8090",
  },
  lafise: {
    id: "lafise",
    name: "Banco LAFISE",
    gradientClass: "from-[#006837] via-[#004726] to-[#002916]",
    bgGradient: "linear-gradient(135deg, #006837 0%, #004524 55%, #001F10 100%)",
    accentColor: "#D4AF37",
    textColor: "text-white",
    defaultNetwork: "visa",
    cardLogoText: "LAFISE",
    chipColor: "gold",
    patternType: "brushed",
    bankPhone: "8000-523473",
  },
  coopealianza: {
    id: "coopealianza",
    name: "Coopealianza",
    gradientClass: "from-[#004B87] via-[#002F54] to-[#00192D]",
    bgGradient: "linear-gradient(135deg, #004B87 0%, #002D52 60%, #F37021 140%)",
    accentColor: "#F37021",
    textColor: "text-white",
    defaultNetwork: "visa",
    cardLogoText: "COOPEALIANZA",
    chipColor: "silver",
    patternType: "geometric",
    bankPhone: "2785-3000",
  },
  coopenae: {
    id: "coopenae",
    name: "Coopenae",
    gradientClass: "from-[#00A3E0] via-[#00629B] to-[#003B5C]",
    bgGradient: "linear-gradient(135deg, #00A3E0 0%, #005F96 55%, #002B45 100%)",
    accentColor: "#FFFFFF",
    textColor: "text-white",
    defaultNetwork: "mastercard",
    cardLogoText: "COOPENAE",
    chipColor: "silver",
    patternType: "waves",
    bankPhone: "2257-9060",
  },
  wink: {
    id: "wink",
    name: "Wink (Neobanco)",
    gradientClass: "from-[#6C5CE7] via-[#5241D9] to-[#2B1A66]",
    bgGradient: "linear-gradient(135deg, #6C5CE7 0%, #5241D9 50%, #201350 100%)",
    accentColor: "#FF7675",
    textColor: "text-white",
    defaultNetwork: "visa",
    cardLogoText: "wink",
    chipColor: "silver",
    patternType: "shimmer",
    bankPhone: "2257-9060",
  },
  multimoney: {
    id: "multimoney",
    name: "MultiMoney",
    gradientClass: "from-[#0F172A] via-[#1E293B] to-[#020617]",
    bgGradient: "linear-gradient(135deg, #0F172A 0%, #1E293B 55%, #020617 100%)",
    accentColor: "#84CC16",
    textColor: "text-white",
    defaultNetwork: "visa",
    cardLogoText: "multimoney",
    chipColor: "silver",
    patternType: "geometric",
    bankPhone: "2209-1000",
  },
  other: {
    id: "other",
    name: "Obsidian Metal (Otro)",
    gradientClass: "from-[#232526] via-[#414345] to-[#121314]",
    bgGradient: "linear-gradient(135deg, #232526 0%, #3a3c3e 50%, #101112 100%)",
    accentColor: "#C0C0C0",
    textColor: "text-white",
    defaultNetwork: "visa",
    cardLogoText: "CARD",
    chipColor: "gold",
    patternType: "brushed",
    bankPhone: "",
  },
};

export function getBankTheme(bankId?: string): BankTheme {
  if (!bankId || !(bankId in BANK_THEMES)) {
    return BANK_THEMES.bac; // Default to BAC for Costa Rica
  }
  return BANK_THEMES[bankId as BankId];
}

export const BANK_PRESETS = BANK_THEMES;
