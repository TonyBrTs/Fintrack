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

  // American Express in Costa Rica is issued exclusively by BAC Credomatic
  if (/^3[47]/.test(digits)) return "bac";

  // 6-digit exact BIN prefixes for Costa Rica issuers
  if (digits.length >= 6) {
    const bin6 = digits.slice(0, 6);

    // Wink (Coopenae digital debit)
    if (/^(407843|483316)/.test(bin6)) return "wink";

    // Coopenae
    if (/^(438108|404200|489458|514230|524230)/.test(bin6)) return "coopenae";

    // Coopealianza
    if (/^(404100|434120|454100)/.test(bin6)) return "coopealianza";

    // MultiMoney
    if (/^(404800|424800|476240)/.test(bin6)) return "multimoney";

    // Banco Nacional de Costa Rica (BNCR)
    if (
      /^(450778|450779|410863|410864|410865|489413|489414|489415|469820|469821|481553|454881|421562|402202|432815|416598|461923|514756|516492|518678|521899|526458|527545|529315|530693|531845|541973|545238|548238|549325|552263|553462|554632)/.test(
        bin6
      )
    ) {
      return "bncr";
    }

    // Banco de Costa Rica (BCR)
    if (
      /^(418744|418745|418746|433840|433841|438415|443188|453798|456712|458734|465211|478723|484623|485210|490234|412639|512465|516923|519906|523714|524938|532489|539150|542418|546218|547281|552790|557642)/.test(
        bin6
      )
    ) {
      return "bcr";
    }

    // Banco Popular (BPDC)
    if (
      /^(456925|456926|456927|479156|479157|479158|421345|425289|432910|452367|455312|458390|466345|477312|485301|492184|513345|524378|533312|543389|549812)/.test(
        bin6
      )
    ) {
      return "popular";
    }

    // BAC Credomatic
    if (
      /^(450606|450607|450625|456847|411805|412492|421673|422015|438098|441103|454313|454759|458420|464709|477213|477293|483150|483151|491616|493174|409408|404237|413726|465850|474501|510420|514910|517748|518704|518805|521712|522678|525488|528095|530482|531350|531914|540498|541275|542138|545183|546616|547647|548882|549123|552315|552432|554925|558868|222952)/.test(
        bin6
      )
    ) {
      return "bac";
    }

    // Scotiabank Costa Rica
    if (
      /^(474477|485412|412256|421489|428412|431456|468412|514412|518124|522145|525412|534412|544412|548412|554412)/.test(
        bin6
      )
    ) {
      return "scotiabank";
    }

    // Davivienda Costa Rica
    if (
      /^(457302|457303|457304|404318|415523|421789|428512|431567|451523|455567|468512|485712|515523|525567|535512|540625|545523|548923|554512)/.test(
        bin6
      )
    ) {
      return "davivienda";
    }

    // Banco Promerica
    if (
      /^(422229|407512|412834|421845|428812|431845|451823|455812|468812|489123|515812|525934|535812|543892|545912|549621)/.test(
        bin6
      ) ||
      /^46416\d/.test(bin6)
    ) {
      return "promerica";
    }

    // Banco LAFISE
    if (/^(439224|439225|515912|526934|532912)/.test(bin6)) {
      return "lafise";
    }
  }

  // 4-digit BIN family fallback
  const bin4 = digits.slice(0, 4);

  if (/^(4078|4833|4045|4145|4245|4345|4545)$/.test(bin4)) return "wink";
  if (/^(4381|4042|4242|4542|4642|5142|5242)$/.test(bin4)) return "coopenae";
  if (/^(4041|4141|4241|4341|4541|4741|4841)$/.test(bin4)) return "coopealianza";
  if (/^(4048|4148|4248|4348|4548|4762)$/.test(bin4)) return "multimoney";

  // BNCR 4-digit families
  if (
    /^(4507|4108|4894|4022|4031|4066|4165|4175|4215|4328|4548|4619|4698|4814|4815|4855|4915|5147|5164|5186|5218|5264|5275|5293|5306|5318|5419|5452|5482|5493|5522|5534|5546)$/.test(
      bin4
    )
  ) {
    return "bncr";
  }

  // BCR 4-digit families
  if (
    /^(4187|4338|4384|4431|4027|4037|4102|4126|4142|4224|4243|4253|4273|4342|4537|4567|4587|4652|4661|4787|4846|4852|4902|5124|5169|5199|5237|5249|5324|5391|5424|5462|5472|5527|5576)$/.test(
      bin4
    )
  ) {
    return "bcr";
  }

  // Banco Popular 4-digit families
  if (
    /^(4569|4791|4023|4033|4103|4173|4213|4252|4329|4523|4553|4583|4663|4773|4853|4921|5133|5243|5333|5433|5498)$/.test(
      bin4
    )
  ) {
    return "popular";
  }

  // BAC Credomatic 4-digit families
  if (
    /^(4506|4568|4001|4016|4020|4094|4118|4124|4137|4147|4152|4205|4216|4220|4235|4258|4268|4278|4316|4323|4380|4411|4420|4510|4543|4547|4584|4606|4615|4647|4658|4716|4745|4758|4772|4801|4831|4866|4916|4924|4931|5104|5105|5149|5177|5187|5188|5217|5226|5258|5280|5304|5313|5319|5343|5404|5412|5421|5451|5466|5476|5488|5491|5523|5524|5549|5558|5588|2229)$/.test(
      bin4
    )
  ) {
    return "bac";
  }

  // Scotiabank 4-digit families
  if (
    /^(4551|4536|4744|4003|4024|4034|4122|4214|4284|4314|4514|4554|4684|4854|5144|5181|5221|5254|5344|5444|5484|5544)$/.test(
      bin4
    )
  ) {
    return "scotiabank";
  }

  // Davivienda 4-digit families
  if (
    /^(4573|4043|4005|4025|4035|4155|4217|4285|4315|4515|4555|4685|4857|5155|5255|5355|5406|5455|5489|5545)$/.test(
      bin4
    )
  ) {
    return "davivienda";
  }

  // Promerica 4-digit families
  if (
    /^(4641|4222|4075|4008|4028|4038|4128|4218|4288|4318|4518|4558|4688|4858|4891|5158|5259|5358|5438|5459|5496)$/.test(
      bin4
    )
  ) {
    return "promerica";
  }

  // LAFISE 4-digit families
  if (
    /^(4392|4009|4029|4039|4129|4219|4289|4319|4519|4559|4689|4859|5159|5269|5329)$/.test(
      bin4
    )
  ) {
    return "lafise";
  }

  return null;
}

/**
 * Map an issuer name string (from BIN lookup or user text) to a Costa Rican BankId
 */
export function detectBankFromText(text: string): BankId | null {
  if (!text) return null;
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (/\bwink\b/.test(normalized)) return "wink";
  if (/\b(multimoney|multi money|financiera gente)\b/.test(normalized)) return "multimoney";
  if (/\bcoopenae\b/.test(normalized)) return "coopenae";
  if (/\bcoopealianza\b/.test(normalized)) return "coopealianza";
  if (/\b(bncr|banco nacional|nacional de costa rica|\bbn\b)\b/.test(normalized)) return "bncr";
  if (/\b(bcr|banco de costa rica)\b/.test(normalized)) return "bcr";
  if (/\b(popular|bpdc)\b/.test(normalized)) return "popular";
  if (/\b(bac|credomatic)\b/.test(normalized)) return "bac";
  if (/\b(scotiabank|scotia)\b/.test(normalized)) return "scotiabank";
  if (/\bdavivienda\b/.test(normalized)) return "davivienda";
  if (/\bpromerica\b/.test(normalized)) return "promerica";
  if (/\blafise\b/.test(normalized)) return "lafise";

  return null;
}

/**
 * Remote BIN lookup fallback (queries public BIN directory when local table doesn't match)
 */
const binCache = new Map<string, BankId | null>();

export async function lookupBankByBinOnline(cardNumber: string): Promise<BankId | null> {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 6) return null;
  const bin = digits.slice(0, 6);

  if (binCache.has(bin)) {
    return binCache.get(bin) ?? null;
  }

  try {
    const res = await fetch(`https://data.handyapi.com/bin/${bin}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      const issuer = [data?.Issuer, data?.Bank, data?.bank?.name]
        .filter(Boolean)
        .join(" ");
      const matched = detectBankFromText(issuer);
      if (matched) {
        binCache.set(bin, matched);
        return matched;
      }
    }
  } catch {
    // Ignore network errors on optional online BIN lookup
  }

  try {
    const res2 = await fetch(`https://lookup.binlist.net/${bin}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (res2.ok) {
      const data2 = await res2.json();
      const issuer2 = data2?.bank?.name || "";
      const matched2 = detectBankFromText(issuer2);
      if (matched2) {
        binCache.set(bin, matched2);
        return matched2;
      }
    }
  } catch {
    // Ignore network errors
  }

  binCache.set(bin, null);
  return null;
}

/**
 * Auto-detect bank in Costa Rica from official IBAN entity code (BCCR SINPE codes)
 * Format: CR + 2 check digits + 4-digit entity code (positions 4..8) + 14-digit account
 */
export function detectBankFromIban(iban: string): BankId | null {
  const clean = iban.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!clean) return null;

  const ibanMap: Record<string, BankId> = {
    "0102": "bac",          // BAC San José / Credomatic
    "0151": "bncr",         // Banco Nacional de Costa Rica
    "0152": "bcr",          // Banco de Costa Rica
    "0161": "popular",      // Banco Popular y de Desarrollo Comunal
    "0104": "davivienda",   // Banco Davivienda Costa Rica
    "0107": "davivienda",   // Legacy mapping fallback
    "0114": "scotiabank",   // Scotiabank de Costa Rica
    "0123": "scotiabank",   // Scotiabank (ex-Citibank)
    "0116": "promerica",    // Banco Promerica de Costa Rica
    "0115": "lafise",       // Banco LAFISE
    "0110": "lafise",       // Legacy LAFISE fallback
    "0814": "coopenae",     // Coopenae / Wink
    "0805": "coopenae",     // Coopenae fallback
    "0817": "coopealianza", // Coopealianza
    "0804": "coopealianza", // Coopealianza fallback
    "0326": "multimoney",   // Financiera MultiMoney / Gente
    "0837": "multimoney",   // MultiMoney fallback
  };

  // Standard CR IBAN: CR + 2 check digits + 4 entity digits (e.g., CR050152...)
  if (/^CR\d{6}/.test(clean)) {
    const entityCode = clean.slice(4, 8);
    if (ibanMap[entityCode]) return ibanMap[entityCode];
  }

  // If user pasted or started typing raw entity code after CR without check digits (e.g. CR0152...)
  if (/^CR0\d{3}/.test(clean)) {
    const directCode = clean.slice(2, 6);
    if (ibanMap[directCode]) return ibanMap[directCode];
  }

  // Raw digits starting with 4-digit entity code (e.g. 0152...)
  const digitsOnly = clean.replace(/\D/g, "");
  if (digitsOnly.length >= 4) {
    const first4 = digitsOnly.slice(0, 4);
    if (ibanMap[first4]) return ibanMap[first4];
    if (digitsOnly.length >= 6) {
      const afterCheck = digitsOnly.slice(2, 6);
      if (ibanMap[afterCheck]) return ibanMap[afterCheck];
    }
  }

  return null;
}


