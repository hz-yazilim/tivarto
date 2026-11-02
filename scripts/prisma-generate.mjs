/**
 * Prisma istemcisini üretir; ağ erişimi olmayan (ör. önizleme) ortamlarda da
 * çalışır.
 *
 * Bu proje `engineType = "client"` kullanır: sorgular WASM query compiler ile
 * derlenir, native query engine ikilisine ihtiyaç yoktur. Buna rağmen Prisma
 * CLI `generate` sırasında şema/query motoru dosyalarını indirmeye çalışır.
 * Aşağıdaki ortam değişkenleri bu indirmeyi atlar (üretilen istemci aynıdır).
 * Yalnızca bu alt süreçte geçerlidir; `prisma migrate` gibi komutlar etkilenmez.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(root, "node_modules", "prisma", "build", "index.js");
const placeholder = process.platform === "win32" ? process.execPath : "/bin/true";
const env = {
  ...process.env,
  PRISMA_SCHEMA_ENGINE_BINARY: placeholder,
  PRISMA_QUERY_ENGINE_LIBRARY: placeholder,
  PRISMA_QUERY_ENGINE_BINARY: placeholder,
  PRISMA_CLI_QUERY_ENGINE_TYPE: "client",
  PRISMA_CLIENT_ENGINE_TYPE: "client",
  // DİKKAT: PRISMA_GENERATE_NO_ENGINE kullanılmaz! engineType="client"
  // istemcisi WASM query compiler ile üretilir; --no-engine, gerçek DB
  // modundaki PrismaPg adapter'ını çalışmaz hale getirir.
  PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING: "1",
};

const result = spawnSync(process.execPath, [cli, "generate"], {
  cwd: root,
  env,
  stdio: "inherit",
});

if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
