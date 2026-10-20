"use client";

import React, { useState, useEffect, useRef } from "react";
import { Lock, KeyRound, ArrowRight, Delete, AlertCircle, Keyboard } from "lucide-react";
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
}: VaultLockScreenProps) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleUnlockSubmit = async (pinToTest?: string) => {
    const targetPin = pinToTest !== undefined ? pinToTest : pinRef.current;
    if (targetPin.length < 4) {
      setError("El PIN debe tener entre 4 y 6 dígitos.");
      return;
    }
    try {
      setLoading(true);
      loadingRef.current = true;
      setError(null);
      const success = await onUnlock(targetPin);
      if (!success) {
        setError("PIN incorrecto.");
        pinRef.current = "";
        setPin("");
      }
    } catch {
      setError("Error al verificar el PIN.");
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const handleSetupNext = (pinValue?: string) => {
    const currentPin = pinValue !== undefined ? pinValue : pinRef.current;
    if (currentPin.length < 4) {
      setError("El PIN debe tener entre 4 y 6 dígitos.");
      return;
    }
    setError(null);
    isConfirmingRef.current = true;
    setIsConfirming(true);
  };

  const handleSetupSubmit = async (confirmValue?: string) => {
    const targetConfirm = confirmValue !== undefined ? confirmValue : confirmPinRef.current;
    if (targetConfirm !== pinRef.current) {
      setError("Los PIN ingresados no coinciden.");
      confirmPinRef.current = "";
      setConfirmPin("");
      return;
    }
    try {
      setLoading(true);
      loadingRef.current = true;
      setError(null);
      const success = await onSetupPin(pinRef.current);
      if (success) {
        toast.success("PIN configurado.");
      } else {
        setError("No se pudo guardar el PIN.");
      }
    } catch {
      setError("Error al guardar el PIN.");
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const handleDigit = (digit: string) => {
    if (loadingRef.current) return;
    setError(null);

    if (hasPinConfiguredRef.current) {
      if (pinRef.current.length >= 6) return;
      const next = pinRef.current + digit;
      pinRef.current = next;
      setPin(next);
      if (next.length === 6) {
        void handleUnlockSubmit(next);
      }
    } else if (!isConfirmingRef.current) {
      if (pinRef.current.length >= 6) return;
      const next = pinRef.current + digit;
      pinRef.current = next;
      setPin(next);
      if (next.length === 6) {
        handleSetupNext(next);
      }
    } else {
      if (confirmPinRef.current.length >= 6) return;
      const next = confirmPinRef.current + digit;
      confirmPinRef.current = next;
      setConfirmPin(next);
      if (next.length === 6 || next.length === pinRef.current.length) {
        void handleSetupSubmit(next);
      }
    }
  };

  const handleDelete = () => {
    if (loadingRef.current) return;
    setError(null);
    if (!hasPinConfiguredRef.current && isConfirmingRef.current) {
      const next = confirmPinRef.current.slice(0, -1);
      confirmPinRef.current = next;
      setConfirmPin(next);
    } else {
      const next = pinRef.current.slice(0, -1);
      pinRef.current = next;
      setPin(next);
    }
  };

  const handleClear = () => {
    if (loadingRef.current) return;
    setError(null);
    pinRef.current = "";
    confirmPinRef.current = "";
    isConfirmingRef.current = false;
    setPin("");
    setConfirmPin("");
    setIsConfirming(false);
  };

  // Global keyboard listener without DOM <input> to prevent password manager autofill
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

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
          void handleUnlockSubmit();
        } else if (!isConfirmingRef.current) {
          handleSetupNext();
        } else {
          void handleSetupSubmit();
        }
      }
    };

    const onPaste = (e: ClipboardEvent) => {
      if (loadingRef.current) return;
      const text = e.clipboardData?.getData("text") || "";
      const digits = text.replace(/\D/g, "").slice(0, 6);
      if (digits.length > 0) {
        e.preventDefault();
        setError(null);
        if (hasPinConfiguredRef.current) {
          pinRef.current = digits;
          setPin(digits);
          if (digits.length === 6) {
            void handleUnlockSubmit(digits);
          }
        } else if (!isConfirmingRef.current) {
          pinRef.current = digits;
          setPin(digits);
          if (digits.length === 6) {
            handleSetupNext(digits);
          }
        } else {
          confirmPinRef.current = digits;
          setConfirmPin(digits);
          if (digits.length === 6 || digits.length === pinRef.current.length) {
            void handleSetupSubmit(digits);
          }
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
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center mb-4">
          {hasPinConfigured ? <Lock size={26} /> : <KeyRound size={26} />}
        </div>

        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-titles dark:text-foreground">
          {hasPinConfigured
            ? "Bóveda"
            : isConfirming
            ? "Confirmar PIN"
            : "Crear PIN"}
        </h2>
        <p className="text-xs text-muted-foreground mt-1 mb-5 max-w-xs leading-relaxed">
          {hasPinConfigured
            ? "Ingresa tu PIN de 6 dígitos para desbloquear tus tarjetas y cuentas."
            : isConfirming
            ? "Ingresa nuevamente el PIN para confirmar."
            : "Define un PIN de 4 a 6 dígitos para el acceso a tu bóveda."}
        </p>

        <div className="w-full py-3.5 px-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col items-center gap-2.5 mb-5">
          <div className="flex items-center justify-center gap-3">
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const isFilled = index < activeValue.length;
              const isCurrent = index === activeValue.length;
              return (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full transition-all duration-150 flex items-center justify-center ${
                    isFilled
                      ? "bg-blue-600 scale-110"
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

          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <Keyboard size={13} className="text-blue-500 shrink-0" />
            <span>Digita con tu teclado o usa el panel numérico</span>
          </div>
        </div>

        {error && (
          <div className="w-full mb-4 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center justify-center gap-1.5">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full mb-6">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-13 sm:h-14 rounded-2xl bg-muted/40 hover:bg-muted text-foreground text-xl font-bold font-mono transition-all active:scale-95 border border-border/60 flex items-center justify-center cursor-pointer"
            >
              {digit}
            </button>
          ))}

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
            className="h-13 sm:h-14 rounded-2xl bg-muted/40 hover:bg-muted text-foreground text-xl font-bold font-mono transition-all active:scale-95 border border-border/60 flex items-center justify-center cursor-pointer"
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

        {hasPinConfigured ? (
          <button
            type="button"
            onClick={() => void handleUnlockSubmit()}
            disabled={pin.length < 4 || loading}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <span>{loading ? "Verificando..." : "Desbloquear"}</span>
          </button>
        ) : !isConfirming ? (
          <button
            type="button"
            onClick={() => handleSetupNext()}
            disabled={pin.length < 4 || loading}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <span>Continuar</span>
            <ArrowRight size={16} />
          </button>
        ) : (
          <div className="w-full space-y-2">
            <button
              type="button"
              onClick={() => void handleSetupSubmit()}
              disabled={confirmPin.length < 4 || loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>{loading ? "Guardando..." : "Confirmar PIN"}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                isConfirmingRef.current = false;
                confirmPinRef.current = "";
                setIsConfirming(false);
                setConfirmPin("");
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition underline cursor-pointer"
            >
              Volver al paso anterior
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
