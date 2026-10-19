"use client";

import React, { useState } from "react";
import { useVault } from "@/contexts/VaultContext";
import { VaultLockScreen } from "@/components/vault/VaultLockScreen";
import { BankCardView } from "@/components/vault/BankCardView";
import { VaultCardModal } from "@/components/vault/VaultCardModal";
import type { VaultCard, CardType } from "@/types";
import {
  ShieldCheck,
  Lock,
  Plus,
  CreditCard,
  Building2,
  Copy,
  Calendar,
  Phone,
  Edit3,
  Layers,
  LayoutGrid,
  CheckCircle2,
  Sparkles,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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

  // UI state
  const [activeFilter, setActiveFilter] = useState<"all" | CardType | "favorite">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"wallet" | "grid">("wallet");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<VaultCard | null>(null);

  // If still checking PIN setup in database
  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 animate-pulse flex items-center justify-center mb-4">
          <ShieldCheck size={32} />
        </div>
        <p className="text-sm font-semibold text-muted-foreground">
          Verificando seguridad de la bóveda...
        </p>
      </div>
    );
  }

  // If locked, render security keypad lockscreen
  if (!isUnlocked) {
    return (
      <VaultLockScreen
        onUnlock={unlockVault}
        onSetupPin={setupPin}
        hasPinConfigured={hasPin}
      />
    );
  }

  // Filter cards
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
      return matchAlias || matchBank || matchLast4 || matchHolder;
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
    toast.success(`${label} copiada al portapapeles`, {
      description: text,
      duration: 2500,
    });
  };

  const creditCount = cards.filter((c) => c.card_type === "credit").length;
  const debitCount = cards.filter((c) => c.card_type === "debit").length;
  const accountCount = cards.filter((c) => c.card_type === "account").length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shrink-0">
            <ShieldCheck size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                Bóveda Financiera
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 size={11} />
                AES-256
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-lg">
              Cuentas bancarias y tarjetas protegidas con cifrado de extremo a extremo. Los datos solo se descifran en tu dispositivo.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={lockVault}
            className="rounded-2xl border-white/20 text-white hover:bg-white/10 text-xs sm:text-sm font-semibold gap-2 cursor-pointer bg-white/5"
          >
            <Lock size={15} />
            <span>Bloquear</span>
          </Button>

          <Button
            onClick={handleOpenAdd}
            className="rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold gap-2 cursor-pointer shadow-lg hover:shadow-blue-500/25 transition-all"
          >
            <Plus size={17} />
            <span>Agregar Tarjeta</span>
          </Button>
        </div>
      </div>

      {/* Stats Quick Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Total en Bóveda
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black">{cards.length}</span>
            <span className="text-xs text-muted-foreground">registros</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Tarjetas de Crédito
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-blue-500">{creditCount}</span>
            <span className="text-xs text-muted-foreground">plásticos</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Tarjetas de Débito
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-500">{debitCount}</span>
            <span className="text-xs text-muted-foreground">cuentas</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Cuentas CLABE
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-purple-500">{accountCount}</span>
            <span className="text-xs text-muted-foreground">SPEI</span>
          </div>
        </div>
      </div>

      {/* Filter and View Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {(
            [
              { id: "all", label: "Todas" },
              { id: "credit", label: "Crédito" },
              { id: "debit", label: "Débito" },
              { id: "account", label: "Cuentas" },
              { id: "favorite", label: "Favoritas ★" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`
                px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer
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

        {/* View Mode & Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Buscar por banco, alias..."
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

      {/* Main Content Area */}
      {cards.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900/60 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <CreditCard size={32} />
          </div>
          <div className="max-w-md">
            <h2 className="text-lg font-bold">Tu bóveda está vacía</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Guarda tus números de tarjeta, cuentas CLABE, CVV y fechas de corte con la apariencia oficial de los bancos como en Google Wallet.
            </p>
          </div>
          <Button
            onClick={handleOpenAdd}
            className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 px-6 cursor-pointer"
          >
            <Plus size={16} />
            <span>Agregar mi primera tarjeta</span>
          </Button>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-xs">
          No se encontraron tarjetas con el filtro o búsqueda actual.
        </div>
      ) : viewMode === "wallet" ? (
        /* ================= GOOGLE WALLET STACK VIEW ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Card Stack / Carousel on Left / Top */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Tus Tarjetas ({filteredCards.length})
              </span>
              <span className="text-[11px] text-muted-foreground">
                Toca una tarjeta para seleccionarla
              </span>
            </div>

            {/* Wallet Vertical Card Stack */}
            <div className="flex flex-col space-y-[-140px] sm:space-y-[-150px] pb-36 pt-2">
              {filteredCards.map((card, index) => {
                const isSelected = (activeCard?.id === card.id);
                return (
                  <motion.div
                    key={card.id}
                    layout
                    whileHover={{ y: -16, transition: { duration: 0.2 } }}
                    animate={{
                      scale: isSelected ? 1.02 : 1,
                      zIndex: isSelected ? 30 : index + 1,
                      y: isSelected ? -10 : 0,
                    }}
                    onClick={() => setSelectedCardId(card.id)}
                    className="cursor-pointer transition-all duration-300"
                  >
                    <div
                      className={`transition-all duration-300 ${
                        isSelected
                          ? "ring-4 ring-blue-500/40 rounded-2xl shadow-2xl"
                          : "opacity-95 hover:opacity-100"
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

          {/* Active Card Expanded Detail Panel on Right */}
          {activeCard && (
            <div className="lg:col-span-6 space-y-4 sticky top-6">
              <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
                      {activeCard.bank_name} • {activeCard.card_type === "credit" ? "Tarjeta de Crédito" : "Débito / Cuenta"}
                    </span>
                    <h3 className="text-xl font-black mt-0.5">{activeCard.alias}</h3>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      •••• •••• •••• {activeCard.last4}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(activeCard)}
                      className="rounded-xl text-xs gap-1.5 cursor-pointer"
                    >
                      <Edit3 size={14} />
                      <span>Editar</span>
                    </Button>
                  </div>
                </div>

                {/* Quick Copy Banking Coordinates Grid */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Datos Rápidos para Transferencias y Pagos
                  </span>

                  {/* Card Number */}
                  {activeCard.card_number && (
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                          Número de Tarjeta
                        </span>
                        <p className="font-mono text-sm font-bold tracking-wider">
                          {activeCard.card_number.replace(/\D/g, "").replace(/(\d{4})/g, "$1 ").trim()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCopy(activeCard.card_number, "Tarjeta")}
                        className="rounded-xl text-xs gap-1.5 cursor-pointer"
                      >
                        <Copy size={13} />
                        <span>Copiar</span>
                      </Button>
                    </div>
                  )}

                  {/* CLABE */}
                  {activeCard.clabe && (
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                          CLABE Interbancaria (SPEI)
                        </span>
                        <p className="font-mono text-sm font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
                          {activeCard.clabe}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCopy(activeCard.clabe || "", "CLABE")}
                        className="rounded-xl text-xs gap-1.5 cursor-pointer"
                      >
                        <Copy size={13} />
                        <span>Copiar</span>
                      </Button>
                    </div>
                  )}

                  {/* Account Number */}
                  {activeCard.account_number && (
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                          Número de Cuenta
                        </span>
                        <p className="font-mono text-sm font-bold">
                          {activeCard.account_number}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCopy(activeCard.account_number || "", "Cuenta")}
                        className="rounded-xl text-xs gap-1.5 cursor-pointer"
                      >
                        <Copy size={13} />
                        <span>Copiar</span>
                      </Button>
                    </div>
                  )}

                  {/* Security CVV & Expiration Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                          Vigencia
                        </span>
                        <p className="font-mono text-sm font-bold">
                          {activeCard.expiration_date || "N/A"}
                        </p>
                      </div>
                      {activeCard.expiration_date && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopy(activeCard.expiration_date || "", "Vigencia")}
                          className="h-8 w-8 p-0 cursor-pointer"
                        >
                          <Copy size={13} />
                        </Button>
                      )}
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                          CVV
                        </span>
                        <p className="font-mono text-sm font-bold tracking-widest">
                          {activeCard.cvv || "•••"}
                        </p>
                      </div>
                      {activeCard.cvv && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopy(activeCard.cvv || "", "CVV")}
                          className="h-8 w-8 p-0 cursor-pointer"
                        >
                          <Copy size={13} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Credit Card Dates Banner */}
                {activeCard.card_type === "credit" && (
                  <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50 flex items-center justify-around text-center">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">
                        Día de Corte
                      </span>
                      <p className="text-base font-black text-blue-600 dark:text-blue-400 mt-0.5">
                        Día {activeCard.cut_off_day || "—"}
                      </p>
                    </div>
                    <div className="w-px h-8 bg-blue-200 dark:bg-blue-900" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">
                        Límite de Pago
                      </span>
                      <p className="text-base font-black text-rose-600 dark:text-rose-400 mt-0.5">
                        Día {activeCard.payment_due_day || "—"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Bank Contact Phone */}
                {activeCard.bank_phone && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-800 text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Phone size={14} />
                      Línea del banco:
                    </span>
                    <a
                      href={`tel:${activeCard.bank_phone.replace(/\s+/g, "")}`}
                      className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {activeCard.bank_phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ================= GRID VIEW ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map((card) => (
            <div
              key={card.id}
              className="flex flex-col space-y-3 p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all"
            >
              <BankCardView
                card={card}
                isUnlocked={isUnlocked}
                onEdit={handleOpenEdit}
                onToggleFavorite={toggleFavorite}
              />

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs px-1">
                <span className="font-bold truncate max-w-[150px]">
                  {card.alias}
                </span>

                <div className="flex items-center gap-1">
                  {card.clabe && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(card.clabe || "", "CLABE")}
                      className="h-7 px-2 text-[11px] gap-1 cursor-pointer font-medium"
                    >
                      <Copy size={11} />
                      CLABE
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenEdit(card)}
                    className="h-7 px-2 text-[11px] gap-1 cursor-pointer font-medium"
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

      {/* Vault Card Add/Edit Modal */}
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
