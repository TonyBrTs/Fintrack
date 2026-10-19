/**
 * Financial Vault Cryptography & Utility Helpers
 * Implements Web Crypto API (PBKDF2 + AES-GCM 256-bit)
 */

export function generateSalt(length = 16): string {
  const array = new Uint8Array(length);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < length; i++) array[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${pin}:${salt}:fintrack_vault_v1`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function deriveKey(pin: string, salt: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptText(plainText: string, pin: string, salt: string): Promise<string> {
  if (!plainText) return "";
  try {
    const key = await deriveKey(pin, salt);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encoded = enc.encode(plainText);

    const cipherBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoded
    );

    const cipherArray = Array.from(new Uint8Array(cipherBuffer));
    const ivArray = Array.from(iv);

    return JSON.stringify({
      iv: ivArray.map((b) => b.toString(16).padStart(2, "0")).join(""),
      data: cipherArray.map((b) => b.toString(16).padStart(2, "0")).join(""),
    });
  } catch (err) {
    console.error("Vault encryption error:", err);
    return plainText; // Safe fallback
  }
}

export async function decryptText(cipherJson: string, pin: string, salt: string): Promise<string> {
  if (!cipherJson) return "";
  try {
    // If it's not JSON, it might be plain text from prior migration
    if (!cipherJson.startsWith("{") || !cipherJson.includes('"iv"')) {
      return cipherJson;
    }

    const { iv: ivHex, data: dataHex } = JSON.parse(cipherJson);
    const iv = new Uint8Array(
      ivHex.match(/.{1,2}/g)?.map((byte: string) => parseInt(byte, 16)) || []
    );
    const cipherData = new Uint8Array(
      dataHex.match(/.{1,2}/g)?.map((byte: string) => parseInt(byte, 16)) || []
    );

    const key = await deriveKey(pin, salt);
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      cipherData
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    console.error("Vault decryption error:", err);
    return "";
  }
}

export function detectCardNetwork(cardNumber: string): "visa" | "mastercard" | "amex" | "carnet" | "other" {
  const cleaned = cardNumber.replace(/\D/g, "");
  if (/^4/.test(cleaned)) return "visa";
  if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)/.test(cleaned)) return "mastercard";
  if (/^3[47]/.test(cleaned)) return "amex";
  if (/^(50|58|60|63|67)/.test(cleaned)) return "carnet";
  return "other";
}

export function formatCardNumber(val: string): string {
  const digits = val.replace(/\D/g, "");
  if (detectCardNetwork(digits) === "amex") {
    // 4 - 6 - 5 format for Amex
    const p1 = digits.slice(0, 4);
    const p2 = digits.slice(4, 10);
    const p3 = digits.slice(10, 15);
    return [p1, p2, p3].filter(Boolean).join(" ");
  }
  // Standard 4 - 4 - 4 - 4
  const groups = digits.slice(0, 16).match(/.{1,4}/g);
  return groups ? groups.join(" ") : digits;
}

export function maskCardNumber(val: string, last4 = ""): string {
  const digits = val.replace(/\D/g, "");
  const l4 = last4 || digits.slice(-4) || "••••";
  if (detectCardNetwork(digits) === "amex") {
    return `•••• •••••• •${l4}`;
  }
  return `•••• •••• •••• ${l4}`;
}

export function formatClabe(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 18);
  if (digits.length <= 6) return digits;
  return digits.replace(/(\d{3})(\d{3})(\d{11})(\d{1})?/, "$1 $2 $3 $4").trim();
}

/**
 * Format Costa Rica IBAN (22 characters: CR + 20 digits)
 * Example: CR05 0102 0000 9008 3456 78
 */
export function formatIban(val: string): string {
  const cleaned = val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 22);
  if (!cleaned) return "";
  // Ensure it starts with CR if user enters numbers directly
  const withPrefix = cleaned.startsWith("CR") ? cleaned : `CR${cleaned}`.slice(0, 22);
  const groups = withPrefix.match(/.{1,4}/g);
  return groups ? groups.join(" ") : withPrefix;
}

/**
 * Format Costa Rica SINPE Móvil (8 digits phone number)
 * Example: 8888-8888
 */
export function formatSinpe(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

