import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Tivarto Android shell.
 *
 * The current Next.js application uses server components, server actions,
 * Prisma-backed sessions and Vercel Blob uploads. It cannot be exported as a
 * static offline bundle without a larger client/API rewrite. For this first
 * migration stage the APK hosts the existing UI in a locked-down WebView while
 * Vercel remains the application server. The user-facing entry point is the
 * Android app; the service still requires an internet connection.
 */
const appUrl = process.env.TIVARTO_APP_URL ?? "https://tivarto.vercel.app";
const parsedUrl = new URL(appUrl);

if (parsedUrl.protocol !== "https:") {
  throw new Error("TIVARTO_APP_URL must use HTTPS.");
}

const config: CapacitorConfig = {
  appId: "com.hzyazilim.tivarto",
  appName: "Tivarto",
  webDir: "www",
  server: {
    url: parsedUrl.origin,
    cleartext: false,
    androidScheme: "https",
    allowNavigation: [parsedUrl.hostname],
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;

