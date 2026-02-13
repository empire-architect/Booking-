"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    LiteAPIPayment?: new (config: Record<string, unknown>) => {
      handlePayment: () => void;
    };
  }
}

type Props = {
  secretKey: string;
  liteEnv: "sandbox" | "live";
  returnUrl: string;
  businessName?: string;
};

export function PaymentSdk({ secretKey, liteEnv, returnUrl, businessName = "Booking-" }: Props) {
  useEffect(() => {
    const scriptId = "liteapi-payment-sdk";

    const boot = () => {
      if (!window.LiteAPIPayment) return;

      const liteAPIConfig = {
        publicKey: liteEnv,
        secretKey,
        returnUrl,
        targetElement: "#liteapi-payment-target",
        appearance: { theme: "flat" },
        options: { business: { name: businessName } },
      };

      const widget = new window.LiteAPIPayment(liteAPIConfig);
      widget.handlePayment();
    };

    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existing) {
      boot();
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://payment-wrapper.liteapi.travel/dist/liteAPIPayment.js?v=a1";
    script.async = true;
    script.onload = boot;
    document.body.appendChild(script);
  }, [businessName, liteEnv, returnUrl, secretKey]);

  return <div id="liteapi-payment-target" className="min-h-14" />;
}
