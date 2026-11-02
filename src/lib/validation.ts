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

/** "1.234,50" / "1234.50" gibi girdileri sayıya çevirir. */
export function toNumber(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const normalized = raw.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  // "1.234" gibi binlik ayraçlı olmayan ondalıkları da destekle
  const fallback = raw.replace(",", ".");
  const value = Number(normalized);
  if (!Number.isNaN(value)) return value;
  const parsedFallback = Number(fallback);
  return Number.isNaN(parsedFallback) ? undefined : parsedFallback;
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
