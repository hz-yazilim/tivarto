/**
 * Render/Node başlangıcı.
 * İzole demo önizlemesinde PostgreSQL bağlantısı ve migration zorunlu değildir.
 * Gerçek modda migration + RLS adımları başarısızsa uygulama başlamaz.
 */
import { spawnSync } from "node:child_process";

const demoMode = process.env.DEMO_MODE === "true";
const forceFakeData = process.env.DEMO_FAKE_DATA === "true";
const hasDatabase = Boolean(process.env.DATABASE_URL);
const databaseOptional = demoMode && (forceFakeData || !hasDatabase);

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
  console.log("Tivarto geliştirme önizlemesi: veritabanı migration/RLS adımları atlandı.");
} else {
  if (!hasDatabase) {
    console.error("HATA: Gerçek modda DATABASE_URL zorunludur.");
    process.exit(1);
  }
  run("npm", ["run", "db:migrate:deploy"]);
  run("npm", ["run", "db:rls"]);
}

run("npm", ["exec", "--", "next", "start"]);
