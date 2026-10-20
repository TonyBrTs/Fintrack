"use client";

import React, { useState, useEffect } from "react";
import type { VaultCard } from "@/types";
import { getBankTheme } from "@/lib/bankThemes";
import { maskCardNumber, formatCardNumber, formatIban } from "@/lib/vaultCrypto";
import { toast } from "sonner";
import { Copy, Eye, EyeOff, RotateCw, Building2, Landmark } from "lucide-react";

interface BankCardViewProps {
  card: VaultCard;
  isUnlocked: boolean;
  onEdit?: (card: VaultCard) => void;
  onToggleFavorite?: (id: string) => void;
  className?: string;
  interactive?: boolean;
  flipped?: boolean;
  onFlipChange?: (flipped: boolean) => void;
  focusedField?: string | null;
}

export function BankCardView({
  card,
  isUnlocked,
  className = "",
  interactive = true,
  flipped,
  onFlipChange,
  focusedField,
}: BankCardViewProps) {
  const [isFlipped, setIsFlipped] = useState(flipped ?? false);
  const [showFullNumber, setShowFullNumber] = useState(false);
  const [showCvv, setShowCvv] = useState(false);

  useEffect(() => {
    if (typeof flipped === "boolean") {
      setIsFlipped(flipped);
    }
  }, [flipped]);

  const toggleFlip = (target?: boolean) => {
    const next = typeof target === "boolean" ? target : !isFlipped;
    setIsFlipped(next);
    onFlipChange?.(next);
  };

  const theme = getBankTheme(card.bank);
  const isAmex = card.card_network === "amex";

  const handleCopy = (text: string, label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!text) {
      toast.error(`No hay ${label} registrado`);
      return;
    }
    navigator.clipboard.writeText(text.replace(/\s+/g, ""));
    toast.success(`${label} copiado al portapapeles`, {
      description: text,
      duration: 2500,
    });
  };

  if (card.card_type === "account") {
    const ibanValue = card.iban || card.clabe || "";
    const formattedIban = ibanValue ? formatIban(ibanValue) : "CR00 0000 0000 0000 0000 00";

    return (
      <div
        className={`relative select-none w-full max-w-[420px] mx-auto ${className}`}
        style={{ minHeight: "220px" }}
      >
        <div className="relative w-full aspect-[1.586/1] rounded-2xl bg-slate-900 border border-slate-700/80 shadow-xl overflow-hidden flex flex-col justify-between p-4 sm:p-5 text-white">
          <div
            className="absolute top-0 left-0 right-0 h-1.5"
            style={{ background: theme.bgGradient }}
          />
          <div
            className="absolute -right-16 -top-16 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: theme.accentColor || "#3B82F6" }}
          />

          <div className="relative z-10 flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-white/15 shadow-xs"
                style={{ background: theme.bgGradient }}
              >
                <Landmark size={17} className="text-white" />
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-black tracking-tight text-white block truncate">
                  {theme.name}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
                  {card.alias || "Cuenta Bancaria"}
                </span>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-200 shrink-0 font-mono">
              {card.currency === "USD" ? "USD $" : "CRC ₡"}
            </span>
          </div>

          <div className="relative z-10 space-y-2 my-auto py-1">
            <div
              className={`p-2.5 rounded-xl bg-slate-950/80 border transition-all ${
                focusedField === "iban"
                  ? "border-blue-500 ring-2 ring-blue-500/30"
                  : "border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Cuenta IBAN
                </span>
                {ibanValue && (
                  <button
                    type="button"
                    onClick={(e) => handleCopy(ibanValue, "Cuenta IBAN", e)}
                    className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Copy size={10} />
                    <span>Copiar</span>
                  </button>
                )}
              </div>
              <p className="font-mono text-xs sm:text-sm font-bold tracking-wider text-emerald-400 truncate">
                {formattedIban}
              </p>
            </div>

            {card.account_number && (
              <div
                className={`px-2.5 py-1.5 rounded-lg bg-slate-950/50 border flex items-center justify-between transition-all ${
                  focusedField === "accountNumber"
                    ? "border-blue-500 ring-2 ring-blue-500/30"
                    : "border-slate-800/80"
                }`}
              >
                <div className="min-w-0">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block">
                    Cuenta Cliente
                  </span>
                  <span className="font-mono text-[11px] font-bold text-slate-200 truncate block">
                    {card.account_number}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleCopy(card.account_number || "", "Número de Cuenta", e)}
                  className="text-slate-400 hover:text-white p-1 cursor-pointer shrink-0"
                  title="Copiar cuenta"
                >
                  <Copy size={11} />
                </button>
              </div>
            )}
          </div>

          <div className="relative z-10 flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px]">
            <div
              className={`min-w-0 truncate rounded transition-all ${
                focusedField === "cardholder" ? "text-blue-400" : "text-slate-300"
              }`}
            >
              <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold mr-1.5">
                Titular:
              </span>
              <span className="font-semibold uppercase tracking-wide">
                {card.cardholder_name || "TITULAR DE LA CUENTA"}
              </span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
              <Building2 size={11} />
              Cuenta
            </span>
          </div>
        </div>
      </div>
    );
  }

  const displayNumber =
    showFullNumber && isUnlocked
      ? formatCardNumber(card.card_number)
      : maskCardNumber(card.card_number, card.last4);

  return (
    <div
      className={`relative select-none perspective-[1200px] w-full max-w-[420px] mx-auto ${className}`}
      style={{ minHeight: "220px" }}
    >
      <div
        className={`relative w-full aspect-[1.586/1] transition-transform duration-700 [transform-style:preserve-3d] cursor-pointer rounded-2xl shadow-xl hover:shadow-2xl ${
          isFlipped ? "[transform:rotateY(180deg)]" : ""
        }`}
        onClick={() => interactive && toggleFlip()}
      >
        <div
          className="absolute inset-0 rounded-2xl p-4 sm:p-5 flex flex-col justify-between overflow-hidden [backface-visibility:hidden] border border-white/20 shadow-inner text-white"
          style={{ background: theme.bgGradient }}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/20 pointer-events-none rounded-2xl" />

          {theme.patternType === "geometric" && (
            <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full border-[28px] border-white/10 pointer-events-none transform rotate-45" />
          )}
          {theme.patternType === "waves" && (
            <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full border-[40px] border-white/5 pointer-events-none" />
          )}
          {theme.patternType === "shimmer" && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 pointer-events-none" />
          )}
          {theme.patternType === "brushed" && (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/15 via-transparent to-transparent pointer-events-none" />
          )}

          <div className="relative z-10 flex items-start justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-black tracking-widest uppercase text-base sm:text-lg drop-shadow-sm font-sans leading-tight">
                  {theme.cardLogoText}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold bg-white/20 backdrop-blur-xs tracking-wider">
                  {card.currency === "USD" ? "USD $" : "CRC ₡"}
                </span>
              </div>
              <span className="text-[9px] uppercase tracking-wider font-semibold opacity-85 mt-0.5">
                {card.card_type === "credit" ? "Crédito" : "Débito"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 opacity-80 rotate-90"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M8.5 16.5a5 5 0 0 1 0-7" />
                <path d="M12 19a8.5 8.5 0 0 0 0-14" />
                <path d="M15.5 21.5a12 12 0 0 0 0-19" />
              </svg>

              {interactive && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFlipped(true);
                  }}
                  className="w-7 h-7 rounded-full bg-black/25 hover:bg-black/40 flex items-center justify-center text-white/90 transition backdrop-blur-xs cursor-pointer"
                  title="Ver reverso"
                >
                  <RotateCw size={13} />
                </button>
              )}
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between mt-1">
            <div
              className={`w-10 h-7 sm:w-11 sm:h-8 rounded-md relative overflow-hidden border shadow-inner flex items-center justify-center ${
                theme.chipColor === "gold"
                  ? "bg-gradient-to-br from-[#FFE599] via-[#F3C64F] to-[#C4922A] border-[#D4A338]"
                  : "bg-gradient-to-br from-[#E2E8F0] via-[#CBD5E1] to-[#94A3B8] border-[#94A3B8]"
              }`}
            >
              <div className="w-full h-[1px] bg-black/30 absolute" />
              <div className="h-full w-[1px] bg-black/30 absolute" />
              <div className="w-5 h-4 border border-black/25 rounded-xs" />
            </div>

            <button
              type="button"
              onClick={(e) => handleCopy(card.card_number, "Número de Tarjeta", e)}
              className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] font-bold bg-white/15 hover:bg-white/25 backdrop-blur-xs border border-white/20 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              title="Copiar número"
            >
              <Copy size={11} />
              <span>Copiar</span>
            </button>
          </div>

          <div
            className={`relative z-10 mt-1 flex items-center justify-between rounded-lg transition-all duration-300 ${
              focusedField === "cardNumber"
                ? "bg-white/20 ring-2 ring-white/80 px-2 py-0.5 -mx-1 shadow-sm"
                : ""
            }`}
          >
            <span
              className={`font-mono text-sm sm:text-base md:text-lg tracking-[0.16em] sm:tracking-[0.2em] font-semibold drop-shadow-md truncate ${
                isAmex ? "tracking-[0.2em] sm:tracking-[0.25em]" : ""
              }`}
            >
              {displayNumber}
            </span>

            {isUnlocked && card.card_number && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFullNumber(!showFullNumber);
                }}
                className="p-1 rounded text-white/70 hover:text-white transition cursor-pointer"
              >
                {showFullNumber ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            )}
          </div>

          <div className="relative z-10 flex items-end justify-between pt-1">
            <div
              className={`flex flex-col max-w-[62%] min-w-0 rounded-lg transition-all duration-300 ${
                focusedField === "cardholder"
                  ? "bg-white/20 ring-2 ring-white/80 px-1.5 py-0.5 -mx-1"
                  : ""
              }`}
            >
              <span className="text-[8px] uppercase tracking-widest text-white/70 font-bold">
                Titular
              </span>
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider truncate font-sans drop-shadow-xs">
                {card.cardholder_name || "TITULAR REGISTRADO"}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {card.expiration_date && (
                <div
                  className={`flex flex-col text-right rounded-lg transition-all duration-300 ${
                    focusedField === "exp"
                      ? "bg-white/20 ring-2 ring-white/80 px-1.5 py-0.5 -mx-1"
                      : ""
                  }`}
                >
                  <span className="text-[8px] uppercase tracking-widest text-white/70 font-bold">
                    Vence
                  </span>
                  <span className="font-mono text-[11px] sm:text-xs font-semibold tracking-wider">
                    {card.expiration_date}
                  </span>
                </div>
              )}

              <div className="shrink-0 flex items-center justify-center">
                <NetworkLogo network={card.card_network} />
              </div>
            </div>
          </div>
        </div>

        <div
          className="absolute inset-0 rounded-2xl pt-3 sm:pt-4 pb-3 sm:pb-5 flex flex-col justify-between overflow-hidden [transform:rotateY(180deg)] [backface-visibility:hidden] border border-white/20 shadow-inner text-white"
          style={{ background: theme.bgGradient }}
        >
          <div className="px-4 sm:px-5 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 truncate max-w-[75%]">
              {card.alias}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFlip(false);
              }}
              className="w-6 h-6 rounded-full bg-black/25 hover:bg-black/40 flex items-center justify-center text-white/90 transition backdrop-blur-xs cursor-pointer"
              title="Voltear al frente"
            >
              <RotateCw size={12} />
            </button>
          </div>

          <div className="w-full h-8 sm:h-10 bg-slate-950 mt-1 shadow-inner relative">
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-slate-900 to-black/80" />
          </div>

          <div className="px-4 sm:px-5 my-0.5">
            <div className="flex items-center justify-end gap-2">
              <div className="flex-1 h-6 sm:h-7 bg-slate-100 rounded-sm flex items-center px-2 text-slate-500 font-mono text-[8px] sm:text-[9px] italic border border-slate-300 truncate">
                Firma Autorizada
              </div>
              <div
                className={`flex items-center gap-1.5 bg-white text-slate-900 px-2 h-6 sm:h-7 rounded-sm border font-mono text-xs font-bold transition-all duration-300 ${
                  focusedField === "cvv"
                    ? "ring-2 ring-amber-400 border-amber-400 shadow-md shadow-amber-400/40 scale-105"
                    : "border-slate-300 shadow-xs"
                }`}
              >
                <span className="text-[9px] text-slate-600 font-sans">CVV</span>
                <span className="tracking-widest">
                  {(showCvv || focusedField === "cvv") && isUnlocked
                    ? card.cvv || "•••"
                    : "•••"}
                </span>
                {isUnlocked && card.cvv && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCvv(!showCvv);
                    }}
                    className="text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    {showCvv ? <EyeOff size={11} /> : <Eye size={11} />}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-5 flex items-end justify-between text-[10px]">
            <div className="flex flex-col gap-0.5 max-w-[72%] min-w-0">
              {(card.iban || card.clabe) && (
                <div className="flex items-center gap-1">
                  <span className="text-[8px] uppercase tracking-wider text-white/70 font-bold shrink-0">
                    IBAN:
                  </span>
                  <span className="font-mono text-[9px] font-bold truncate">
                    {card.iban || card.clabe}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleCopy(card.iban || card.clabe || "", "IBAN", e)}
                    className="text-white/80 hover:text-white shrink-0 cursor-pointer"
                  >
                    <Copy size={9} />
                  </button>
                </div>
              )}
              {card.account_number && (
                <div className="flex items-center gap-1">
                  <span className="text-[8px] uppercase tracking-wider text-white/70 font-bold shrink-0">
                    CTA:
                  </span>
                  <span className="font-mono text-[9px] font-bold truncate">
                    {card.account_number}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleCopy(card.account_number || "", "Cuenta", e)}
                    className="text-white/80 hover:text-white shrink-0 cursor-pointer"
                  >
                    <Copy size={9} />
                  </button>
                </div>
              )}
            </div>

            <div className="shrink-0">
              <NetworkLogo network={card.card_network} size="sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NetworkLogo({
  network,
  size = "md",
}: {
  network: string;
  size?: "sm" | "md";
}) {
  const isSm = size === "sm";

  if (network === "visa") {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-md bg-white/95 px-1.5 py-0.5 shadow-xs ${
          isSm ? "h-5 w-9" : "h-6 w-11"
        }`}
        title="Visa"
      >
        <svg
          viewBox="0 0 256 83"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M108.234 1.586L86.792 81.345H66.058L87.498 1.586H108.234ZM195.887 53.078L206.827 22.956L213.128 53.078H195.887ZM224.892 81.345H244.022L227.324 1.586H209.687C205.718 1.586 202.371 3.896 200.892 7.452L170.025 81.345H191.693L196.002 69.431H222.495L224.892 81.345ZM171.213 55.335C171.302 34.298 142.126 33.139 142.327 23.702C142.393 20.844 145.109 17.813 151.053 17.037C154.004 16.652 162.138 16.357 171.368 20.614L174.996 3.681C170.025 1.879 163.635 0.144 155.702 0.144C135.318 0.144 120.971 10.979 120.851 26.501C120.719 37.981 131.093 44.382 138.902 48.196C146.925 52.104 149.619 54.614 149.588 58.128C149.532 63.486 143.168 65.853 137.234 65.946C126.867 66.107 120.859 63.149 116.059 60.916L112.313 78.414C117.131 80.625 126.028 82.548 135.258 82.644C156.935 82.644 171.132 71.936 171.213 55.335ZM85.647 1.586L52.192 81.345H30.395L13.918 17.653C12.916 13.719 12.043 12.275 8.995 10.619C4.008 7.916 -4.212 5.383 -11.458 3.816L-10.966 1.586H24.161C28.637 1.586 32.668 4.568 33.684 9.726L42.385 55.908L63.854 1.586H85.647Z"
            fill="#1434CB"
          />
          <path
            d="M33.684 9.726C32.668 4.568 28.637 1.586 24.161 1.586H0.42L0 3.816C18.374 8.508 30.521 19.832 35.534 33.438L33.684 9.726Z"
            fill="#F7B600"
          />
        </svg>
      </div>
    );
  }

  if (network === "mastercard") {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-md bg-slate-950/40 backdrop-blur-xs px-1.5 py-0.5 border border-white/15 ${
          isSm ? "h-5 w-9" : "h-6 w-11"
        }`}
        title="Mastercard"
      >
        <svg
          viewBox="0 0 152 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="52" cy="50" r="44" fill="#EB001B" />
          <circle cx="100" cy="50" r="44" fill="#F79E1B" />
          <path
            d="M76 15.36C86.67 23.43 93.56 36.21 93.56 50C93.56 63.79 86.67 76.57 76 84.64C65.33 76.57 58.44 63.79 58.44 50C58.44 36.21 65.33 23.43 76 15.36Z"
            fill="#FF5F00"
          />
        </svg>
      </div>
    );
  }

  if (network === "amex") {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-md bg-[#016FD0] border border-white/40 shadow-xs overflow-hidden ${
          isSm ? "h-5 w-9" : "h-6 w-11"
        }`}
        title="American Express"
      >
        <svg
          viewBox="0 0 120 76"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="120" height="76" rx="8" fill="#016FD0" />
          <path
            d="M17.2 28L9 48H15.2L16.7 44H24.3L25.8 48H32.3L24.1 28H17.2ZM20.5 33.8L22.7 39.5H18.3L20.5 33.8ZM34.5 28V48H40.1V35.6L45.4 48H49.8L55.1 35.6V48H60.7V28H52.4L47.6 39.4L42.8 28H34.5ZM64.5 28V48H81.3V43.2H70.2V40.2H80.9V35.6H70.2V32.8H81.3V28H64.5ZM83.5 28L91.1 38L83.2 48H90.4L94.8 42.1L99.2 48H106.4L98.5 38L106.1 28H99L94.8 33.7L90.6 28H83.5Z"
            fill="white"
          />
        </svg>
      </div>
    );
  }

  if (network === "carnet") {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-md bg-red-600 text-white font-sans font-black tracking-wider border border-white/30 ${
          isSm ? "h-5 px-1.5 text-[7px]" : "h-6 px-2 text-[8px]"
        }`}
      >
        CARNET
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center rounded-md border border-white/40 font-bold tracking-widest text-white/80 ${
        isSm ? "h-5 px-1.5 text-[7px]" : "h-6 px-2 text-[8px]"
      }`}
    >
      CARD
    </div>
  );
}
