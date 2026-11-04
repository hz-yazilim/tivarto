// Fail closed for live deployments if demo mode or ephemeral-only storage is configured.
if (process.env.VERCEL_ENV === "production") {
  const required = ["DATABASE_URL", "DIRECT_URL", "BLOB_READ_WRITE_TOKEN"];
  const missing = required.filter((key) => !process.env[key]);
  const demoEnabled = process.env.DEMO_MODE === "true" || process.env.DEMO_FAKE_DATA === "true";
  if (demoEnabled) throw new Error("Production build blocked: DEMO_MODE and DEMO_FAKE_DATA must both be false.");
  if (missing.length) throw new Error("Production build blocked: missing required environment variables: " + missing.join(", "));
  console.log("Production configuration verified: real database, demo disabled, persistent Blob storage configured.");
} else console.log("Non-production build: production-only environment guard skipped.");
