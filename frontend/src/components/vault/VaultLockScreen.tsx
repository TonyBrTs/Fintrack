"use client";

import React, { useState, useEffect, useRef } from "react";
import { Lock, ShieldCheck, KeyRound, ArrowRight, Delete, AlertCircle, Keyboard } from "lucide-react";
import { toast } from "sonner";

interface VaultLockScreenProps {
  hasPinConfigured: boolean;
  onUnlock: (pin: string) => Promise<boolean>;
  onSetupPin: (pin: string) => Promise<boolean>;
  onResetPin?: () => void;
}

export function VaultLockScreen({
  hasPinConfigured,
  onUnlock,
  onSetupPin,
  onResetPin,
}: VaultLockScreenProps) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // References to always access the latest state in global keyboard and paste listeners
  const pinRef = useRef(pin);
  pinRef.current = pin;
  const confirmPinRef = useRef(confirmPin);
  confirmPinRef.current = confirmPin;
  const isConfirmingRef = useRef(isConfirming);
  isConfirmingRef.current = isConfirming;
  const loadingRef = useRef(loading);
  loadingRef.current = loading;
  const hasPinConfiguredRef = useRef(hasPinConfigured);
  hasPinConfiguredRef.current = hasPinConfigured;

  // Keypad Click / Keyboard digit input
  const handleDigit = (digit: string) => {
    if (loadingRef.current) return;
    setError(null);
    if (!hasPinConfiguredRef.current) {
      if (!isConfirmingRef.current) {
        setPin((prev) => (prev.length < 6 ? prev + digit : prev));
      } else {
        setConfirmPin((prev) => (prev.length < 6 ? prev + digit : prev));
      }
    } else {
      setPin((prev) => (prev.length < 6 ? prev + digit : prev));
    }
  };

  const handleDelete = () => {
    setError(null);
    if (!hasPinConfiguredRef.current && isConfirmingRef.current) {
      setConfirmPin((prev) => prev.slice(0, -1));
    } else {
      setPin((prev) => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    setError(null);
    setPin("");
    setConfirmPin("");
    setIsConfirming(false);
  };

  // Submit unlock
  const handleUnlockSubmit = async (pinToTest?: string) => {
    const targetPin = pinToTest !== undefined ? pinToTest : pinRef.current;
    if (targetPin.length < 4) {
      setError("El PIN debe tener al menos 4 dígitos");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const success = await onUnlock(targetPin);
      if (!success) {
        setError("PIN incorrecto. Intenta de nuevo.");
        setPin("");
      }
    } catch {
      setError("Error al verificar el PIN.");
    } finally {
      setLoading(false);
    }
  };

  // Submit setup
  const handleSetupNext = () => {
    if (pinRef.current.length < 4) {
      setError("El PIN debe tener entre 4 y 6 dígitos.");
      return;
    }
    setError(null);
    setIsConfirming(true);
  };

  const handleSetupSubmit = async () => {
    if (confirmPinRef.current !== pinRef.current) {
      setError("Los PIN ingresados no coinciden.");
      setConfirmPin("");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const success = await onSetupPin(pinRef.current);
      if (success) {
        toast.success("Bóveda configurada y desbloqueada.");
      } else {
        setError("No se pudo configurar el PIN.");
      }
    } catch {
      setError("Error al guardar la configuración de seguridad.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Hardware Keyboard and Paste Listener:
   * By operating directly via window keydown without an <input> element in the DOM,
   * Bitwarden, 1Password, Chrome, and other password managers CANNOT detect or autofill
   * credentials into the PIN, while physical keyboard typing works 100% smoothly.
   */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Do not intercept if user is typing in a real input elsewhere
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Numeric keys (0-9 from top row or numpad)
      if (
        (e.key >= "0" && e.key <= "9") ||
        (e.code && e.code.startsWith("Numpad") && e.key >= "0" && e.key <= "9")
      ) {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleDelete();
      } else if (e.key === "Escape" || e.key === "Delete") {
        e.preventDefault();
        handleClear();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (hasPinConfiguredRef.current) {
          handleUnlockSubmit();
        } else if (!isConfirmingRef.current) {
          handleSetupNext();
        } else {
          handleSetupSubmit();
        }
      }
    };

    const onPaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text") || "";
      const digits = text.replace(/\D/g, "").slice(0, 6);
      if (digits.length > 0) {
        e.preventDefault();
        for (const char of digits) {
          handleDigit(char);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("paste", onPaste);
    };
  }, []);

  const activeValue = !hasPinConfigured && isConfirming ? confirmPin : pin;

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] py-10 px-4 select-none">
      <div className="w-full max-w-sm bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
        {/* Emblem */}
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center mb-4 shadow-inner">
          {hasPinConfigured ? <Lock size={28} /> : <KeyRound size={28} />}
        </div>

        {/* Title & Description */}
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-titles dark:text-foreground">
          {hasPinConfigured
            ? "Bóveda Protegida"
            : isConfirming
            ? "Confirmar PIN"
            : "Crear PIN de Bóveda"}
        </h2>
        <p className="text-xs text-muted-foreground mt-1 mb-5 max-w-xs leading-relaxed">
          {hasPinConfigured
            ? "Ingresa tu PIN de seguridad para acceder a tus cuentas bancarias y tarjetas."
            : isConfirming
            ? "Vuelve a ingresar el PIN de 4 a 6 dígitos para confirmar."
            : "Establece un código maestro para cifrar y proteger todos tus datos bancarios."}
        </p>

        {/*
          Interactive Keyboard-Ready PIN Box
          Zero <input> tags in DOM = ZERO Bitwarden / browser credential autofill.
          Accepts typing directly from keyboard or on-screen keypad.
        */}
        <div className="w-full py-3.5 px-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col items-center gap-2.5 mb-5 shadow-xs">
          {/* PIN Indicators (Dots) */}
          <div className="flex items-center justify-center gap-3">
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const isFilled = index < activeValue.length;
              const isCurrent = index === activeValue.length;
              return (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full transition-all duration-200 flex items-center justify-center ${
                    isFilled
                      ? "bg-blue-600 scale-110 shadow-xs shadow-blue-500/50"
                      : isCurrent
                      ? "border-2 border-blue-500 bg-blue-500/10 scale-105"
                      : "border-2 border-border/80 bg-muted/40"
                  }`}
                >
                  {isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Typing helper prompt */}
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <Keyboard size={13} className="text-blue-500 shrink-0" />
            <span>Digita con tu teclado o usa la botonera</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="w-full mb-4 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center justify-center gap-1.5 animate-in fade-in">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Keypad Grid (3x4) */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full mb-6">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-13 sm:h-14 rounded-2xl bg-muted/40 hover:bg-muted text-foreground text-xl font-bold font-mono transition-all active:scale-95 border border-border/60 shadow-2xs flex items-center justify-center cursor-pointer"
            >
              {digit}
            </button>
          ))}

          {/* Bottom row: Clear, 0, Delete */}
          <button
            type="button"
            onClick={handleClear}
            className="h-13 sm:h-14 rounded-2xl bg-transparent hover:bg-muted/40 text-muted-foreground text-xs font-semibold transition active:scale-95 flex items-center justify-center cursor-pointer"
          >
            Limpiar
          </button>

          <button
            type="button"
            onClick={() => handleDigit("0")}
            className="h-13 sm:h-14 rounded-2xl bg-muted/40 hover:bg-muted text-foreground text-xl font-bold font-mono transition-all active:scale-95 border border-border/60 shadow-2xs flex items-center justify-center cursor-pointer"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="h-13 sm:h-14 rounded-2xl bg-transparent hover:bg-muted/40 text-muted-foreground transition active:scale-95 flex items-center justify-center cursor-pointer"
            title="Borrar dígito"
          >
            <Delete size={20} />
          </button>
        </div>

        {/* Action Button */}
        {hasPinConfigured ? (
          <button
            type="button"
            onClick={() => handleUnlockSubmit()}
            disabled={pin.length < 4 || loading}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <ShieldCheck size={18} />
            <span>{loading ? "Verificando..." : "Desbloquear Bóveda"}</span>
          </button>
        ) : !isConfirming ? (
          <button
            type="button"
            onClick={handleSetupNext}
            disabled={pin.length < 4 || loading}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <span>Continuar</span>
            <ArrowRight size={16} />
          </button>
        ) : (
          <div className="w-full space-y-2">
            <button
              type="button"
              onClick={handleSetupSubmit}
              disabled={confirmPin.length < 4 || loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <ShieldCheck size={18} />
              <span>{loading ? "Guardando..." : "Confirmar y Activar"}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsConfirming(false);
                setConfirmPin("");
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition underline cursor-pointer"
            >
              Cambiar PIN anterior
            </button>
          </div>
        )}

        {/* Security badge at bottom */}
        <div className="mt-6 pt-4 border-t border-border/40 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Cifrado local AES-256 de extremo a extremo</span>
        </div>
      </div>
    </div>
  );
}
