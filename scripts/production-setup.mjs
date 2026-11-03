/**
 * Vercel production build öncesi gerçek veritabanını hazırlar.
 * Preview/local build'lerde çalışmaz. Tüm parolalar yalnızca environment
 * variable'lardan okunur ve hiçbir zaman loglanmaz.
 */
import { spawnSync } from "node:child_process";

if (process.env.VERCEL_ENV !== "production") {
  console.log("Production database setup skipped (non-production build).");
  process.exit(0);
}

const required = ["DIRECT_URL", "APP_DB_PASSWORD"];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Production build blocked: ${key} is required.`);
    process.exit(1);
  }
}

function run(script) {
  const result = spawnSync(process.execPath, [script], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("scripts/create-app-role.mjs");
run("scripts/migrate.mjs");
run("scripts/apply-rls.mjs");

if (process.env.BOOTSTRAP_ADMIN_PASSWORD) {
  if (!process.env.BOOTSTRAP_ADMIN_EMAIL) {
    console.error("BOOTSTRAP_ADMIN_EMAIL is required when bootstrapping the admin.");
    process.exit(1);
  }
  run("scripts/bootstrap-admin.mjs");
} else {
  console.log("Admin bootstrap skipped; no one-time bootstrap password supplied.");
}
