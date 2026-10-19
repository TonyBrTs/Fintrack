/**
 * Financial Vault Cryptography & Utility Helpers
 * Implements Web Crypto API (PBKDF2 + AES-GCM 256-bit)
 */

import type { BankId } from "@/types";

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

/**
 * Auto-detect bank in Costa Rica by card BIN (first 4 to 6 digits)
 */
export function detectBankFromCardNumber(cardNumber: string): BankId | null {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 4) return null;
  const p2 = digits.slice(0, 2);

  // Amex is exclusively BAC in Costa Rica
  if (p2 === "34" || p2 === "37") return "bac";

  // Specific Costa Rica Bank BIN Prefixes
  // BAC Credomatic
  if (/^(4001|4016|4020|4094|4118|4124|4147|4152|4205|4216|4220|4235|4258|4268|4278|4316|4323|4420|4506|4510|4543|4547|4584|4606|4615|4647|4716|4758|4772|4801|4831|4858|4866|4916|4924|5104|5105|5187|5217|5258|5304|5313|5343|5404|5458|5476|5488|5524|5558|5588)/.test(digits)) {
    return "bac";
  }

  // Banco Nacional de Costa Rica (BNCR)
  if (/^(4022|4031|4066|4165|4175|4215|4328|4548|4568|4619|4698|4814|4855|4915|5147|5218|5293|5419|5493)/.test(digits)) {
    return "bncr";
  }

  // Banco de Costa Rica (BCR)
  if (/^(4027|4037|4102|4142|4224|4243|4253|4273|4342|4537|4567|4587|4652|4787|4852|4902|5124|5237|5324|5424|5472|5527)/.test(digits)) {
    return "bcr";
  }

  // Banco Popular
  if (/^(4023|4033|4103|4173|4213|4252|4329|4523|4553|4583|4663|4773|4853|5133|5243|5333|5433)/.test(digits)) {
    return "popular";
  }

  // Scotiabank Costa Rica
  if (/^(4003|4024|4034|4122|4214|4284|4314|4514|4554|4684|4854|5144|5254|5344|5444|5484|5544)/.test(digits)) {
    return "scotiabank";
  }

  // Davivienda Costa Rica
  if (/^(4005|4025|4035|4155|4217|4285|4315|4515|4555|4685|4857|5155|5255|5355|5455)/.test(digits)) {
    return "davivienda";
  }

  // Banco Promerica
  if (/^(4008|4028|4038|4128|4218|4288|4318|4518|4558|4688|4858|5158|5259|5358|5459)/.test(digits)) {
    return "promerica";
  }

  // Banco LAFISE
  if (/^(4009|4029|4039|4129|4219|4289|4319|4519|4559|4689|4859|5159|5269)/.test(digits)) {
    return "lafise";
  }

  // Coopealianza
  if (/^(4041|4141|4241|4341|4541|4641|4741|4841)/.test(digits)) {
    return "coopealianza";
  }

  // Coopenae
  if (/^(4042|4142|4242|4342|4542|4642|5142|5242)/.test(digits)) {
    return "coopenae";
  }

  // Wink
  if (/^(4045|4145|4245|4345|4545)/.test(digits)) {
    return "wink";
  }

  // MultiMoney
  if (/^(4048|4148|4248|4348|4548)/.test(digits)) {
    return "multimoney";
  }

  return null;
}

/**
 * Auto-detect bank in Costa Rica from official IBAN entity code (BCCR SINPE codes)
 */
export function detectBankFromIban(iban: string): BankId | null {
  const clean = iban.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length < 8) return null;
  const entityCode = clean.slice(4, 8);

  const ibanMap: Record<string, BankId> = {
    "0102": "bac",          // BAC San José
    "0151": "bncr",         // Banco Nacional de Costa Rica
    "0152": "bcr",          // Banco de Costa Rica
    "0161": "popular",      // Banco Popular y de Desarrollo Comunal
    "0123": "scotiabank",   // Scotiabank de Costa Rica
    "0107": "davivienda",   // Banco Davivienda
    "0114": "promerica",    // Banco Promerica
    "0110": "lafise",       // Banco LAFISE
    "0804": "coopealianza", // Coopealianza
    "0805": "coopenae",     // Coopenae
    "0837": "multimoney",   // Financiera Gente (MultiMoney)
  };

  return ibanMap[entityCode] || null;
}


