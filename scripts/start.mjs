/**
 * Render/Node başlangıcı.
 * Bu dağıtım geliştirme önizlemesidir: varsayılan olarak veritabanı KULLANMAZ.
 * Gerçek veritabanlı çalışma ancak TIVARTO_REAL_MODE=true ile açıkça seçilir.
 */
import { spawnSync } from "node:child_process";

const realMode = process.env.TIVARTO_REAL_MODE === "true";

if (!realMode) {
  // DATABASE_URL yanlışlıkla Render'da tanımlı olsa bile demo istemcisi seçilsin.
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
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (realMode) {
  if (!process.env.DATABASE_URL) {
    console.error("HATA: Gerçek modda DATABASE_URL zorunludur.");
    process.exit(1);
  }
  run("npm", ["run", "db:migrate:deploy"]);
  run("npm", ["run", "db:rls"]);
} else {
  console.log(
    "Tivarto DEMO önizlemesi: PostgreSQL kullanılmıyor; bellek içi örnek veri aktif."
  );
}

run("npm", ["exec", "--", "next", "start"]);
