"use client";

import React from "react";
import {
  Banknote,
  BookOpen,
  Briefcase,
  Bus,
  Car,
  Coffee,
  Coins,
  CreditCard,
  Dumbbell,
  Film,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Laptop,
  MoreHorizontal,
  Music,
  PawPrint,
  PiggyBank,
  Plane,
  Receipt,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Tag,
  Target,
  TrendingUp,
  Utensils,
  Wifi,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn, getCategoryStyle } from "@/lib/utils";
import type { Category } from "@/types";

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  utensils: Utensils,
  "shopping-cart": ShoppingCart,
  coffee: Coffee,
  car: Car,
  bus: Bus,
  fuel: Fuel,
  zap: Zap,
  wifi: Wifi,
  home: Home,
  film: Film,
  "gamepad-2": Gamepad2,
  music: Music,
  "heart-pulse": HeartPulse,
  dumbbell: Dumbbell,
  target: Target,
  "piggy-bank": PiggyBank,
  briefcase: Briefcase,
  laptop: Laptop,
  "trending-up": TrendingUp,
  gift: Gift,
  coins: Coins,
  banknote: Banknote,
  "shopping-bag": ShoppingBag,
  shirt: Shirt,
  "graduation-cap": GraduationCap,
  "book-open": BookOpen,
  plane: Plane,
  "paw-print": PawPrint,
  smartphone: Smartphone,
  "credit-card": CreditCard,
  wrench: Wrench,
  receipt: Receipt,
  "more-horizontal": MoreHorizontal,
  tag: Tag,
};

export const CATEGORY_ICON_OPTIONS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "utensils", label: "Comida", icon: Utensils },
  { key: "shopping-cart", label: "Super", icon: ShoppingCart },
  { key: "coffee", label: "Café", icon: Coffee },
  { key: "car", label: "Auto", icon: Car },
  { key: "fuel", label: "Gasolina", icon: Fuel },
  { key: "home", label: "Hogar", icon: Home },
  { key: "zap", label: "Servicios", icon: Zap },
  { key: "wifi", label: "Internet", icon: Wifi },
  { key: "film", label: "Ocio", icon: Film },
  { key: "gamepad-2", label: "Juegos", icon: Gamepad2 },
  { key: "heart-pulse", label: "Salud", icon: HeartPulse },
  { key: "dumbbell", label: "Gym", icon: Dumbbell },
  { key: "shopping-bag", label: "Compras", icon: ShoppingBag },
  { key: "shirt", label: "Ropa", icon: Shirt },
  { key: "graduation-cap", label: "Estudio", icon: GraduationCap },
  { key: "plane", label: "Viajes", icon: Plane },
  { key: "paw-print", label: "Mascotas", icon: PawPrint },
  { key: "smartphone", label: "Tech", icon: Smartphone },
  { key: "briefcase", label: "Trabajo", icon: Briefcase },
  { key: "laptop", label: "Freelance", icon: Laptop },
  { key: "trending-up", label: "Inversión", icon: TrendingUp },
  { key: "banknote", label: "Efectivo", icon: Banknote },
  { key: "gift", label: "Regalo", icon: Gift },
  { key: "target", label: "Metas", icon: Target },
];

const KEYWORD_ICON_RULES: Array<[RegExp, string]> = [
  [/aliment|comida|restauran|almuerz|cena|desayun|pizza|hamburg|uber\s*eats/i, "utensils"],
  [/super|mercado|abarrot|despensa|walmart|automercado|masxmenos|pricesmart/i, "shopping-cart"],
  [/caf[eé]|starbucks|panader/i, "coffee"],
  [/gasolin|combustib|di[eé]sel/i, "fuel"],
  [/bus|tren|metro|pasaje/i, "bus"],
  [/transpor|auto|carro|uber|didi|taxi|parqueo|peaje|veh[ií]cul/i, "car"],
  [/alquiler|renta|casa|hogar|hipoteca|condomin|mueble/i, "home"],
  [/internet|wifi|tel[eé]fon|celular|kolbi|claro|liberty/i, "wifi"],
  [/servici|luz|agua|electric|recibo|factura/i, "zap"],
  [/netflix|spotify|disney|cine|entreten|pel[ií]cul|stream/i, "film"],
  [/juego|gaming|steam|xbox|playstation|nintendo/i, "gamepad-2"],
  [/m[uú]sica|concierto/i, "music"],
  [/salud|m[eé]dic|farmac|dentist|hospital|cl[ií]nic|seguro/i, "heart-pulse"],
  [/gym|gimnasio|deporte|fitness|crossfit/i, "dumbbell"],
  [/ropa|zapato|tenis|moda|vestid/i, "shirt"],
  [/compra|amazon|tienda|mall/i, "shopping-bag"],
  [/educa|curso|universid|ucr|coleg|matr[ií]cul/i, "graduation-cap"],
  [/libro|lectura/i, "book-open"],
  [/viaj|vuelo|hotel|vacacion|turismo/i, "plane"],
  [/mascot|perro|gato|veterinar/i, "paw-print"],
  [/tech|tecnolog|software|suscrip|app|icloud|google/i, "smartphone"],
  [/reparac|mantenim|taller|ferreter/i, "wrench"],
  [/tarjeta|cr[eé]dito|pr[eé]stamo|banco/i, "credit-card"],
  [/meta|ahorr|objetiv|fondo/i, "target"],
  [/salari|sueldo|n[oó]mina|quincena|pago|planilla/i, "briefcase"],
  [/freelance|proyecto|consultor|cliente|dise[nñ]o|desarroll/i, "laptop"],
  [/inversi[oó]n|dividendo|inter[eé]s|bolsa|cripto|rendim/i, "trending-up"],
  [/regalo|bono|aguinaldo|premio/i, "gift"],
  [/venta|negocio|comisi[oó]n|efectivo|reembolso/i, "banknote"],
  [/otro/i, "more-horizontal"],
];

/**
 * Resolves the best icon key for a category using:
 * 1. Explicit icon key stored on the user's Category object (if not generic "tag")
 * 2. Smart keyword inference from the category name
 * 3. Clean fallback ("tag")
 */
export function resolveCategoryIconKey(
  categoryName?: string | null,
  categories?: Array<Pick<Category, "name" | "icon">> | Category[],
  explicitIcon?: string
): string {
  if (explicitIcon && CATEGORY_ICON_MAP[explicitIcon]) {
    return explicitIcon;
  }

  const normalized = categoryName?.trim().toLowerCase() || "";

  if (normalized && categories && Array.isArray(categories)) {
    const matched = categories.find((c) => c.name.trim().toLowerCase() === normalized);
    if (matched?.icon && matched.icon !== "tag" && CATEGORY_ICON_MAP[matched.icon]) {
      return matched.icon;
    }
  }

  if (normalized) {
    for (const [pattern, iconKey] of KEYWORD_ICON_RULES) {
      if (pattern.test(normalized)) {
        return iconKey;
      }
    }
  }

  return "tag";
}

interface CategoryIconProps {
  category: string;
  categories?: Array<Pick<Category, "name" | "color" | "icon">> | Category[];
  iconKey?: string;
  size?: number;
  className?: string;
}

export function CategoryIcon({
  category,
  categories,
  iconKey,
  size = 16,
  className,
}: CategoryIconProps) {
  const key = resolveCategoryIconKey(category, categories, iconKey);
  const iconComponent = CATEGORY_ICON_MAP[key] || Tag;
  return React.createElement(iconComponent, {
    size,
    strokeWidth: 2.1,
    "aria-hidden": true,
    className: cn("shrink-0", className),
  });
}

interface CategoryAvatarProps {
  category: string;
  categories?: Array<Pick<Category, "name" | "color" | "icon">> | Category[];
  iconKey?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CategoryAvatar({
  category,
  categories,
  iconKey,
  size = "md",
  className,
}: CategoryAvatarProps) {
  const style = getCategoryStyle(category, categories);
  const dimensions = {
    sm: "w-8 h-8 rounded-lg",
    md: "w-10 h-10 rounded-xl",
    lg: "w-11 h-11 rounded-2xl",
  }[size];

  const iconSize = {
    sm: 15,
    md: 18,
    lg: 20,
  }[size];

  return (
    <div
      className={cn(
        "flex items-center justify-center shrink-0 border shadow-2xs transition-colors",
        dimensions,
        style.bg,
        style.text,
        style.border,
        className
      )}
    >
      <CategoryIcon category={category} categories={categories} iconKey={iconKey} size={iconSize} />
    </div>
  );
}
