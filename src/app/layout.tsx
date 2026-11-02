import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Tiverto — İşletmeni yönet, ticaretini büyüt",
    template: "%s | Tiverto",
  },
  description:
    "Küçük ve orta ölçekli işletmeler için ürün, stok, müşteri, tedarikçi, sipariş yönetimi ve otomatik dijital vitrin.",
  applicationName: "Tiverto",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0e9f6e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
