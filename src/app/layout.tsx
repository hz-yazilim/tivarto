import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tivarto",
  description: "Küçük işletmeler için yönetim paneli ve dijital mağaza platformu",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
