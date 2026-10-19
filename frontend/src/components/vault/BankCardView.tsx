"use client";

import React, { useState, useEffect } from "react";
import type { VaultCard } from "@/types";
import { getBankTheme } from "@/lib/bankThemes";
import { maskCardNumber, formatCardNumber } from "@/lib/vaultCrypto";
import { toast } from "sonner";
import { Copy, Eye, EyeOff, RotateCw, Phone, ShieldCheck, Star } from "lucide-react";

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
  onEdit,
  onToggleFavorite,
  className = "",
  interactive = true,
  flipped,
  onFlipChange,
  focusedField,
}: BankCardViewProps) {
  const [isFlipped, setIsFlipped] = useState(flipped ?? false);
  const [showFullNumber, setShowFullNumber] = useState(false);
  const [showCvv, setShowCvv] = useState(false);

  // Sync external flipped prop
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
    toast.success(`${label} copiada al portapapeles`, {
      description: text,
      duration: 2500,
    });
  };

  const displayNumber = showFullNumber && isUnlocked
    ? formatCardNumber(card.card_number)
    : maskCardNumber(card.card_number, card.last4);

  return (
    <div
      className={`relative select-none perspective-[1200px] w-full max-w-[400px] mx-auto ${className}`}
      style={{ minHeight: "220px" }}
    >
      <div
        className={`relative w-full aspect-[1.586/1] transition-transform duration-700 [transform-style:preserve-3d] cursor-pointer rounded-2xl shadow-xl hover:shadow-2xl ${
          isFlipped ? "[transform:rotateY(180deg)]" : ""
        }`}
        onClick={() => interactive && toggleFlip()}
      >
        {/* ================= CARD FRONT ================= */}
        <div
          className={`absolute inset-0 rounded-2xl p-4 sm:p-5 flex flex-col justify-between overflow-hidden [backface-visibility:hidden] border border-white/20 shadow-inner text-white`}
          style={{ background: theme.bgGradient }}
        >
          {/* Subtle Ambient Glass / Gloss Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/20 pointer-events-none rounded-2xl" />

          {/* Bank Aesthetic Vector Background Patterns */}
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

          {/* Top Bar: Bank Logo & Chip / NFC */}
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
                {card.card_type === "credit"
                  ? "Crédito"
                  : card.card_type === "debit"
                  ? "Débito"
                  : "Cuenta"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Contactless NFC Waves Icon */}
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

              {/* Flip Button */}
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

          {/* Middle: EMV Smart Chip */}
          <div className="relative z-10 flex items-center justify-between mt-1">
            {/* Realistic EMV Metallic Chip */}
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

            {/* Quick Copy Card Number Button */}
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

          {/* Card Number */}
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

          {/* Bottom Row: Holder, Expiration, Brand Network */}
          <div className="relative z-10 flex items-end justify-between pt-1">
            <div
              className={`flex flex-col max-w-[65%] min-w-0 rounded-lg transition-all duration-300 ${
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

              {/* Payment Network Brand Badge */}
              <div className="shrink-0 flex items-center justify-center">
                <NetworkLogo network={card.card_network} />
              </div>
            </div>
          </div>
        </div>

        {/* ================= CARD BACK ================= */}
        <div
          className={`absolute inset-0 rounded-2xl pt-3 sm:pt-4 pb-3 sm:pb-5 flex flex-col justify-between overflow-hidden [transform:rotateY(180deg)] [backface-visibility:hidden] border border-white/20 shadow-inner text-white`}
          style={{ background: theme.bgGradient }}
        >
          {/* Top Bar on Reverse */}
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

          {/* Magnetic Stripe (Realistic standard dark band) */}
          <div className="w-full h-8 sm:h-10 bg-slate-950 mt-1 shadow-inner relative">
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-slate-900 to-black/80" />
          </div>

          {/* Signature Strip & CVV Box */}
          <div className="px-4 sm:px-5 my-0.5">
            <div className="flex items-center justify-end gap-2">
              <div className="flex-1 h-6 sm:h-7 bg-slate-100 rounded-sm flex items-center px-2 text-slate-400 font-mono text-[8px] sm:text-[9px] italic border border-slate-300 truncate">
                Firma Autorizada
              </div>
              <div
                className={`flex items-center gap-1.5 bg-white text-slate-900 px-2 h-6 sm:h-7 rounded-sm border font-mono text-xs font-bold transition-all duration-300 ${
                  focusedField === "cvv"
                    ? "ring-2 ring-amber-400 border-amber-400 shadow-md shadow-amber-400/40 scale-105"
                    : "border-slate-300 shadow-xs"
                }`}
              >
                <span className="text-[9px] text-slate-500 font-sans">CVV</span>
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

          {/* Extra Account Data & Costa Rica IBAN / SINPE */}
          <div className="px-4 sm:px-5 flex items-end justify-between text-[10px]">
            <div className="flex flex-col gap-0.5 max-w-[70%] min-w-0">
              {(card.iban || card.clabe) && (
                <div className="flex items-center gap-1">
                  <span className="text-[8px] uppercase tracking-wider text-white/70 font-bold shrink-0">IBAN:</span>
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
              {card.sinpe_movil && (
                <div className="flex items-center gap-1">
                  <span className="text-[8px] uppercase tracking-wider text-white/70 font-bold shrink-0">SINPE:</span>
                  <span className="font-mono text-[9px] font-bold text-amber-300 truncate">
                    {card.sinpe_movil}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleCopy(card.sinpe_movil || "", "SINPE Móvil", e)}
                    className="text-white/80 hover:text-white shrink-0 cursor-pointer"
                  >
                    <Copy size={9} />
                  </button>
                </div>
              )}
              {(card.bank_phone || theme.bankPhone) && (
                <div className="flex items-center gap-1 text-[8px] sm:text-[9px] text-white/80 truncate">
                  <Phone size={9} className="shrink-0" />
                  <span className="truncate">Tel: {card.bank_phone || theme.bankPhone}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 text-[8px] sm:text-[9px] text-white/70 shrink-0">
              <ShieldCheck size={11} className="text-emerald-400" />
              <span>FinTrack Vault</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * High-definition vector badges for payment networks
 */
function NetworkLogo({ network }: { network: string }) {
  if (network === "visa") {
    return (
      <span className="font-serif italic font-black text-xl text-white tracking-tighter drop-shadow-md">
        VISA
      </span>
    );
  }
  if (network === "mastercard") {
    return (
      <div className="flex items-center -space-x-2">
        <div className="w-5 h-5 rounded-full bg-[#EB001B] shadow-xs" />
        <div className="w-5 h-5 rounded-full bg-[#F79E1B]/90 shadow-xs" />
      </div>
    );
  }
  if (network === "amex") {
    return (
      <div className="px-2 py-0.5 rounded bg-blue-600 text-white font-sans font-black text-[9px] tracking-wider border border-white/40">
        AMEX
      </div>
    );
  }
  if (network === "carnet") {
    return (
      <div className="px-2 py-0.5 rounded bg-red-600 text-white font-sans font-black text-[8px] tracking-wider">
        carnet
      </div>
    );
  }
  return (
    <div className="w-7 h-5 rounded border border-white/40 flex items-center justify-center text-[8px] font-bold tracking-widest text-white/80">
      CARD
    </div>
  );
}
