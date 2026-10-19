"use client";

import React, { useState, useEffect } from "react";
import type { VaultCard, BankId, CardType, CardNetwork } from "@/types";
import { BankCardView } from "./BankCardView";
import { BANK_PRESETS, getBankTheme } from "@/lib/bankThemes";
import { detectCardNetwork, formatCardNumber } from "@/lib/vaultCrypto";
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
  DollarSign,
  Phone,
  Trash2,
  Sparkles,
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
  const [bank, setBank] = useState<BankId>("bbva");
  const [cardType, setCardType] = useState<CardType>("credit");
  const [cardNetwork, setCardNetwork] = useState<CardNetwork>("visa");
  const [alias, setAlias] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [clabe, setClabe] = useState("");
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
      setBank(cardToEdit.bank || "bbva");
      setCardType(cardToEdit.card_type || "credit");
      setCardNetwork(cardToEdit.card_network || "visa");
      setAlias(cardToEdit.alias || "");
      setCardholderName(cardToEdit.cardholder_name || "");
      setCardNumber(cardToEdit.card_number || "");
      setExpirationDate(cardToEdit.expiration_date || "");
      setCvv(cardToEdit.cvv || "");
      setClabe(cardToEdit.clabe || "");
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
      // Default initial values for new card
      setBank("bbva");
      setCardType("credit");
      setCardNetwork("visa");
      setAlias("");
      setCardholderName("");
      setCardNumber("");
      setExpirationDate("");
      setCvv("");
      setClabe("");
      setAccountNumber("");
      setCutOffDay("");
      setPaymentDueDay("");
      setCreditLimit("");
      setBankPhone("");
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
    if (newBank === "amex") {
      setCardNetwork("amex");
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

  // CLABE formatter 18 digits max
  const handleClabeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 18);
    setClabe(raw);
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
    clabe,
    account_number: accountNumber,
    cut_off_day: cutOffDay ? parseInt(cutOffDay, 10) : null,
    payment_due_day: paymentDueDay ? parseInt(paymentDueDay, 10) : null,
    credit_limit: creditLimit ? parseFloat(creditLimit) : null,
    currency: "MXN",
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

    if (!cardNumber.trim() && !clabe.trim() && !accountNumber.trim()) {
      toast.error("Ingresa al menos un número de tarjeta, CLABE o número de cuenta");
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
        clabe: clabe.replace(/\D/g, ""),
        account_number: accountNumber.trim(),
        cut_off_day: cutOffDay ? parseInt(cutOffDay, 10) : null,
        payment_due_day: paymentDueDay ? parseInt(paymentDueDay, 10) : null,
        credit_limit: creditLimit ? parseFloat(creditLimit) : null,
        currency: "MXN",
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
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0 gap-0 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-3xl">
        <DialogHeader className="p-6 pb-2 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <ShieldCheck size={20} />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">
                {isEditing ? "Editar Tarjeta / Cuenta" : "Registrar en Bóveda"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Protegido con cifrado de grado bancario AES-GCM 256-bit
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Live Card Preview Banner */}
        <div className="p-6 bg-gradient-to-b from-slate-100 to-slate-50 dark:from-slate-950 dark:to-slate-900 flex flex-col items-center justify-center border-b border-slate-200/80 dark:border-slate-800">
          <div className="w-full max-w-[360px]">
            <BankCardView
              card={previewCard}
              isUnlocked={true}
              interactive={true}
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5 font-medium">
            <Sparkles size={13} className="text-amber-500" />
            Toca la tarjeta para voltearla y ver el reverso
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Bank Selector Horizontal Scroll */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Banco o Emisor
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {Object.entries(BANK_PRESETS).map(([bId, preset]) => {
                const isSelected = bank === bId;
                return (
                  <button
                    key={bId}
                    type="button"
                    onClick={() => handleBankChange(bId as BankId)}
                    className={`
                      px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-2 border
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

          {/* Type & Network */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Tipo de Instrumento</label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl">
                {(
                  [
                    { id: "credit", label: "Crédito" },
                    { id: "debit", label: "Débito" },
                    { id: "account", label: "Cuenta" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setCardType(t.id)}
                    className={`
                      py-1.5 text-xs font-semibold rounded-lg transition-all
                      ${
                        cardType === t.id
                          ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                      }
                    `}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Red de Pago</label>
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl">
                {(
                  [
                    { id: "visa", label: "Visa" },
                    { id: "mastercard", label: "Master" },
                    { id: "amex", label: "Amex" },
                    { id: "carnet", label: "Carnet" },
                  ] as const
                ).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => setCardNetwork(n.id)}
                    className={`
                      py-1.5 text-xs font-semibold rounded-lg transition-all
                      ${
                        cardNetwork === n.id
                          ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
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
              <label htmlFor="alias" className="text-xs font-semibold">
                Nombre de la Tarjeta / Alias *
              </label>
              <Input
                id="alias"
                placeholder="ej. BBVA Nómina, Nu Oro, Débito Ahorros"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                className="rounded-xl bg-white dark:bg-slate-950"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="cardholder" className="text-xs font-semibold">
                Nombre del Titular
              </label>
              <Input
                id="cardholder"
                placeholder="ej. JUAN PEREZ LOPEZ"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
                className="rounded-xl bg-white dark:bg-slate-950 tracking-wider"
              />
            </div>
          </div>

          {/* Card Number, Expiration & CVV */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
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
                  className="rounded-xl bg-white dark:bg-slate-950 font-mono tracking-widest pl-9"
                  maxLength={19}
                />
                <CreditCard
                  size={16}
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
                  className="rounded-xl bg-white dark:bg-slate-950 font-mono tracking-wider pl-8 text-center"
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
                  className="rounded-xl bg-white dark:bg-slate-950 font-mono tracking-widest pl-8 text-center"
                  maxLength={4}
                />
                <Lock
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
              </div>
            </div>
          </div>

          {/* CLABE & Account Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="clabe" className="text-xs font-semibold">
                  CLABE Interbancaria (18 dígitos)
                </label>
                <span
                  className={`text-[10px] font-mono font-bold ${
                    clabe.length === 18 ? "text-emerald-500" : "text-muted-foreground"
                  }`}
                >
                  {clabe.length}/18
                </span>
              </div>
              <div className="relative">
                <Input
                  id="clabe"
                  placeholder="012 180 00000000000 0"
                  value={clabe}
                  onChange={handleClabeChange}
                  className="rounded-xl bg-white dark:bg-slate-950 font-mono tracking-wider pl-9"
                  maxLength={18}
                />
                <Building2
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="accountNumber" className="text-xs font-semibold">
                Número de Cuenta (opcional)
              </label>
              <Input
                id="accountNumber"
                placeholder="ej. 1234567890"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="rounded-xl bg-white dark:bg-slate-950 font-mono"
              />
            </div>
          </div>

          {/* Credit Card Specific: Cutoff & Due Day, Credit Limit */}
          {cardType === "credit" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-200/50 dark:border-blue-900/40">
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
                  className="rounded-xl bg-white dark:bg-slate-950"
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
                  className="rounded-xl bg-white dark:bg-slate-950"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="limit" className="text-xs font-semibold">
                  Límite de Crédito
                </label>
                <div className="relative">
                  <Input
                    id="limit"
                    type="number"
                    step="0.01"
                    placeholder="30000"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    className="rounded-xl bg-white dark:bg-slate-950 pl-7"
                  />
                  <DollarSign
                    size={14}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bank phone & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="phone" className="text-xs font-semibold">
                Línea de Atención del Banco
              </label>
              <div className="relative">
                <Input
                  id="phone"
                  placeholder="55 5226 2663"
                  value={bankPhone}
                  onChange={(e) => setBankPhone(e.target.value)}
                  className="rounded-xl bg-white dark:bg-slate-950 pl-9 font-mono"
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
                placeholder="ej. Token físico en gaveta, sucursal Reforma"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-xl bg-white dark:bg-slate-950"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between sm:justify-between w-full">
            {isEditing && onDelete ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="rounded-xl gap-2 cursor-pointer"
              >
                <Trash2 size={16} />
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
                className="rounded-xl cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 cursor-pointer shadow-md"
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
