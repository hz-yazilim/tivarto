"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

/**
 * Keeps Android's hardware back button inside Tivarto navigation.
 * On the root screen it exits the app instead of navigating to a blank WebView.
 */
export default function AndroidNavigationBridge() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") return;

    let disposed = false;
    let listener: { remove: () => Promise<void> } | undefined;

    void App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack && window.history.length > 1) {
        window.history.back();
      } else {
        void App.exitApp();
      }
    }).then((registered) => {
      if (disposed) {
        void registered.remove();
      } else {
        listener = registered;
      }
    });

    return () => {
      disposed = true;
      void listener?.remove();
    };
  }, []);

  return null;
}
