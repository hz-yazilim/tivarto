/**
 * Render/Node başlangıcı.
 * Veritabanı tanımlı değilse geliştirme önizlemesini otomatik açar.
 * Veritabanı varsa yalnızca açıkça istenen demo modunda sahte veri kullanılır;
 * aksi durumda migration + RLS adımları zorunludur.
 */
import { spawnSync } from "node:child_process";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const requestedDemo = process.env.DEMO_MODE === "true";
const forceFakeData = process.env.DEMO_FAKE_DATA === "true";

// Render Dashboard'da Blueprint env değerleri uygulanmamış olsa bile,
// DATABASE_URL yoksa geliştirme ortamı DB hatasıyla kapanmasın.
const databaseOptional = !hasDatabase || (requestedDemo && forceFakeData);

if (!hasDatabase || databaseOptional) {
  process.env.DEMO_MODE = "true";
  process.env.DEMO_FAKE_DATA = "true";
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (databaseOptional) {
  console.log(
    "Tivarto geliştirme önizlemesi: DEMO_MODE etkin; veritabanı migration/RLS adımları atlandı."
  );
} else {
  run("npm", ["run", "db:migrate:deploy"]);
  run("npm", ["run", "db:rls"]);
}

run("npm", ["exec", "--", "next", "start"]);
