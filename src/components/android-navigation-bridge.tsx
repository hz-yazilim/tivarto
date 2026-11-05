"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

/** Android geri tuşunu uygulama içinde tut; kök ekranda uygulamayı kapatma. */
export default function AndroidNavigationBridge() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") return;

    let disposed = false;
    let listener: { remove: () => Promise<void> } | undefined;

    void App.addListener("backButton", ({ canGoBack }) => {
      // Android WebView bazen canGoBack=false döndürse de Next.js gezinme
      // geçmişi bulunabilir. İki sinyali birlikte değerlendir.
      if (window.history.length > 1 && (canGoBack || window.location.pathname !== "/")) {
        window.history.back();
        return;
      }

      // Giriş/panel ana ekranında geri tuşu yanlışlıkla uygulamayı kapatmasın.
      // Kök ekranda güvenli biçimde yerinde kal.
    }).then((registered) => {
      if (disposed) void registered.remove();
      else listener = registered;
    });

    return () => {
      disposed = true;
      void listener?.remove();
    };
  }, []);

  return null;
}
