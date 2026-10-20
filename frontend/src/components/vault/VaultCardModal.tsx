"use client";

import React, { useState, useEffect } from "react";
import type { VaultCard, BankId, CardType, CardNetwork } from "@/types";
import { BankCardView, NetworkLogo } from "./BankCardView";
import { BANK_PRESETS, getBankTheme } from "@/lib/bankThemes";
import {
  detectCardNetwork,
  detectBankFromCardNumber,
  detectBankFromIban,
  detectBankFromText,
  lookupBankByBinOnline,
  formatCardNumber,
  formatIban,
} from "@/lib/vaultCrypto";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CreditCard,
  Building2,
  Calendar,
  Lock,
  Trash2,
  Coins,
  RotateCw,
  Hash,
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

  const [bank, setBank] = useState<BankId>("bac");
  const [cardType, setCardType] = useState<CardType>("debit");
  const [cardNetwork, setCardNetwork] = useState<CardNetwork>("visa");
  const [currency, setCurrency] = useState<"CRC" | "USD">("CRC");
  const [alias, setAlias] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [iban, setIban] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [cutOffDay, setCutOffDay] = useState<string>("");
  const [paymentDueDay, setPaymentDueDay] = useState<string>("");
  const [creditLimit, setCreditLimit] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (cardToEdit) {
      setBank(cardToEdit.bank || "bac");
      setCardType(cardToEdit.card_type || "debit");
      setCardNetwork(cardToEdit.card_network || "visa");
      setCurrency(cardToEdit.currency === "USD" ? "USD" : "CRC");
      setAlias(cardToEdit.alias || "");
      setCardholderName(cardToEdit.cardholder_name || "");
      setCardNumber(cardToEdit.card_number || "");
      setExpirationDate(cardToEdit.expiration_date || "");
      setCvv(cardToEdit.cvv || "");
      setIban(cardToEdit.iban || cardToEdit.clabe || "");
      setAccountNumber(cardToEdit.account_number || "");
      setCutOffDay(cardToEdit.cut_off_day ? String(cardToEdit.cut_off_day) : "");
      setPaymentDueDay(
        cardToEdit.payment_due_day ? String(cardToEdit.payment_due_day) : ""
      );
      setCreditLimit(
        cardToEdit.credit_limit ? String(cardToEdit.credit_limit) : ""
      );
      setNotes(cardToEdit.notes || "");
    } else {
      setBank("bac");
      setCardType("debit");
      setCardNetwork("visa");
      setCurrency("CRC");
      setAlias("");
      setCardholderName("");
      setCardNumber("");
      setExpirationDate("");
      setCvv("");
      setIban("");
      setAccountNumber("");
      setCutOffDay("");
      setPaymentDueDay("");
      setCreditLimit("");
      setNotes("");
    }
  }, [cardToEdit, isOpen]);

  const applyDetectedBank = (detectedBank: BankId) => {
    setBank(detectedBank);
  };

  const handleBankChange = (newBank: BankId) => {
    const theme = getBankTheme(newBank);
    setBank(newBank);
    if (!cardNumber && theme.defaultNetwork) {
      setCardNetwork(theme.defaultNetwork);
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    const maxLen = raw.startsWith("34") || raw.startsWith("37") ? 15 : 16;
    if (raw.length > maxLen) return;
    setCardNumber(raw);

    const detectedNet = detectCardNetwork(raw);
    setCardNetwork(detectedNet);

    const detectedBank = detectBankFromCardNumber(raw);
    if (detectedBank) {
      applyDetectedBank(detectedBank);
    } else if (raw.length >= 6) {
      void lookupBankByBinOnline(raw).then((onlineBank) => {
        if (onlineBank) {
          applyDetectedBank(onlineBank);
        }
      });
    }
  };

  const handleExpirationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let clean = e.target.value.replace(/\D/g, "");
    if (clean.length > 4) clean = clean.slice(0, 4);
    if (clean.length >= 3) {
      setExpirationDate(`${clean.slice(0, 2)}/${clean.slice(2)}`);
    } else {
      setExpirationDate(clean);
    }
  };

  const handleIbanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 22);
    setIban(raw);

    const detectedBank = detectBankFromIban(raw);
    if (detectedBank) {
      applyDetectedBank(detectedBank);
    }
  };

  const handleAliasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAlias(val);
    if (!cardNumber && !iban) {
      const detectedBank = detectBankFromText(val);
      if (detectedBank) {
        applyDetectedBank(detectedBank);
      }
    }
  };

  const previewCard: VaultCard = {
    id: cardToEdit?.id || "preview-id",
    bank,
    bank_name: getBankTheme(bank).name,
    card_type: cardType,
    card_network: cardNetwork,
    alias: alias || (cardType === "account" ? "Cuenta Bancaria" : "Mi Tarjeta"),
    cardholder_name: cardholderName || "TITULAR DE LA CUENTA",
    card_number: cardNumber || "••••••••••••••••",
    last4: cardNumber.replace(/\D/g, "").slice(-4) || "0000",
    expiration_date: expirationDate || "MM/AA",
    cvv: cvv || "•••",
    iban,
    clabe: iban,
    sinpe_movil: "",
    account_number: accountNumber,
    cut_off_day: cutOffDay ? parseInt(cutOffDay, 10) : null,
    payment_due_day: paymentDueDay ? parseInt(paymentDueDay, 10) : null,
    credit_limit: creditLimit ? parseFloat(creditLimit) : null,
    currency,
    bank_phone: "",
    notes,
    is_favorite: cardToEdit?.is_favorite || false,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!alias.trim()) {
      toast.error("Ingresa un nombre o alias para identificar el registro");
      return;
    }

    if (cardType === "account") {
      if (!iban.trim() && !accountNumber.trim()) {
        toast.error("Ingresa la cuenta IBAN o el número de cuenta cliente");
        return;
      }
    } else if (!cardNumber.trim() && !iban.trim() && !accountNumber.trim()) {
      toast.error("Ingresa al menos un número de tarjeta, cuenta IBAN o número de cuenta");
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
        card_number: cardType === "account" ? "" : cardNumber.replace(/\D/g, ""),
        expiration_date: cardType === "account" ? "" : expirationDate.trim(),
        cvv: cardType === "account" ? "" : cvv.trim(),
        iban: iban.trim().toUpperCase(),
        clabe: iban.trim().toUpperCase(),
        sinpe_movil: "",
        account_number: accountNumber.trim(),
        cut_off_day: cardType === "credit" && cutOffDay ? parseInt(cutOffDay, 10) : null,
        payment_due_day:
          cardType === "credit" && paymentDueDay ? parseInt(paymentDueDay, 10) : null,
        credit_limit:
          cardType === "credit" && creditLimit ? parseFloat(creditLimit) : null,
        currency,
        bank_phone: "",
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
    if (confirm("¿Seguro que deseas eliminar este registro de tu bóveda?")) {
      setIsSubmitting(true);
      await onDelete(cardToEdit.id);
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[96vw] sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl h-[92vh] max-h-[820px] overflow-hidden p-0 gap-0 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col">
        <DialogHeader className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-3 pr-6">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              {cardType === "account" ? <Building2 size={20} /> : <CreditCard size={20} />}
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base sm:text-lg font-bold tracking-tight truncate">
                {isEditing ? "Editar Tarjeta o Cuenta" : "Agregar Tarjeta o Cuenta"}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
          <div className="w-full lg:w-[42%] xl:w-[40%] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white border-b lg:border-b-0 lg:border-r border-slate-800 p-6 lg:p-8 flex flex-col justify-center items-center relative overflow-hidden shrink-0">
            <div
              className="absolute -top-20 -left-20 w-72 h-72 rounded-full blur-3xl opacity-25 pointer-events-none transition-all duration-700"
              style={{ backgroundColor: getBankTheme(bank).accentColor || "#3B82F6" }}
            />
            <div
              className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
              style={{ backgroundColor: getBankTheme(bank).accentColor || "#3B82F6" }}
            />

            <div className="w-full flex flex-col items-center z-10">
              <div className="flex items-center justify-between w-full max-w-[380px] mb-3 px-1">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={14} className="text-blue-400" />
                  {getBankTheme(bank).name}
                </span>
                {cardType !== "account" && (
                  <NetworkLogo network={cardNetwork} size="sm" />
                )}
              </div>

              <div className="w-full max-w-[380px] py-1">
                <BankCardView
                  card={previewCard}
                  isUnlocked={true}
                  interactive={cardType !== "account"}
                  flipped={isCardFlipped}
                  onFlipChange={setIsCardFlipped}
                  focusedField={focusedField}
                  className="shadow-2xl"
                />
              </div>

              {cardType !== "account" && (
                <div className="flex flex-col items-center gap-2 mt-5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCardFlipped(!isCardFlipped)}
                    className="rounded-xl text-xs h-9 px-4 gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-md cursor-pointer backdrop-blur-sm transition-all active:scale-95"
                  >
                    <RotateCw size={14} className="text-blue-400" />
                    <span>{isCardFlipped ? "Ver Frente" : "Ver Reverso (CVV / IBAN)"}</span>
                  </Button>
                </div>
              )}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-5 pb-14">
              <div className="space-y-2">
                <label
                  htmlFor="bankSelect"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Building2 size={15} className="text-blue-600 dark:text-blue-400" />
                  Entidad Bancaria *
                </label>

                <Select value={bank} onValueChange={(val) => handleBankChange(val as BankId)}>
                  <SelectTrigger
                    id="bankSelect"
                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm font-semibold"
                  >
                    <SelectValue placeholder="Selecciona tu banco o entidad" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {Object.entries(BANK_PRESETS).map(([bId, preset]) => (
                      <SelectItem key={bId} value={bId} className="py-2.5 cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3 h-3 rounded-full shrink-0 shadow-xs border border-black/10"
                            style={{ backgroundColor: preset.accentColor }}
                          />
                          <span className="font-medium text-sm">{preset.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex-1">
                  <button
                    type="button"
                    onClick={() => setCardType("debit")}
                    className={`flex-1 py-2 px-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      cardType === "debit"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <CreditCard size={14} />
                    <span>Débito</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardType("credit")}
                    className={`flex-1 py-2 px-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      cardType === "credit"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Coins size={14} />
                    <span>Crédito</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCardType("account");
                      setIsCardFlipped(false);
                    }}
                    className={`flex-1 py-2 px-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      cardType === "account"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Building2 size={14} />
                    <span>Cuenta</span>
                  </button>
                </div>

                <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs shrink-0">
                  <button
                    type="button"
                    onClick={() => setCurrency("CRC")}
                    className={`py-2 px-3.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      currency === "CRC"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    ₡ CRC
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency("USD")}
                    className={`py-2 px-3.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      currency === "USD"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    $ USD
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="alias" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nombre / Alias *
                  </label>
                  <Input
                    id="alias"
                    placeholder="ej. BAC Débito, Cuenta BCR, BNCR Salario"
                    value={alias}
                    onChange={handleAliasChange}
                    onFocus={() => {
                      setIsCardFlipped(false);
                      setFocusedField("alias");
                    }}
                    onBlur={() => setFocusedField(null)}
                    className="rounded-xl bg-slate-50 dark:bg-slate-950 text-sm h-11 border-slate-200 dark:border-slate-800"
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
                    className="rounded-xl bg-slate-50 dark:bg-slate-950 tracking-wider text-sm h-11 uppercase border-slate-200 dark:border-slate-800"
                  />
                </div>
              </div>

              {cardType !== "account" && (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-6 space-y-1.5">
                    <label htmlFor="cardNumber" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Número de Tarjeta ({cardNetwork === "amex" ? "15" : "16"} dígitos)
                    </label>
                    <div className="relative">
                      <Input
                        id="cardNumber"
                        placeholder={cardNetwork === "amex" ? "0000 000000 00000" : "0000 0000 0000 0000"}
                        value={formatCardNumber(cardNumber)}
                        onChange={handleCardNumberChange}
                        onFocus={() => {
                          setIsCardFlipped(false);
                          setFocusedField("cardNumber");
                        }}
                        onBlur={() => setFocusedField(null)}
                        className="rounded-xl bg-slate-50 dark:bg-slate-950 font-mono tracking-widest pl-10 pr-14 text-sm h-11 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900"
                        maxLength={cardNetwork === "amex" ? 17 : 19}
                      />
                      <CreditCard
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      {cardNetwork !== "other" && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                          <NetworkLogo network={cardNetwork} size="sm" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-3 space-y-1.5">
                    <label htmlFor="exp" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
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
                        className="rounded-xl bg-slate-50 dark:bg-slate-950 font-mono tracking-wider pl-9 text-center text-sm h-11 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900"
                        maxLength={5}
                      />
                      <Calendar
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3 space-y-1.5">
                    <label htmlFor="cvv" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
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
                        onFocus={() => {
                          setIsCardFlipped(true);
                          setFocusedField("cvv");
                        }}
                        onBlur={() => setFocusedField(null)}
                        className="rounded-xl bg-slate-50 dark:bg-slate-950 font-mono tracking-widest pl-9 text-center text-sm h-11 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900"
                        maxLength={4}
                      />
                      <Lock
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                    </div>
                  </div>
                </div>
              )}

              {cardType === "credit" && (
                <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/25 border border-blue-200/70 dark:border-blue-900/40 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                      {currency === "CRC" ? "₡" : "$"}
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Fechas y Límite de Crédito
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label htmlFor="cutoff" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Día de Corte (1 - 31)
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
                      <label htmlFor="paymentDue" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
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
                      <label htmlFor="limit" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Límite ({currency === "CRC" ? "₡" : "$"})
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
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Cuenta Bancaria
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="iban" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Cuenta IBAN (22 caracteres)
                      </label>
                      <span
                        className={`text-[11px] font-mono font-bold ${
                          iban.replace(/\s+/g, "").length === 22
                            ? "text-emerald-600 dark:text-emerald-400"
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
                        onFocus={() => setFocusedField("iban")}
                        onBlur={() => setFocusedField(null)}
                        className="rounded-xl bg-slate-50 dark:bg-slate-950 font-mono tracking-wider pl-10 text-sm h-11 uppercase border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900"
                        maxLength={27}
                      />
                      <Building2
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="accountNumber" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Número de Cuenta Cliente
                    </label>
                    <div className="relative">
                      <Input
                        id="accountNumber"
                        placeholder="ej. 900834567"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        onFocus={() => setFocusedField("accountNumber")}
                        onBlur={() => setFocusedField(null)}
                        className="rounded-xl bg-slate-50 dark:bg-slate-950 font-mono tracking-wider pl-10 text-sm h-11 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900"
                      />
                      <Hash
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="notes" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Notas
                </label>
                <Input
                  id="notes"
                  placeholder="ej. Cuenta planilla, sucursal, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-xl bg-slate-50 dark:bg-slate-950 text-sm h-11 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-between shrink-0 gap-3">
              {isEditing && onDelete ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="rounded-xl gap-2 cursor-pointer text-xs h-10 px-4 font-semibold shadow-xs"
                >
                  <Trash2 size={15} />
                  <span>Eliminar</span>
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
                  {isSubmitting ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
