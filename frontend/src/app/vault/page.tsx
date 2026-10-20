"use client";

import React, { useState } from "react";
import { useVault } from "@/contexts/VaultContext";
import { VaultLockScreen } from "@/components/vault/VaultLockScreen";
import { BankCardView } from "@/components/vault/BankCardView";
import { VaultCardModal } from "@/components/vault/VaultCardModal";
import type { VaultCard, CardType } from "@/types";
import { formatIban } from "@/lib/vaultCrypto";
import {
  Lock,
  Plus,
  CreditCard,
  Copy,
  Edit3,
  Layers,
  LayoutGrid,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function VaultPage() {
  const {
    isUnlocked,
    hasPin,
    isLoading,
    cards,
    unlockVault,
    setupPin,
    lockVault,
    addCard,
    updateCard,
    deleteCard,
    toggleFavorite,
  } = useVault();

  const [activeFilter, setActiveFilter] = useState<"all" | CardType | "favorite">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"wallet" | "grid">("wallet");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<VaultCard | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 animate-pulse flex items-center justify-center mb-3">
          <Lock size={24} />
        </div>
        <p className="text-sm font-semibold text-muted-foreground">
          Cargando bóveda...
        </p>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <VaultLockScreen
        onUnlock={unlockVault}
        onSetupPin={setupPin}
        hasPinConfigured={hasPin}
      />
    );
  }

  const filteredCards = cards.filter((card) => {
    if (activeFilter === "favorite" && !card.is_favorite) return false;
    if (activeFilter !== "all" && activeFilter !== "favorite" && card.card_type !== activeFilter)
      return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchAlias = card.alias.toLowerCase().includes(q);
      const matchBank = card.bank_name.toLowerCase().includes(q);
      const matchLast4 = card.last4.includes(q);
      const matchHolder = card.cardholder_name.toLowerCase().includes(q);
      const matchAccount = card.account_number?.toLowerCase().includes(q) || false;
      const matchIban = (card.iban || card.clabe)?.toLowerCase().includes(q) || false;
      return matchAlias || matchBank || matchLast4 || matchHolder || matchAccount || matchIban;
    }
    return true;
  });

  const activeCard =
    cards.find((c) => c.id === selectedCardId) ||
    filteredCards[0] ||
    cards[0] ||
    null;

  const handleOpenAdd = () => {
    setCardToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (card: VaultCard) => {
    setCardToEdit(card);
    setIsModalOpen(true);
  };

  const handleCopy = (text: string, label: string) => {
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

  const creditCount = cards.filter((c) => c.card_type === "credit").length;
  const debitCount = cards.filter((c) => c.card_type === "debit").length;
  const accountCount = cards.filter((c) => c.card_type === "account").length;

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 sm:pb-32 space-y-4 sm:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-6 bg-slate-900 text-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0">
            <CreditCard size={20} />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-black tracking-tight">
              Bóveda
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 max-w-lg leading-tight">
              Tarjetas de crédito, débito y cuentas bancarias.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={lockVault}
            className="rounded-xl border-white/20 text-white hover:bg-white/10 text-xs font-semibold gap-1.5 cursor-pointer bg-white/5 h-9"
          >
            <Lock size={14} />
            <span>Bloquear</span>
          </Button>

          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold gap-1.5 cursor-pointer shadow-lg transition-all h-9"
          >
            <Plus size={15} />
            <span>Agregar</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Total en Bóveda
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl sm:text-2xl font-black font-mono tabular-nums">{cards.length}</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">registros</span>
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Tarjetas de Crédito
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl sm:text-2xl font-black font-mono tabular-nums text-blue-600 dark:text-blue-400">
              {creditCount}
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">tarjetas</span>
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Tarjetas de Débito
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl sm:text-2xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {debitCount}
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">tarjetas</span>
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Cuentas Bancarias
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl sm:text-2xl font-black font-mono tabular-nums text-purple-600 dark:text-purple-400">
              {accountCount}
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">cuentas</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
          {(
            [
              { id: "all", label: "Todas" },
              { id: "credit", label: "Crédito" },
              { id: "debit", label: "Débito" },
              { id: "account", label: "Cuentas" },
              { id: "favorite", label: "Favoritas" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`
                px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer select-none
                ${
                  activeFilter === f.id
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm font-bold"
                    : "bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }
              `}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Buscar banco, alias, IBAN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="inline-flex p-1 bg-slate-200/80 dark:bg-slate-800 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode("wallet")}
              title="Modo Billetera"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "wallet"
                  ? "bg-white dark:bg-slate-900 text-blue-500 shadow-xs"
                  : "text-muted-foreground"
              }`}
            >
              <Layers size={16} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              title="Modo Cuadrícula"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white dark:bg-slate-900 text-blue-500 shadow-xs"
                  : "text-muted-foreground"
              }`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white dark:bg-slate-900/60 rounded-2xl sm:rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <CreditCard size={30} />
          </div>
          <div className="max-w-md">
            <h2 className="text-base sm:text-lg font-bold">Tu bóveda está vacía</h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Guarda tus tarjetas de crédito, débito y cuentas IBAN para consultar y copiar tus datos bancarios rápidamente.
            </p>
          </div>
          <Button
            onClick={handleOpenAdd}
            className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 px-6 cursor-pointer"
          >
            <Plus size={16} />
            <span>Agregar primera tarjeta o cuenta</span>
          </Button>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-xs">
          No se encontraron registros con el filtro o búsqueda actual.
        </div>
      ) : viewMode === "wallet" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Tarjetas y Cuentas ({filteredCards.length})
              </span>
              <span className="text-[10px] sm:text-[11px] text-muted-foreground">
                Selecciona para ver detalles
              </span>
            </div>

            <div className="flex flex-col space-y-[-115px] sm:space-y-[-140px] md:space-y-[-150px] pb-28 sm:pb-36 pt-1">
              {filteredCards.map((card, index) => {
                const isSelected = activeCard?.id === card.id;
                return (
                  <motion.div
                    key={card.id}
                    layout
                    whileHover={{ y: -12, transition: { duration: 0.2 } }}
                    animate={{
                      scale: isSelected ? 1.02 : 1,
                      zIndex: isSelected ? 30 : index + 1,
                      y: isSelected ? -8 : 0,
                    }}
                    onClick={() => setSelectedCardId(card.id)}
                    className="cursor-pointer transition-all duration-300"
                  >
                    <div
                      className={`transition-all duration-300 ${
                        isSelected
                          ? "opacity-100"
                          : "opacity-90 hover:opacity-100"
                      }`}
                    >
                      <BankCardView
                        card={card}
                        isUnlocked={isUnlocked}
                        onEdit={handleOpenEdit}
                        onToggleFavorite={toggleFavorite}
                        interactive={isSelected}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {activeCard && (
            <div className="lg:col-span-6 space-y-4 lg:sticky lg:top-6">
              <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block truncate">
                      {activeCard.bank_name} -{" "}
                      {activeCard.card_type === "credit"
                        ? "Crédito"
                        : activeCard.card_type === "debit"
                        ? "Débito"
                        : "Cuenta"}{" "}
                      - {activeCard.currency || "CRC"}
                    </span>
                    <h3 className="text-lg sm:text-xl font-black mt-0.5 truncate">
                      {activeCard.alias}
                    </h3>
                    {activeCard.card_number && (
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        •••• •••• •••• {activeCard.last4}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(activeCard)}
                      className="rounded-xl text-xs gap-1.5 cursor-pointer h-8 sm:h-9"
                    >
                      <Edit3 size={13} />
                      <span>Editar</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Datos de Tarjeta y Cuenta
                  </span>

                  {activeCard.card_number && (
                    <div className="flex items-center justify-between p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                      <div className="space-y-0.5 min-w-0">
                        <span className="text-[9px] font-semibold text-muted-foreground uppercase block">
                          Número de Tarjeta
                        </span>
                        <p className="font-mono text-xs sm:text-sm font-bold tracking-wider truncate">
                          {activeCard.card_number
                            .replace(/\D/g, "")
                            .replace(/(\d{4})/g, "$1 ")
                            .trim()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCopy(activeCard.card_number, "Tarjeta")}
                        className="rounded-xl text-xs gap-1 cursor-pointer shrink-0 h-8"
                      >
                        <Copy size={12} />
                        <span>Copiar</span>
                      </Button>
                    </div>
                  )}

                  {(activeCard.iban || activeCard.clabe) && (
                    <div className="flex items-center justify-between p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <span className="text-[9px] font-semibold text-muted-foreground uppercase block">
                          Cuenta IBAN
                        </span>
                        <p className="font-mono text-xs sm:text-sm font-bold tracking-wide text-emerald-600 dark:text-emerald-400 truncate">
                          {formatIban(activeCard.iban || activeCard.clabe || "")}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          handleCopy(activeCard.iban || activeCard.clabe || "", "Cuenta IBAN")
                        }
                        className="rounded-xl text-xs gap-1 cursor-pointer shrink-0 h-8"
                      >
                        <Copy size={12} />
                        <span>Copiar</span>
                      </Button>
                    </div>
                  )}

                  {activeCard.account_number && (
                    <div className="flex items-center justify-between p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                      <div className="space-y-0.5 min-w-0">
                        <span className="text-[9px] font-semibold text-muted-foreground uppercase block">
                          Número de Cuenta Cliente
                        </span>
                        <p className="font-mono text-xs sm:text-sm font-bold truncate">
                          {activeCard.account_number}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCopy(activeCard.account_number || "", "Cuenta")}
                        className="rounded-xl text-xs gap-1 cursor-pointer shrink-0 h-8"
                      >
                        <Copy size={12} />
                        <span>Copiar</span>
                      </Button>
                    </div>
                  )}

                  {activeCard.card_type !== "account" && (
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] font-semibold text-muted-foreground uppercase block">
                            Vigencia
                          </span>
                          <p className="font-mono text-xs sm:text-sm font-bold">
                            {activeCard.expiration_date || "N/A"}
                          </p>
                        </div>
                        {activeCard.expiration_date && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleCopy(activeCard.expiration_date || "", "Vigencia")
                            }
                            className="h-7 w-7 p-0 cursor-pointer"
                          >
                            <Copy size={12} />
                          </Button>
                        )}
                      </div>

                      <div className="p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] font-semibold text-muted-foreground uppercase block">
                            CVV
                          </span>
                          <p className="font-mono text-xs sm:text-sm font-bold tracking-widest">
                            {activeCard.cvv || "•••"}
                          </p>
                        </div>
                        {activeCard.cvv && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopy(activeCard.cvv || "", "CVV")}
                            className="h-7 w-7 p-0 cursor-pointer"
                          >
                            <Copy size={12} />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {activeCard.card_type === "credit" && (
                  <div className="p-3.5 rounded-xl sm:rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50 flex items-center justify-around text-center">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block">
                        Día de Corte
                      </span>
                      <p className="text-sm sm:text-base font-black font-mono tabular-nums text-blue-600 dark:text-blue-400 mt-0.5">
                        Día {activeCard.cut_off_day || "-"}
                      </p>
                    </div>
                    <div className="w-px h-7 bg-blue-200 dark:bg-blue-900" />
                    <div>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block">
                        Límite de Pago
                      </span>
                      <p className="text-sm sm:text-base font-black font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-0.5">
                        Día {activeCard.payment_due_day || "-"}
                      </p>
                    </div>
                    {activeCard.credit_limit && (
                      <>
                        <div className="w-px h-7 bg-blue-200 dark:bg-blue-900" />
                        <div>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground block">
                            Límite
                          </span>
                          <p className="text-xs sm:text-sm font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {activeCard.currency === "USD" ? "$" : "₡"}
                            {activeCard.credit_limit.toLocaleString()}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredCards.map((card) => (
            <div
              key={card.id}
              className="flex flex-col space-y-3 p-3.5 sm:p-4 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all"
            >
              <BankCardView
                card={card}
                isUnlocked={isUnlocked}
                onEdit={handleOpenEdit}
                onToggleFavorite={toggleFavorite}
              />

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs px-1">
                <span className="font-bold truncate max-w-[160px] text-xs">
                  {card.alias}
                </span>

                <div className="flex items-center gap-1">
                  {(card.iban || card.clabe) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(card.iban || card.clabe || "", "IBAN")}
                      className="h-7 px-2 text-[10px] gap-1 cursor-pointer font-medium"
                    >
                      IBAN
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenEdit(card)}
                    className="h-7 px-2 text-[10px] gap-1 cursor-pointer font-medium"
                  >
                    <Edit3 size={11} />
                    Editar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <VaultCardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={addCard}
        onUpdate={updateCard}
        onDelete={deleteCard}
        cardToEdit={cardToEdit}
      />
    </div>
  );
}
