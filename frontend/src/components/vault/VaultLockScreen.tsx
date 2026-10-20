"use client";

import React, { useState, useEffect } from "react";
import { Lock, ShieldCheck, KeyRound, ArrowRight, Delete, AlertCircle } from "lucide-react";
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

  // Keypad Click
  const handleDigit = (digit: string) => {
    if (loading) return;
    setError(null);
    if (!hasPinConfigured) {
      if (!isConfirming) {
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
    if (!hasPinConfigured && isConfirming) {
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
  const handleUnlockSubmit = async (pinToTest = pin) => {
    if (pinToTest.length < 4) {
      setError("El PIN debe tener al menos 4 dígitos");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const success = await onUnlock(pinToTest);
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
    if (pin.length < 4) {
      setError("El PIN debe tener entre 4 y 6 dígitos.");
      return;
    }
    setError(null);
    setIsConfirming(true);
  };

  const handleSetupSubmit = async () => {
    if (confirmPin !== pin) {
      setError("Los PIN ingresados no coinciden.");
      setConfirmPin("");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const success = await onSetupPin(pin);
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

  // Physical keyboard listener: captures typing without relying on a password input that browsers autofill
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Do not intercept if typing in a visible external input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        if (e.target.id !== "vault_security_pin_input") return;
      }

      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleDelete();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleClear();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (hasPinConfigured) {
          handleUnlockSubmit();
        } else if (!isConfirming) {
          handleSetupNext();
        } else {
          handleSetupSubmit();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hasPinConfigured, isConfirming, pin, confirmPin, loading]);

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
        <p className="text-xs text-muted-foreground mt-1 mb-6 max-w-xs leading-relaxed">
          {hasPinConfigured
            ? "Ingresa tu PIN de seguridad para acceder a tus cuentas bancarias y tarjetas."
            : isConfirming
            ? "Vuelve a ingresar el PIN de 4 a 6 dígitos para confirmar."
            : "Establece un código maestro para cifrar y proteger todos tus datos bancarios."}
        </p>

        {/* PIN Indicators (Dots) */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const isFilled = index < activeValue.length;
            return (
              <div
                key={index}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  isFilled
                    ? "bg-blue-600 scale-110 shadow-xs shadow-blue-500/50"
                    : "border-2 border-border/80 bg-muted/30"
                }`}
              />
            );
          })}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="w-full mb-4 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center justify-center gap-1.5 animate-in fade-in">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/*
          Anti-Autofill Input:
          Strictly prevents browser credential autofill and password manager popups.
          Does not use type="password" or autofocus.
        */}
        <input
          id="vault_security_pin_input"
          name="vault_pin_manual_only"
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-lpignore="true"
          data-1p-ignore="true"
          data-bwignore="true"
          data-form-type="other"
          aria-autocomplete="none"
          value={activeValue}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, "");
            if (raw.length <= 6) {
              if (!hasPinConfigured && isConfirming) {
                setConfirmPin(raw);
              } else {
                setPin(raw);
              }
            }
          }}
          className="sr-only"
          tabIndex={-1}
        />

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
