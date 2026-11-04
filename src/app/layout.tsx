import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaRegister from "@/components/pwa-register";

export const metadata: Metadata = {
  title: {
    default: "Tivarto — İşletmeni yönet, ticaretini büyüt",
    template: "%s | Tivarto",
  },
  description:
    "Küçük ve orta ölçekli işletmeler için ürün, stok, müşteri, tedarikçi, sipariş yönetimi ve otomatik dijital vitrin.",
  applicationName: "Tivarto",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0912",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
