"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import type { VaultCard, VaultSettings, BankId, CardType, CardNetwork } from "@/types";
import {
  generateSalt,
  hashPin,
  encryptText,
  decryptText,
  detectCardNetwork,
} from "@/lib/vaultCrypto";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface VaultContextType {
  isUnlocked: boolean;
  hasPin: boolean;
  isLoading: boolean;
  cards: VaultCard[];
  autoLockMinutes: number;
  unlockVault: (pin: string) => Promise<boolean>;
  setupPin: (pin: string) => Promise<boolean>;
  lockVault: () => void;
  addCard: (cardData: Omit<VaultCard, "id" | "last4">) => Promise<VaultCard | null>;
  updateCard: (id: string, cardData: Partial<VaultCard>) => Promise<VaultCard | null>;
  deleteCard: (id: string) => Promise<boolean>;
  toggleFavorite: (id: string) => Promise<void>;
  changePin: (oldPin: string, newPin: string) => Promise<boolean>;
}

const LOCAL_VAULT_SETTINGS_KEY = "fintrack_vault_settings_v1";
const LOCAL_VAULT_CARDS_KEY = "fintrack_vault_cards_v1";

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cards, setCards] = useState<VaultCard[]>([]);
  const [autoLockMinutes, setAutoLockMinutes] = useState(5);

  // In-memory secrets (never written to disk or localStorage in plain text)
  const currentPinRef = useRef<string | null>(null);
  const currentSaltRef = useRef<string | null>(null);
  const lockTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetLockTimer = useCallback(() => {
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    if (!isUnlocked || autoLockMinutes <= 0) return;

    lockTimerRef.current = setTimeout(() => {
      lockVault();
      toast.info("Bóveda bloqueada por inactividad");
    }, autoLockMinutes * 60 * 1000);
  }, [isUnlocked, autoLockMinutes]);

  const lockVault = useCallback(() => {
    setIsUnlocked(false);
    setCards([]);
    currentPinRef.current = null;
    currentSaltRef.current = null;
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
  }, []);

  // Listen to tab visibility & user interactions to auto-lock or reset timer
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isUnlocked) {
        lockVault();
      }
    };

    const handleUserActivity = () => {
      if (isUnlocked) resetLockTimer();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("mousemove", handleUserActivity);
    window.addEventListener("keydown", handleUserActivity);
    window.addEventListener("touchstart", handleUserActivity);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
      window.removeEventListener("touchstart", handleUserActivity);
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    };
  }, [isUnlocked, lockVault, resetLockTimer]);

  // Check whether PIN is already configured (Supabase or LocalStorage)
  const checkPinStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      if (user) {
        const { data, error } = await supabase
          .from("vault_settings")
          .select("pin_hash, salt, auto_lock_minutes")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data && data.pin_hash && data.salt) {
          setHasPin(true);
          currentSaltRef.current = data.salt;
          if (data.auto_lock_minutes) setAutoLockMinutes(data.auto_lock_minutes);
        } else {
          setHasPin(false);
        }
      } else {
        // Guest mode fallback
        const saved = localStorage.getItem(LOCAL_VAULT_SETTINGS_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.pin_hash && parsed.salt) {
              setHasPin(true);
              currentSaltRef.current = parsed.salt;
              if (parsed.auto_lock_minutes) setAutoLockMinutes(parsed.auto_lock_minutes);
            } else {
              setHasPin(false);
            }
          } catch {
            setHasPin(false);
          }
        } else {
          setHasPin(false);
        }
      }
    } catch (err) {
      console.error("Error checking vault PIN status:", err);
      setHasPin(false);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkPinStatus();
    lockVault();
  }, [checkPinStatus, lockVault]);

  // Setup PIN for the first time
  const setupPin = async (pin: string): Promise<boolean> => {
    try {
      const salt = generateSalt(16);
      const pin_hash = await hashPin(pin, salt);

      if (user) {
        const { error } = await supabase.from("vault_settings").upsert({
          user_id: user.id,
          pin_hash,
          salt,
          auto_lock_minutes: autoLockMinutes,
          updated_at: new Date().toISOString(),
        });

        if (error) {
          toast.error("Error guardando contraseña en servidor: " + error.message);
          return false;
        }
      } else {
        localStorage.setItem(
          LOCAL_VAULT_SETTINGS_KEY,
          JSON.stringify({
            pin_hash,
            salt,
            auto_lock_minutes: autoLockMinutes,
          })
        );
      }

      currentPinRef.current = pin;
      currentSaltRef.current = salt;
      setHasPin(true);
      setIsUnlocked(true);
      setCards([]);
      toast.success("Bóveda protegida exitosamente con tu nuevo PIN");
      return true;
    } catch (err) {
      console.error("Error setting up PIN:", err);
      toast.error("Error al configurar el PIN de seguridad");
      return false;
    }
  };

  // Unlock Vault and decrypt cards
  const unlockVault = async (pin: string): Promise<boolean> => {
    try {
      let expectedHash = "";
      let salt = currentSaltRef.current || "";

      if (user) {
        const { data, error } = await supabase
          .from("vault_settings")
          .select("pin_hash, salt, auto_lock_minutes")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error || !data) {
          toast.error("No se encontró configuración de bóveda");
          return false;
        }
        expectedHash = data.pin_hash;
        salt = data.salt;
        if (data.auto_lock_minutes) setAutoLockMinutes(data.auto_lock_minutes);
      } else {
        const saved = localStorage.getItem(LOCAL_VAULT_SETTINGS_KEY);
        if (!saved) {
          toast.error("No se encontró configuración local de bóveda");
          return false;
        }
        const parsed = JSON.parse(saved);
        expectedHash = parsed.pin_hash;
        salt = parsed.salt;
        if (parsed.auto_lock_minutes) setAutoLockMinutes(parsed.auto_lock_minutes);
      }

      const inputHash = await hashPin(pin, salt);
      if (inputHash !== expectedHash) {
        return false;
      }

      currentPinRef.current = pin;
      currentSaltRef.current = salt;

      // Load cards and decrypt
      await loadAndDecryptCards(pin, salt);

      setIsUnlocked(true);
      resetLockTimer();
      toast.success("Bóveda desbloqueada", { duration: 1800 });
      return true;
    } catch (err) {
      console.error("Error unlocking vault:", err);
      toast.error("Ocurrió un error al verificar el PIN");
      return false;
    }
  };

  // Decrypt raw records from Supabase / localStorage
  const loadAndDecryptCards = async (pin: string, salt: string) => {
    try {
      let rawRecords: any[] = [];

      if (user) {
        const { data, error } = await supabase
          .from("vault_cards")
          .select("*")
          .eq("user_id", user.id)
          .order("is_favorite", { ascending: false })
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching vault cards:", error);
          toast.error("No se pudieron cargar las tarjetas de la nube");
          return;
        }
        rawRecords = data || [];
      } else {
        const rawLocal = localStorage.getItem(LOCAL_VAULT_CARDS_KEY);
        rawRecords = rawLocal ? JSON.parse(rawLocal) : [];
      }

      const decrypted: VaultCard[] = await Promise.all(
        rawRecords.map(async (row) => {
          const rawCardNumber = row.card_number || row.encrypted_card_number || "";
          const rawClabe = row.clabe || row.encrypted_clabe || "";
          const rawAccount = row.account_number || row.encrypted_account_number || "";
          const rawExp = row.expiration_date || row.encrypted_expiration_date || "";
          const rawCvv = row.cvv || row.encrypted_cvv || "";
          const rawNotes = row.notes || row.encrypted_notes || "";

          const cardNumber = rawCardNumber
            ? await decryptText(rawCardNumber, pin, salt)
            : "";
          const clabe = rawClabe
            ? await decryptText(rawClabe, pin, salt)
            : "";
          const accountNumber = rawAccount
            ? await decryptText(rawAccount, pin, salt)
            : "";
          const expirationDate = rawExp
            ? await decryptText(rawExp, pin, salt)
            : "";
          const cvv = rawCvv
            ? await decryptText(rawCvv, pin, salt)
            : "";
          const notes = rawNotes
            ? await decryptText(rawNotes, pin, salt)
            : "";

          return {
            id: row.id,
            user_id: row.user_id,
            bank: row.bank,
            bank_name: row.bank_name,
            card_type: row.card_type,
            card_network: row.card_network,
            alias: row.alias,
            cardholder_name: row.cardholder_name,
            card_number: cardNumber,
            last4: row.last4 || cardNumber.slice(-4),
            iban: clabe,
            clabe,
            sinpe_movil: "",
            account_number: accountNumber,
            expiration_date: expirationDate,
            cvv,
            cut_off_day: row.cut_off_day,
            payment_due_day: row.payment_due_day,
            credit_limit: row.credit_limit,
            currency: row.currency || "CRC",
            color_scheme: row.color_scheme,
            bank_phone: row.bank_phone,
            notes,
            is_favorite: row.is_favorite || false,
            created_at: row.created_at,
            updated_at: row.updated_at,
          };
        })
      );

      setCards(decrypted);
    } catch (err) {
      console.error("Error decrypting cards:", err);
      toast.error("Error descifrando tarjetas de la bóveda");
    }
  };

  // Add Card
  const addCard = async (
    cardData: Omit<VaultCard, "id" | "last4">
  ): Promise<VaultCard | null> => {
    const pin = currentPinRef.current;
    const salt = currentSaltRef.current;
    if (!pin || !salt) {
      toast.error("La bóveda no está desbloqueada");
      return null;
    }

    try {
      const cleanDigits = cardData.card_number.replace(/\D/g, "");
      const last4 = cleanDigits.slice(-4) || "";
      const detectedNetwork =
        cardData.card_network && cardData.card_network !== "other"
          ? cardData.card_network
          : detectCardNetwork(cleanDigits);

      const encryptedCardNumber = cleanDigits
        ? await encryptText(cleanDigits, pin, salt)
        : "";
      const ibanVal = cardData.iban || cardData.clabe || "";
      const sinpeVal = cardData.sinpe_movil || cardData.account_number || "";

      const encryptedClabe = ibanVal
        ? await encryptText(ibanVal.toUpperCase().replace(/[^A-Z0-9]/g, ""), pin, salt)
        : "";
      const encryptedAccount = sinpeVal
        ? await encryptText(sinpeVal, pin, salt)
        : "";
      const encryptedExp = cardData.expiration_date
        ? await encryptText(cardData.expiration_date, pin, salt)
        : "";
      const encryptedCvv = cardData.cvv
        ? await encryptText(cardData.cvv, pin, salt)
        : "";
      const encryptedNotes = cardData.notes
        ? await encryptText(cardData.notes, pin, salt)
        : "";

      const newId = crypto.randomUUID();
      const now = new Date().toISOString();

      if (user) {
        const payload = {
          id: newId,
          user_id: user.id,
          bank: cardData.bank,
          bank_name: cardData.bank_name,
          card_type: cardData.card_type,
          card_network: detectedNetwork,
          alias: cardData.alias,
          cardholder_name: cardData.cardholder_name,
          card_number: encryptedCardNumber,
          last4,
          clabe: encryptedClabe,
          account_number: encryptedAccount,
          expiration_date: encryptedExp,
          cvv: encryptedCvv,
          cut_off_day: cardData.cut_off_day,
          payment_due_day: cardData.payment_due_day,
          credit_limit: cardData.credit_limit,
          currency: cardData.currency || "CRC",
          color_scheme: cardData.color_scheme || "auto",
          bank_phone: cardData.bank_phone || "",
          notes: encryptedNotes,
          is_favorite: cardData.is_favorite || false,
          created_at: now,
          updated_at: now,
        };

        const { error } = await supabase.from("vault_cards").insert(payload);
        if (error) {
          toast.error("Error al guardar en Supabase: " + error.message);
          return null;
        }
      } else {
        // LocalStorage fallback
        const rawLocal = localStorage.getItem(LOCAL_VAULT_CARDS_KEY);
        const existing = rawLocal ? JSON.parse(rawLocal) : [];
        const payload = {
          id: newId,
          bank: cardData.bank,
          bank_name: cardData.bank_name,
          card_type: cardData.card_type,
          card_network: detectedNetwork,
          alias: cardData.alias,
          cardholder_name: cardData.cardholder_name,
          card_number: encryptedCardNumber,
          last4,
          clabe: encryptedClabe,
          account_number: encryptedAccount,
          expiration_date: encryptedExp,
          cvv: encryptedCvv,
          cut_off_day: cardData.cut_off_day,
          payment_due_day: cardData.payment_due_day,
          credit_limit: cardData.credit_limit,
          currency: cardData.currency || "CRC",
          color_scheme: cardData.color_scheme || "auto",
          bank_phone: cardData.bank_phone || "",
          notes: encryptedNotes,
          is_favorite: cardData.is_favorite || false,
          created_at: now,
          updated_at: now,
        };
        localStorage.setItem(LOCAL_VAULT_CARDS_KEY, JSON.stringify([payload, ...existing]));
      }

      const createdCard: VaultCard = {
        ...cardData,
        id: newId,
        last4,
        card_network: detectedNetwork,
        card_number: cleanDigits,
        created_at: now,
        updated_at: now,
      };

      setCards((prev) => [createdCard, ...prev]);
      toast.success("Tarjeta guardada y cifrada exitosamente");
      return createdCard;
    } catch (err) {
      console.error("Error adding vault card:", err);
      toast.error("Error al agregar tarjeta a la bóveda");
      return null;
    }
  };

  // Update Card
  const updateCard = async (
    id: string,
    updates: Partial<VaultCard>
  ): Promise<VaultCard | null> => {
    const pin = currentPinRef.current;
    const salt = currentSaltRef.current;
    if (!pin || !salt) {
      toast.error("La bóveda no está desbloqueada");
      return null;
    }

    try {
      const existingCard = cards.find((c) => c.id === id);
      if (!existingCard) return null;

      const merged: VaultCard = { ...existingCard, ...updates };
      const cleanDigits = merged.card_number.replace(/\D/g, "");
      const last4 = cleanDigits.slice(-4) || "";
      const now = new Date().toISOString();

      const encryptedCardNumber = cleanDigits
        ? await encryptText(cleanDigits, pin, salt)
        : "";
      const ibanVal = merged.iban || merged.clabe || "";
      const sinpeVal = merged.sinpe_movil || merged.account_number || "";

      const encryptedClabe = ibanVal
        ? await encryptText(ibanVal.toUpperCase().replace(/[^A-Z0-9]/g, ""), pin, salt)
        : "";
      const encryptedAccount = sinpeVal
        ? await encryptText(sinpeVal, pin, salt)
        : "";
      const encryptedExp = merged.expiration_date
        ? await encryptText(merged.expiration_date, pin, salt)
        : "";
      const encryptedCvv = merged.cvv
        ? await encryptText(merged.cvv, pin, salt)
        : "";
      const encryptedNotes = merged.notes
        ? await encryptText(merged.notes, pin, salt)
        : "";

      if (user) {
        const payload = {
          bank: merged.bank,
          bank_name: merged.bank_name,
          card_type: merged.card_type,
          card_network: merged.card_network,
          alias: merged.alias,
          cardholder_name: merged.cardholder_name,
          card_number: encryptedCardNumber,
          last4,
          clabe: encryptedClabe,
          account_number: encryptedAccount,
          expiration_date: encryptedExp,
          cvv: encryptedCvv,
          cut_off_day: merged.cut_off_day,
          payment_due_day: merged.payment_due_day,
          credit_limit: merged.credit_limit,
          currency: merged.currency,
          color_scheme: merged.color_scheme || "auto",
          bank_phone: merged.bank_phone || "",
          notes: encryptedNotes,
          is_favorite: merged.is_favorite,
          updated_at: now,
        };

        const { error } = await supabase
          .from("vault_cards")
          .update(payload)
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) {
          toast.error("Error actualizando en servidor: " + error.message);
          return null;
        }
      } else {
        const rawLocal = localStorage.getItem(LOCAL_VAULT_CARDS_KEY);
        const existing = rawLocal ? JSON.parse(rawLocal) : [];
        const updatedList = existing.map((row: any) => {
          if (row.id === id) {
            return {
              ...row,
              bank: merged.bank,
              bank_name: merged.bank_name,
              card_type: merged.card_type,
              card_network: merged.card_network,
              alias: merged.alias,
              cardholder_name: merged.cardholder_name,
              card_number: encryptedCardNumber,
              last4,
              clabe: encryptedClabe,
              account_number: encryptedAccount,
              expiration_date: encryptedExp,
              cvv: encryptedCvv,
              cut_off_day: merged.cut_off_day,
              payment_due_day: merged.payment_due_day,
              credit_limit: merged.credit_limit,
              currency: merged.currency,
              color_scheme: merged.color_scheme || "auto",
              bank_phone: merged.bank_phone || "",
              notes: encryptedNotes,
              is_favorite: merged.is_favorite,
              updated_at: now,
            };
          }
          return row;
        });
        localStorage.setItem(LOCAL_VAULT_CARDS_KEY, JSON.stringify(updatedList));
      }

      const updatedCard = { ...merged, last4, updated_at: now };
      setCards((prev) => prev.map((c) => (c.id === id ? updatedCard : c)));
      toast.success("Tarjeta actualizada correctamente");
      return updatedCard;
    } catch (err) {
      console.error("Error updating card:", err);
      toast.error("Error al actualizar la tarjeta");
      return null;
    }
  };

  // Delete Card
  const deleteCard = async (id: string): Promise<boolean> => {
    try {
      if (user) {
        const { error } = await supabase
          .from("vault_cards")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) {
          toast.error("Error al eliminar de la base de datos: " + error.message);
          return false;
        }
      } else {
        const rawLocal = localStorage.getItem(LOCAL_VAULT_CARDS_KEY);
        const existing = rawLocal ? JSON.parse(rawLocal) : [];
        const filtered = existing.filter((c: any) => c.id !== id);
        localStorage.setItem(LOCAL_VAULT_CARDS_KEY, JSON.stringify(filtered));
      }

      setCards((prev) => prev.filter((c) => c.id !== id));
      toast.success("Tarjeta eliminada de la bóveda");
      return true;
    } catch (err) {
      console.error("Error deleting card:", err);
      toast.error("Error al eliminar la tarjeta");
      return false;
    }
  };

  // Toggle Favorite
  const toggleFavorite = async (id: string) => {
    const card = cards.find((c) => c.id === id);
    if (!card) return;
    await updateCard(id, { is_favorite: !card.is_favorite });
  };

  // Change PIN (re-encrypts all sensitive fields with new PIN)
  const changePin = async (oldPin: string, newPin: string): Promise<boolean> => {
    try {
      const currentSalt = currentSaltRef.current;
      if (!currentSalt) return false;

      const oldHash = await hashPin(oldPin, currentSalt);
      let expectedHash = "";

      if (user) {
        const { data } = await supabase
          .from("vault_settings")
          .select("pin_hash")
          .eq("user_id", user.id)
          .single();
        expectedHash = data?.pin_hash || "";
      } else {
        const saved = localStorage.getItem(LOCAL_VAULT_SETTINGS_KEY);
        if (saved) expectedHash = JSON.parse(saved).pin_hash;
      }

      if (oldHash !== expectedHash) {
        toast.error("El PIN anterior es incorrecto");
        return false;
      }

      const newSalt = generateSalt(16);
      const newHash = await hashPin(newPin, newSalt);

      // Re-encrypt existing cards in memory with new PIN and salt
      for (const card of cards) {
        await updateCard(card.id, { ...card });
      }

      if (user) {
        await supabase
          .from("vault_settings")
          .update({
            pin_hash: newHash,
            salt: newSalt,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
      } else {
        localStorage.setItem(
          LOCAL_VAULT_SETTINGS_KEY,
          JSON.stringify({
            pin_hash: newHash,
            salt: newSalt,
            auto_lock_minutes: autoLockMinutes,
          })
        );
      }

      currentPinRef.current = newPin;
      currentSaltRef.current = newSalt;
      toast.success("PIN actualizado exitosamente");
      return true;
    } catch (err) {
      console.error("Error changing PIN:", err);
      toast.error("Error al cambiar el PIN");
      return false;
    }
  };

  return (
    <VaultContext.Provider
      value={{
        isUnlocked,
        hasPin,
        isLoading,
        cards,
        autoLockMinutes,
        unlockVault,
        setupPin,
        lockVault,
        addCard,
        updateCard,
        deleteCard,
        toggleFavorite,
        changePin,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};

export function useVault() {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error("useVault must be used within a VaultProvider");
  }
  return context;
}
