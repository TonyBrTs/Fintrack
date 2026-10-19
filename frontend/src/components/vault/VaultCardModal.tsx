"use client";

import React, { useState, useEffect } from "react";
import type { VaultCard, BankId, CardType, CardNetwork } from "@/types";
import { BankCardView } from "./BankCardView";
import { BANK_PRESETS, getBankTheme } from "@/lib/bankThemes";
import {
  detectCardNetwork,
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

  // Card number input formatter with network detection
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length > 16) return;
    setCardNumber(raw);

    const detected = detectCardNetwork(raw);
    if (detected !== "other") {
      setCardNetwork(detected);
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

  // IBAN formatter (CR + 20 digits = 22 characters)
  const handleIbanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 22);
    setIban(raw);
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
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[92dvh] overflow-y-auto p-0 gap-0 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl">
        <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base sm:text-lg font-bold tracking-tight truncate">
                {isEditing ? "Editar Tarjeta / Cuenta" : "Registrar en Bóveda (Costa Rica)"}
              </DialogTitle>
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                Cifrado bancario AES-256 • Soporte para IBAN y SINPE Móvil
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Live Card Preview Banner */}
        <div className="p-4 sm:p-6 bg-gradient-to-b from-slate-100 to-slate-50 dark:from-slate-950 dark:to-slate-900 flex flex-col items-center justify-center border-b border-slate-200/80 dark:border-slate-800">
          <div className="w-full max-w-[340px] sm:max-w-[380px]">
            <BankCardView
              card={previewCard}
              isUnlocked={true}
              interactive={true}
            />
          </div>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5 font-medium">
            <Sparkles size={12} className="text-amber-500" />
            Toca la tarjeta para voltearla en 3D y ver el reverso
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          {/* Costa Rica Bank Selector Horizontal Scroll */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Banco o Entidad Financiera de Costa Rica
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none touch-pan-x">
              {Object.entries(BANK_PRESETS).map(([bId, preset]) => {
                const isSelected = bank === bId;
                return (
                  <button
                    key={bId}
                    type="button"
                    onClick={() => handleBankChange(bId as BankId)}
                    className={`
                      px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 border cursor-pointer select-none
                      ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-md scale-105"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                      }
                    `}
                  >
                    <span>{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Type, Network & Currency Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Instrument Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Tipo de Cuenta</label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl">
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
                      py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer
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
              <label className="text-xs font-semibold">Moneda</label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl">
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
                      py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer
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
              <label className="text-xs font-semibold">Franquicia</label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl">
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
                      py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <label htmlFor="alias" className="text-xs font-semibold">
                Nombre de la Tarjeta / Alias *
              </label>
              <Input
                id="alias"
                placeholder="ej. BAC Débito Principal, BNCR Ahorros, Scotiabank Platino"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                className="rounded-xl bg-white dark:bg-slate-950 text-xs sm:text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="cardholder" className="text-xs font-semibold">
                Nombre del Titular
              </label>
              <Input
                id="cardholder"
                placeholder="ej. CARLOS ROJAS MORA"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
                className="rounded-xl bg-white dark:bg-slate-950 tracking-wider text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Card Number, Expiration & CVV */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
            <div className="sm:col-span-6 space-y-1.5">
              <label htmlFor="cardNumber" className="text-xs font-semibold">
                Número de Tarjeta (16 dígitos)
              </label>
              <div className="relative">
                <Input
                  id="cardNumber"
                  placeholder="0000 0000 0000 0000"
                  value={formatCardNumber(cardNumber)}
                  onChange={handleCardNumberChange}
                  className="rounded-xl bg-white dark:bg-slate-950 font-mono tracking-widest pl-9 text-xs sm:text-sm"
                  maxLength={19}
                />
                <CreditCard
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
              </div>
            </div>

            <div className="sm:col-span-3 space-y-1.5">
              <label htmlFor="exp" className="text-xs font-semibold">
                Vence (MM/AA)
              </label>
              <div className="relative">
                <Input
                  id="exp"
                  placeholder="12/28"
                  value={expirationDate}
                  onChange={handleExpirationChange}
                  className="rounded-xl bg-white dark:bg-slate-950 font-mono tracking-wider pl-8 text-center text-xs sm:text-sm"
                  maxLength={5}
                />
                <Calendar
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
              </div>
            </div>

            <div className="sm:col-span-3 space-y-1.5">
              <label htmlFor="cvv" className="text-xs font-semibold">
                CVV / CVC
              </label>
              <div className="relative">
                <Input
                  id="cvv"
                  type="password"
                  placeholder="•••"
                  value={cvv}
                  onChange={(e) =>
                    setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  className="rounded-xl bg-white dark:bg-slate-950 font-mono tracking-widest pl-8 text-center text-xs sm:text-sm"
                  maxLength={4}
                />
                <Lock
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
              </div>
            </div>
          </div>

          {/* Costa Rica IBAN & SINPE Móvil */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* IBAN */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="iban" className="text-xs font-semibold">
                  Cuenta IBAN Costa Rica (22 dígitos)
                </label>
                <span
                  className={`text-[10px] font-mono font-bold ${
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
                  className="rounded-xl bg-white dark:bg-slate-950 font-mono tracking-wider pl-9 text-xs sm:text-sm"
                  maxLength={27}
                />
                <Building2
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
              </div>
            </div>

            {/* SINPE Móvil */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="sinpe" className="text-xs font-semibold">
                  Número SINPE Móvil (8 dígitos)
                </label>
                <span
                  className={`text-[10px] font-mono font-bold ${
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
                  className="rounded-xl bg-white dark:bg-slate-950 font-mono tracking-wider pl-9 text-xs sm:text-sm"
                  maxLength={9}
                />
                <Smartphone
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
              </div>
            </div>
          </div>

          {/* Credit Card Specific: Cutoff & Due Day, Credit Limit */}
          {cardType === "credit" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-200/50 dark:border-blue-900/40">
              <div className="space-y-1.5">
                <label htmlFor="cutoff" className="text-xs font-semibold">
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
                  className="rounded-xl bg-white dark:bg-slate-950 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="paymentDue" className="text-xs font-semibold">
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
                  className="rounded-xl bg-white dark:bg-slate-950 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="limit" className="text-xs font-semibold">
                  Límite de Crédito ({currency})
                </label>
                <div className="relative">
                  <Input
                    id="limit"
                    type="number"
                    step="0.01"
                    placeholder={currency === "USD" ? "2000" : "1000000"}
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    className="rounded-xl bg-white dark:bg-slate-950 pl-7 text-xs sm:text-sm"
                  />
                  <Coins
                    size={14}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bank phone & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <label htmlFor="phone" className="text-xs font-semibold">
                Teléfono de Servicio al Cliente
              </label>
              <div className="relative">
                <Input
                  id="phone"
                  placeholder="2295-9898"
                  value={bankPhone}
                  onChange={(e) => setBankPhone(e.target.value)}
                  className="rounded-xl bg-white dark:bg-slate-950 pl-9 font-mono text-xs sm:text-sm"
                />
                <Phone
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="notes" className="text-xs font-semibold">
                Notas Seguras (Cifradas)
              </label>
              <Input
                id="notes"
                placeholder="ej. Token de seguridad en app móvil, sucursal Escazú"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-xl bg-white dark:bg-slate-950 text-xs sm:text-sm"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-row items-center justify-between w-full gap-2">
            {isEditing && onDelete ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="rounded-xl gap-1.5 cursor-pointer text-xs h-9"
              >
                <Trash2 size={14} />
                <span>Eliminar</span>
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl cursor-pointer text-xs h-9"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 cursor-pointer shadow-md text-xs h-9"
              >
                {isSubmitting ? "Guardando..." : "Guardar en Bóveda"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
