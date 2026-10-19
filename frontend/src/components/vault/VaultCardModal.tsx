"use client";

import React, { useState, useEffect } from "react";
import type { VaultCard, BankId, CardType, CardNetwork } from "@/types";
import { BankCardView } from "./BankCardView";
import { BANK_PRESETS, getBankTheme } from "@/lib/bankThemes";
import {
  detectCardNetwork,
  detectBankFromCardNumber,
  detectBankFromIban,
  formatCardNumber,
  formatIban,
  formatSinpe,
} from "@/lib/vaultCrypto";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShieldCheck,
  CreditCard,
  Building2,
  Calendar,
  Lock,
  Phone,
  Trash2,
  Sparkles,
  Smartphone,
  Coins,
  RotateCw,
} from "lucide-react";
import { toast } from "sonner";

interface VaultCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardData: Omit<VaultCard, "id" | "last4">) => Promise<any>;
  onUpdate?: (id: string, cardData: Partial<VaultCard>) => Promise<any>;
  onDelete?: (id: string) => Promise<any>;
  cardToEdit?: VaultCard | null;
}

export function VaultCardModal({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  onDelete,
  cardToEdit,
}: VaultCardModalProps) {
  const isEditing = Boolean(cardToEdit);

  // Form State
  const [bank, setBank] = useState<BankId>("bac");
  const [cardType, setCardType] = useState<CardType>("credit");
  const [cardNetwork, setCardNetwork] = useState<CardNetwork>("visa");
  const [currency, setCurrency] = useState<"CRC" | "USD">("CRC");
  const [alias, setAlias] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [iban, setIban] = useState("");
  const [sinpeMovil, setSinpeMovil] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [cutOffDay, setCutOffDay] = useState<string>("");
  const [paymentDueDay, setPaymentDueDay] = useState<string>("");
  const [creditLimit, setCreditLimit] = useState<string>("");
  const [bankPhone, setBankPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Reset or fill form when opening
  useEffect(() => {
    if (cardToEdit) {
      setBank(cardToEdit.bank || "bac");
      setCardType(cardToEdit.card_type || "credit");
      setCardNetwork(cardToEdit.card_network || "visa");
      setCurrency((cardToEdit.currency === "USD" ? "USD" : "CRC"));
      setAlias(cardToEdit.alias || "");
      setCardholderName(cardToEdit.cardholder_name || "");
      setCardNumber(cardToEdit.card_number || "");
      setExpirationDate(cardToEdit.expiration_date || "");
      setCvv(cardToEdit.cvv || "");
      setIban(cardToEdit.iban || cardToEdit.clabe || "");
      setSinpeMovil(cardToEdit.sinpe_movil || "");
      setAccountNumber(cardToEdit.account_number || "");
      setCutOffDay(cardToEdit.cut_off_day ? String(cardToEdit.cut_off_day) : "");
      setPaymentDueDay(
        cardToEdit.payment_due_day ? String(cardToEdit.payment_due_day) : ""
      );
      setCreditLimit(
        cardToEdit.credit_limit ? String(cardToEdit.credit_limit) : ""
      );
      setBankPhone(cardToEdit.bank_phone || "");
      setNotes(cardToEdit.notes || "");
    } else {
      // Default initial values for new card in Costa Rica
      setBank("bac");
      setCardType("credit");
      setCardNetwork("visa");
      setCurrency("CRC");
      setAlias("");
      setCardholderName("");
      setCardNumber("");
      setExpirationDate("");
      setCvv("");
      setIban("");
      setSinpeMovil("");
      setAccountNumber("");
      setCutOffDay("");
      setPaymentDueDay("");
      setCreditLimit("");
      setBankPhone(getBankTheme("bac").bankPhone || "");
      setNotes("");
    }
  }, [cardToEdit, isOpen]);

  // When bank changes, pre-fill default phone if empty
  const handleBankChange = (newBank: BankId) => {
    setBank(newBank);
    const theme = getBankTheme(newBank);
    if (!bankPhone || bankPhone === getBankTheme(bank).bankPhone) {
      setBankPhone(theme.bankPhone || "");
    }
    if (theme.defaultNetwork) {
      setCardNetwork(theme.defaultNetwork);
    }
  };

  const [detectedBankName, setDetectedBankName] = useState<string | null>(null);

  // Card number input formatter with network detection and Costa Rica bank detection
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length > 16) return;
    setCardNumber(raw);

    const detected = detectCardNetwork(raw);
    if (detected !== "other") {
      setCardNetwork(detected);
    }

    const autoBank = detectBankFromCardNumber(raw);
    if (autoBank) {
      setBank(autoBank);
      const theme = getBankTheme(autoBank);
      setDetectedBankName(`${theme.name} • ${detected !== "other" ? detected.toUpperCase() : "Tarjeta"}`);
      if (!bankPhone || bankPhone === getBankTheme(bank).bankPhone) {
        setBankPhone(theme.bankPhone || "");
      }
    }
  };

  // Expiration date formatter MM/YY
  const handleExpirationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let clean = e.target.value.replace(/\D/g, "");
    if (clean.length > 4) clean = clean.slice(0, 4);
    if (clean.length >= 3) {
      setExpirationDate(`${clean.slice(0, 2)}/${clean.slice(2)}`);
    } else {
      setExpirationDate(clean);
    }
  };

  // IBAN formatter (CR + 20 digits = 22 characters) with BCCR bank detection
  const handleIbanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 22);
    setIban(raw);

    const autoBank = detectBankFromIban(raw);
    if (autoBank) {
      setBank(autoBank);
      const theme = getBankTheme(autoBank);
      setDetectedBankName(`${theme.name} (IBAN BCCR)`);
      if (!bankPhone || bankPhone === getBankTheme(bank).bankPhone) {
        setBankPhone(theme.bankPhone || "");
      }
    }
  };

  // SINPE Móvil formatter (8 digits: 8888-8888)
  const handleSinpeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 8);
    setSinpeMovil(raw);
  };

  // Live preview card object
  const previewCard: VaultCard = {
    id: cardToEdit?.id || "preview-id",
    bank,
    bank_name: getBankTheme(bank).name,
    card_type: cardType,
    card_network: cardNetwork,
    alias: alias || "Mi Tarjeta",
    cardholder_name: cardholderName || "TITULAR DE LA CUENTA",
    card_number: cardNumber || "••••••••••••••••",
    last4: cardNumber.replace(/\D/g, "").slice(-4) || "0000",
    expiration_date: expirationDate || "MM/AA",
    cvv: cvv || "•••",
    iban,
    clabe: iban,
    sinpe_movil: sinpeMovil ? formatSinpe(sinpeMovil) : "",
    account_number: accountNumber,
    cut_off_day: cutOffDay ? parseInt(cutOffDay, 10) : null,
    payment_due_day: paymentDueDay ? parseInt(paymentDueDay, 10) : null,
    credit_limit: creditLimit ? parseFloat(creditLimit) : null,
    currency,
    bank_phone: bankPhone || getBankTheme(bank).bankPhone || "",
    notes,
    is_favorite: cardToEdit?.is_favorite || false,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!alias.trim()) {
      toast.error("Por favor ingresa un nombre o alias para identificar la tarjeta");
      return;
    }

    if (!cardNumber.trim() && !iban.trim() && !sinpeMovil.trim() && !accountNumber.trim()) {
      toast.error("Ingresa al menos un número de tarjeta, IBAN o SINPE Móvil");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Omit<VaultCard, "id" | "last4"> = {
        bank,
        bank_name: getBankTheme(bank).name,
        card_type: cardType,
        card_network: cardNetwork,
        alias: alias.trim(),
        cardholder_name: cardholderName.trim().toUpperCase(),
        card_number: cardNumber.replace(/\D/g, ""),
        expiration_date: expirationDate.trim(),
        cvv: cvv.trim(),
        iban: iban.trim().toUpperCase(),
        clabe: iban.trim().toUpperCase(),
        sinpe_movil: sinpeMovil.replace(/\D/g, ""),
        account_number: accountNumber.trim(),
        cut_off_day: cutOffDay ? parseInt(cutOffDay, 10) : null,
        payment_due_day: paymentDueDay ? parseInt(paymentDueDay, 10) : null,
        credit_limit: creditLimit ? parseFloat(creditLimit) : null,
        currency,
        bank_phone: bankPhone.trim(),
        notes: notes.trim(),
        is_favorite: cardToEdit?.is_favorite || false,
      };

      if (isEditing && cardToEdit && onUpdate) {
        await onUpdate(cardToEdit.id, payload);
      } else {
        await onSave(payload);
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!cardToEdit || !onDelete) return;
    if (confirm("¿Seguro que deseas eliminar esta tarjeta de tu bóveda protegida?")) {
      setIsSubmitting(true);
      await onDelete(cardToEdit.id);
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[96vw] max-w-6xl max-h-[90vh] md:max-h-[88vh] overflow-hidden p-0 gap-0 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col">
        <DialogHeader className="px-5 py-3.5 sm:px-7 sm:py-4 border-b border-slate-200/80 dark:border-slate-800 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-3 pr-6">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base sm:text-lg md:text-xl font-bold tracking-tight truncate">
                {isEditing ? "Editar Tarjeta / Cuenta" : "Registrar en Bóveda Bancaria (Costa Rica)"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 truncate">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                Cifrado bancario AES-GCM 256 • Soporte para IBAN y SINPE Móvil
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* 2-Column Split on Desktop, Stacked on Mobile */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">
          {/* LEFT PANE: 3D Interactive Card & Bank Security Info */}
          <div className="w-full md:w-[44%] lg:w-[42%] bg-gradient-to-b from-slate-100 via-slate-100/90 to-slate-200/60 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b md:border-b-0 md:border-r border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 lg:p-7 flex flex-col justify-between overflow-y-auto shrink-0">
            <div className="flex flex-col items-center">
              {/* Live Auto-detect or Interactive status pill */}
              {detectedBankName ? (
                <div className="mb-3.5 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
                  <Sparkles size={13} className="text-amber-500 shrink-0" />
                  <span>Detectado: {detectedBankName}</span>
                </div>
              ) : (
                <div className="mb-3.5 px-3 py-1 rounded-full bg-slate-200/70 dark:bg-slate-800 border border-slate-300/40 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5">
                  <Sparkles size={12} className="text-blue-500 shrink-0" />
                  <span>Previsualización 3D en Tiempo Real</span>
                </div>
              )}

              {/* 3D Bank Card View */}
              <div className="w-full max-w-[340px] sm:max-w-[380px] lg:max-w-[420px] mx-auto py-1">
                <BankCardView
                  card={previewCard}
                  isUnlocked={true}
                  interactive={true}
                  flipped={isCardFlipped}
                  onFlipChange={setIsCardFlipped}
                  focusedField={focusedField}
                />
              </div>

              {/* Flip Button & Interactive Tip */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCardFlipped(!isCardFlipped)}
                  className="rounded-xl text-xs h-8 px-3.5 gap-2 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 font-medium"
                >
                  <RotateCw size={13} className="text-blue-500" />
                  <span>{isCardFlipped ? "Ver Frente de Tarjeta" : "Ver Reverso (CVV / IBAN)"}</span>
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground text-center mt-2 flex items-center justify-center gap-1.5 font-medium">
                <Sparkles size={11} className="text-amber-500 shrink-0" />
                <span>Haz clic en la tarjeta o enfoca el CVV para girarla</span>
              </p>

              {/* Quick Summary Grid */}
              <div className="mt-5 grid grid-cols-3 gap-2 w-full text-center">
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <span className="block text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                    Entidad
                  </span>
                  <span className="text-xs font-bold truncate block mt-0.5 text-slate-800 dark:text-slate-200">
                    {getBankTheme(bank).name}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <span className="block text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                    Moneda
                  </span>
                  <span className="text-xs font-bold block mt-0.5 text-slate-800 dark:text-slate-200">
                    {currency === "CRC" ? "₡ Colones" : "$ USD"}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <span className="block text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                    Tipo
                  </span>
                  <span className="text-xs font-bold capitalize block mt-0.5 text-slate-800 dark:text-slate-200">
                    {cardType === "credit"
                      ? "Crédito"
                      : cardType === "debit"
                      ? "Débito"
                      : "Ahorros"}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Security Info Box */}
            <div className="hidden md:flex items-start gap-2.5 p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50 mt-6">
              <Lock size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
                <span className="font-semibold text-slate-900 dark:text-slate-100 block mb-0.5">
                  Bóveda de Máxima Privacidad
                </span>
                Los datos se cifran con AES-GCM 256 antes de guardarse. Solo tú con tu PIN puedes descifrarlos.
              </div>
            </div>
          </div>

          {/* RIGHT PANE: Form & Pinned Footer */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden"
          >
            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 lg:p-8 space-y-6">
              {/* Costa Rica Bank Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 size={14} className="text-blue-600 dark:text-blue-400" />
                    Banco o Entidad Financiera (Costa Rica)
                  </label>
                  {detectedBankName && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full animate-in fade-in shrink-0">
                      <Sparkles size={11} className="text-amber-500" />
                      Detectado
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 max-h-48 sm:max-h-none overflow-y-auto p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                  {Object.entries(BANK_PRESETS).map(([bId, preset]) => {
                    const isSelected = bank === bId;
                    return (
                      <button
                        key={bId}
                        type="button"
                        onClick={() => handleBankChange(bId as BankId)}
                        className={`
                          px-2.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between border cursor-pointer select-none text-left
                          ${
                            isSelected
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-500/20"
                              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750"
                          }
                        `}
                      >
                        <span className="truncate pr-1">{preset.name}</span>
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs border border-black/10"
                          style={{
                            backgroundColor: isSelected ? "#FFFFFF" : preset.accentColor,
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Type, Network & Currency Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Instrument Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tipo de Cuenta
                  </label>
                  <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                    {(
                      [
                        { id: "credit", label: "Crédito" },
                        { id: "debit", label: "Débito" },
                        { id: "account", label: "Ahorros" },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setCardType(t.id)}
                        className={`
                          py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center
                          ${
                            cardType === t.id
                              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                          }
                        `}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Currency (CRC or USD) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Moneda
                  </label>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                    {(
                      [
                        { id: "CRC", label: "₡ Colones" },
                        { id: "USD", label: "$ Dólares" },
                      ] as const
                    ).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCurrency(c.id)}
                        className={`
                          py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center
                          ${
                            currency === c.id
                              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                          }
                        `}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Network Brand */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Franquicia
                  </label>
                  <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                    {(
                      [
                        { id: "visa", label: "Visa" },
                        { id: "mastercard", label: "Master" },
                        { id: "amex", label: "Amex" },
                      ] as const
                    ).map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => setCardNetwork(n.id)}
                        className={`
                          py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center
                          ${
                            cardNetwork === n.id
                              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                          }
                        `}
                      >
                        {n.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Alias & Cardholder */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="alias" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nombre de la Tarjeta / Alias *
                  </label>
                  <Input
                    id="alias"
                    placeholder="ej. BAC Débito Principal, BNCR Ahorros, Scotiabank Platino"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    onFocus={() => {
                      setIsCardFlipped(false);
                      setFocusedField("alias");
                    }}
                    onBlur={() => setFocusedField(null)}
                    className="rounded-xl bg-slate-50/70 dark:bg-slate-950 text-sm h-10 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="cardholder" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nombre del Titular
                  </label>
                  <Input
                    id="cardholder"
                    placeholder="ej. CARLOS ROJAS MORA"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
                    onFocus={() => {
                      setIsCardFlipped(false);
                      setFocusedField("cardholder");
                    }}
                    onBlur={() => setFocusedField(null)}
                    className="rounded-xl bg-slate-50/70 dark:bg-slate-950 tracking-wider text-sm h-10 uppercase border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  />
                </div>
              </div>

              {/* Card Number, Expiration & CVV */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-6 space-y-1.5">
                  <label htmlFor="cardNumber" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Número de Tarjeta (16 dígitos)
                  </label>
                  <div className="relative">
                    <Input
                      id="cardNumber"
                      placeholder="0000 0000 0000 0000"
                      value={formatCardNumber(cardNumber)}
                      onChange={handleCardNumberChange}
                      onFocus={() => {
                        setIsCardFlipped(false);
                        setFocusedField("cardNumber");
                      }}
                      onBlur={() => setFocusedField(null)}
                      className="rounded-xl bg-slate-50/70 dark:bg-slate-950 font-mono tracking-widest pl-10 text-sm h-10 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                      maxLength={19}
                    />
                    <CreditCard
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3 space-y-1.5">
                  <label htmlFor="exp" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Vence (MM/AA)
                  </label>
                  <div className="relative">
                    <Input
                      id="exp"
                      placeholder="12/28"
                      value={expirationDate}
                      onChange={handleExpirationChange}
                      onFocus={() => {
                        setIsCardFlipped(false);
                        setFocusedField("exp");
                      }}
                      onBlur={() => setFocusedField(null)}
                      className="rounded-xl bg-slate-50/70 dark:bg-slate-950 font-mono tracking-wider pl-9 text-center text-sm h-10 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                      maxLength={5}
                    />
                    <Calendar
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="cvv" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      CVV / CVC
                    </label>
                    <span className="text-[10px] text-amber-500 font-semibold flex items-center gap-0.5">
                      <RotateCw size={10} /> Reverso 3D
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      id="cvv"
                      type="password"
                      placeholder="•••"
                      value={cvv}
                      onChange={(e) =>
                        setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                      }
                      onFocus={() => {
                        setIsCardFlipped(true); // Automatically flips to back!
                        setFocusedField("cvv");
                      }}
                      onBlur={() => setFocusedField(null)}
                      className="rounded-xl bg-slate-50/70 dark:bg-slate-950 font-mono tracking-widest pl-9 text-center text-sm h-10 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-colors ring-offset-2 focus:ring-2 focus:ring-amber-500/50"
                      maxLength={4}
                    />
                    <Lock
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* Costa Rica IBAN & SINPE Móvil */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* IBAN */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="iban" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Cuenta IBAN Costa Rica (22 caracteres)
                    </label>
                    <span
                      className={`text-[11px] font-mono font-bold ${
                        iban.replace(/\s+/g, "").length === 22
                          ? "text-emerald-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {iban.replace(/\s+/g, "").length}/22
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      id="iban"
                      placeholder="CR05 0102 0000 9008 3456 78"
                      value={formatIban(iban)}
                      onChange={handleIbanChange}
                      onFocus={() => {
                        setFocusedField("iban");
                      }}
                      onBlur={() => setFocusedField(null)}
                      className="rounded-xl bg-slate-50/70 dark:bg-slate-950 font-mono tracking-wider pl-10 text-sm h-10 uppercase border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                      maxLength={27}
                    />
                    <Building2
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                  </div>
                </div>

                {/* SINPE Móvil */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="sinpe" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Número SINPE Móvil (8 dígitos)
                    </label>
                    <span
                      className={`text-[11px] font-mono font-bold ${
                        sinpeMovil.length === 8
                          ? "text-emerald-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {sinpeMovil.length}/8
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      id="sinpe"
                      placeholder="8888-8888"
                      value={formatSinpe(sinpeMovil)}
                      onChange={handleSinpeChange}
                      onFocus={() => {
                        setFocusedField("sinpe");
                      }}
                      onBlur={() => setFocusedField(null)}
                      className="rounded-xl bg-slate-50/70 dark:bg-slate-950 font-mono tracking-wider pl-10 text-sm h-10 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                      maxLength={9}
                    />
                    <Smartphone
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* Credit Card Specific: Cutoff & Due Day, Credit Limit */}
              {cardType === "credit" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-blue-50/60 dark:bg-blue-950/20 rounded-2xl border border-blue-200/60 dark:border-blue-900/40">
                  <div className="space-y-1.5">
                    <label htmlFor="cutoff" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Día de Corte
                    </label>
                    <Input
                      id="cutoff"
                      type="number"
                      min="1"
                      max="31"
                      placeholder="ej. 15"
                      value={cutOffDay}
                      onChange={(e) => setCutOffDay(e.target.value)}
                      className="rounded-xl bg-white dark:bg-slate-950 text-sm h-10 border-slate-200 dark:border-slate-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="paymentDue" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Día Límite de Pago
                    </label>
                    <Input
                      id="paymentDue"
                      type="number"
                      min="1"
                      max="31"
                      placeholder="ej. 5"
                      value={paymentDueDay}
                      onChange={(e) => setPaymentDueDay(e.target.value)}
                      className="rounded-xl bg-white dark:bg-slate-950 text-sm h-10 border-slate-200 dark:border-slate-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="limit" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Límite de Crédito ({currency === "CRC" ? "₡ Colones" : "$ USD"})
                    </label>
                    <div className="relative">
                      <Input
                        id="limit"
                        type="number"
                        step="0.01"
                        placeholder={currency === "USD" ? "2000" : "1000000"}
                        value={creditLimit}
                        onChange={(e) => setCreditLimit(e.target.value)}
                        className="rounded-xl bg-white dark:bg-slate-950 pl-8 text-sm h-10 font-mono border-slate-200 dark:border-slate-800"
                      />
                      <Coins
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Bank phone & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Teléfono de Servicio al Cliente
                  </label>
                  <div className="relative">
                    <Input
                      id="phone"
                      placeholder="2295-9898"
                      value={bankPhone}
                      onChange={(e) => setBankPhone(e.target.value)}
                      className="rounded-xl bg-slate-50/70 dark:bg-slate-950 pl-10 font-mono text-sm h-10 border-slate-200 dark:border-slate-800"
                    />
                    <Phone
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="notes" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Notas Seguras (Cifradas)
                  </label>
                  <Input
                    id="notes"
                    placeholder="ej. Token de seguridad en app móvil, sucursal Escazú"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="rounded-xl bg-slate-50/70 dark:bg-slate-950 text-sm h-10 border-slate-200 dark:border-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Pinned Form Footer */}
            <div className="px-5 py-4 sm:px-7 sm:py-4.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-between shrink-0 gap-3">
              {isEditing && onDelete ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="rounded-xl gap-2 cursor-pointer text-xs h-10 px-4 font-semibold shadow-xs"
                >
                  <Trash2 size={15} />
                  <span>Eliminar Tarjeta</span>
                </Button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-xl cursor-pointer text-xs h-10 px-4 font-semibold border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 cursor-pointer shadow-md text-xs h-10 gap-2"
                >
                  <ShieldCheck size={16} />
                  {isSubmitting ? "Guardando..." : "Guardar en Bóveda"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
