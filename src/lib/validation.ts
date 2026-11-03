/** Form verilerini güvenli biçimde okumak için küçük yardımcılar. */

export type FormState = {
  error?: string;
  ok?: boolean;
  message?: string;
  whatsappUrl?: string;
} | null;

export function str(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function optionalStr(formData: FormData, key: string): string | undefined {
  const value = str(formData, key);
  return value.length > 0 ? value : undefined;
}

/**
 * Türkçe ve uluslararası fiyat girişlerini güvenli biçimde sayıya çevirir.
 * 1.234,50 -> 1234.50 | 1234.50 -> 1234.50 | 1234,50 -> 1234.50
 * Tek nokta ondalık ayraç kabul edilir; yalnızca açık binlik gruplama
 * biçimindeki birden çok nokta binlik ayraç sayılır.
 */
export function toNumber(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const value = raw.trim().replace(/\s/g, "");
  if (!value) return undefined;

  let normalized = value;
  if (value.includes(",") && value.includes(".")) {
    normalized = value.replace(/\./g, "").replace(",", ".");
  } else if (value.includes(",")) {
    normalized = value.replace(",", ".");
  } else if (/^-?\d{1,3}(\.\d{3}){1,}$/.test(value)) {
    normalized = value.replace(/\./g, "");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function toInt(raw: string | undefined, fallback = 0): number {
  const value = toNumber(raw);
  if (value === undefined) return fallback;
  return Math.trunc(value);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

/** WhatsApp wa.me için uluslararası numara biçimine dönüştürür. */
export function normalizeWhatsAppNumber(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `9${digits.slice(1)}`;
  else if (digits.length === 10) digits = `90${digits}`;
  return digits.length >= 11 && digits.length <= 15 ? digits : null;
}
