// Subdomain olarak alınamayacak isimler
export const RESERVED_SLUGS = new Set([
  "www",
  "admin",
  "api",
  "app",
  "panel",
  "dashboard",
  "mail",
  "static",
  "cdn",
  "assets",
  "support",
  "help",
  "blog",
  "status",
  "staging",
  "dev",
  "test",
  "tivarto",
]);

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/.test(slug) && !RESERVED_SLUGS.has(slug);
}
