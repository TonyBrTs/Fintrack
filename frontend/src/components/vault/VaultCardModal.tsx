"use client";

import React, { useState, useEffect } from "react";
import type { VaultCard, BankId, CardType, CardNetwork } from "@/types";
import { BankCardView, NetworkLogo } from "./BankCardView";
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

  // Card number input formatter with real-time automatic network & card detection
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    const maxLen = raw.startsWith("34") || raw.startsWith("37") ? 15 : 16;
    if (raw.length > maxLen) return;
    setCardNumber(raw);

    // Auto-detect payment network (Visa, Mastercard, Amex, Carnet)
    const detected = detectCardNetwork(raw);
    setCardNetwork(detected);
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
      <DialogContent className="w-[96vw] sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl h-[92vh] max-h-[820px] overflow-hidden p-0 gap-0 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col">
        {/* Modal Top Header */}
        <DialogHeader className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-3 pr-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base sm:text-lg md:text-xl font-bold tracking-tight truncate">
                {isEditing ? "Editar Tarjeta / Cuenta" : "Registrar en Bóveda Bancaria (Costa Rica)"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 truncate">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                Cifrado bancario AES-GCM 256 • Soporte oficial para IBAN y SINPE Móvil
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* 2-Column Split: Showcase on Left, Form on Right */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
          {/* LEFT PANE: 3D Luxury Interactive Card Showcase */}
          <div className="w-full lg:w-[42%] xl:w-[40%] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white border-b lg:border-b-0 lg:border-r border-slate-800 p-6 lg:p-8 flex flex-col justify-between items-center relative overflow-hidden shrink-0">
            {/* Ambient Radial Glow matching Bank Accent Color */}
            <div
              className="absolute -top-20 -left-20 w-72 h-72 rounded-full blur-3xl opacity-25 pointer-events-none transition-all duration-700"
              style={{ backgroundColor: getBankTheme(bank).accentColor || "#3B82F6" }}
            />
            <div
              className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
              style={{ backgroundColor: getBankTheme(bank).accentColor || "#3B82F6" }}
            />

            <div className="w-full flex flex-col items-center z-10 my-auto">
              {/* Header Status in Showcase */}
              <div className="flex items-center justify-between w-full mb-3 px-1">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={14} className="text-blue-400" />
                  {getBankTheme(bank).name}
                </span>
                <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10 flex items-center gap-1.5">
                  <Sparkles size={11} className="text-amber-400" />
                  {cardNetwork !== "other" ? `${cardNetwork.toUpperCase()} DETECTADA` : "TARJETA"}
                </span>
              </div>

              {/* The 3D Bank Card View */}
              <div className="w-full max-w-[380px] py-1">
                <BankCardView
                  card={previewCard}
                  isUnlocked={true}
                  interactive={true}
                  flipped={isCardFlipped}
                  onFlipChange={setIsCardFlipped}
                  focusedField={focusedField}
                  className="shadow-2xl"
                />
              </div>

              {/* Flip Button & Helper */}
              <div className="flex flex-col items-center gap-2 mt-5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCardFlipped(!isCardFlipped)}
                  className="rounded-xl text-xs h-9 px-4 gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-md cursor-pointer backdrop-blur-sm transition-all active:scale-95"
                >
                  <RotateCw size={14} className="text-blue-400" />
                  <span>{isCardFlipped ? "Ver Frente de la Tarjeta" : "Ver Reverso (CVV / IBAN)"}</span>
                </Button>
                <p className="text-[11px] text-slate-400 text-center flex items-center gap-1 font-medium">
                  <span>Haz clic en la tarjeta o enfoca el CVV para girarla</span>
                </p>
              </div>
            </div>

            {/* Security Seal at Bottom */}
            <div className="hidden lg:flex items-center gap-3 w-full p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 z-10 mt-6">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div className="text-[11px] leading-tight">
                <span className="font-semibold text-white block">Cifrado Local AES-256</span>
                Tus datos se encriptan en tu navegador antes de guardarse.
              </div>
            </div>
          </div>

          {/* RIGHT PANE: Clean, Streamlined, Essential Form */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden"
          >
            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-5 pb-14">
              {/* 1. Banco Selector */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="bankSelect" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 size={15} className="text-blue-600 dark:text-blue-400" />
                    Banco o Entidad Financiera (Costa Rica) *
                  </label>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Selecciona tu entidad
                  </span>
                </div>

                {/* Dropdown with all banks */}
                <Select value={bank} onValueChange={(val) => handleBankChange(val as BankId)}>
                  <SelectTrigger id="bankSelect" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm font-semibold">
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

                {/* Quick Select Popular Bank Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  {[
                    { id: "bac", label: "BAC" },
                    { id: "bncr", label: "BNCR" },
                    { id: "bcr", label: "BCR" },
                    { id: "popular", label: "Popular" },
                    { id: "scotiabank", label: "Scotiabank" },
                    { id: "davivienda", label: "Davivienda" },
                    { id: "promerica", label: "Promerica" },
                    { id: "wink", label: "Wink" },
                    { id: "multimoney", label: "MultiMoney" },
                    { id: "coopenae", label: "Coopenae" },
                  ].map((item) => {
                    const isSelected = bank === item.id;
                    const theme = BANK_PRESETS[item.id as BankId];
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleBankChange(item.id as BankId)}
                        className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700/60"
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: theme.accentColor }}
                        />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Tipo de Tarjeta (Débito vs Crédito) & Moneda */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                {/* Débito vs Crédito */}
                <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex-1">
                  <button
                    type="button"
                    onClick={() => setCardType("debit")}
                    className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      cardType === "debit"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <CreditCard size={14} />
                    <span>Tarjeta de Débito</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardType("credit")}
                    className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      cardType === "credit"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Coins size={14} />
                    <span>Tarjeta de Crédito</span>
                  </button>
                </div>

                {/* Moneda */}
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
                    ₡ Colones
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
                    $ Dólares
                  </button>
                </div>
              </div>

              {/* 3. Identificación: Alias & Titular */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="alias" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nombre de la Tarjeta / Alias *
                  </label>
                  <Input
                    id="alias"
                    placeholder="ej. Tarjeta Personal, BAC Débito, BNCR Salario"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
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
                    Nombre del Titular (en el plástico)
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

              {/* 4. Datos de Tarjeta: Número, Exp y CVV */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-6 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="cardNumber" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Número de Tarjeta ({cardNetwork === "amex" ? "15" : "16"} dígitos)
                    </label>
                    {/* Auto-detected card badge */}
                    {cardNetwork === "visa" && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1 animate-in fade-in">
                        <Sparkles size={11} className="text-amber-500" />
                        Visa detectada
                      </span>
                    )}
                    {cardNetwork === "mastercard" && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 flex items-center gap-1 animate-in fade-in">
                        <Sparkles size={11} className="text-amber-500" />
                        Mastercard detectada
                      </span>
                    )}
                    {cardNetwork === "amex" && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 flex items-center gap-1 animate-in fade-in">
                        <Sparkles size={11} className="text-amber-500" />
                        Amex detectada
                      </span>
                    )}
                    {cardNetwork === "other" && (
                      <span className="text-[10px] text-muted-foreground font-medium">
                        Detección automática
                      </span>
                    )}
                  </div>
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
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
                        <NetworkLogo network={cardNetwork} />
                      </div>
                    )}
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
                  <div className="flex items-center justify-between">
                    <label htmlFor="cvv" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      CVV / CVC
                    </label>
                    <span className="text-[10px] text-amber-500 font-semibold flex items-center gap-0.5">
                      <RotateCw size={10} /> 3D
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
                      className="rounded-xl bg-slate-50 dark:bg-slate-950 font-mono tracking-widest pl-9 text-center text-sm h-11 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 ring-offset-2 focus:ring-2 focus:ring-amber-500/50"
                      maxLength={4}
                    />
                    <Lock
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Parámetros de Crédito (SOLO si Tipo === 'credit') */}
              {cardType === "credit" && (
                <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/25 border border-blue-200/70 dark:border-blue-900/40 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                      ₡
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Parámetros de Tarjeta de Crédito
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

              {/* 6. Cuentas Asociadas Costa Rica: IBAN & SINPE */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Cuentas Asociadas en Costa Rica (Opcional)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* IBAN */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="iban" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Cuenta IBAN (22 caracteres)
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

                  {/* SINPE Móvil */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="sinpe" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
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
                        onFocus={() => setFocusedField("sinpe")}
                        onBlur={() => setFocusedField(null)}
                        className="rounded-xl bg-slate-50 dark:bg-slate-950 font-mono tracking-wider pl-10 text-sm h-11 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900"
                        maxLength={9}
                      />
                      <Smartphone
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 7. Teléfono de Servicio & Notas */}
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
                      className="rounded-xl bg-slate-50 dark:bg-slate-950 pl-10 font-mono text-sm h-11 border-slate-200 dark:border-slate-800"
                    />
                    <Phone
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="notes" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Notas Confidenciales
                  </label>
                  <Input
                    id="notes"
                    placeholder="ej. Sucursal Escazú, token digital, etc."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="rounded-xl bg-slate-50 dark:bg-slate-950 text-sm h-11 border-slate-200 dark:border-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Pinned Form Footer */}
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
