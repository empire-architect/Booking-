"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PaymentSdk } from "@/components/payment-sdk";
import type { PrebookResponse } from "@/types/liteapi";

type Holder = {
  firstName: string;
  lastName: string;
  email: string;
};

export default function CheckoutPage() {
  const params = useSearchParams();

  const [holder, setHolder] = useState<Holder>({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prebook, setPrebook] = useState<PrebookResponse["data"] | null>(null);

  const offerId = params.get("offerId") || "";
  const hotelId = params.get("hotelId") || "";
  const hotelName = params.get("hotelName") || "Selected hotel";
  const roomName = params.get("roomName") || "Selected room";
  const amount = params.get("amount");

  const liteEnv = (process.env.NEXT_PUBLIC_LITEAPI_ENV || "sandbox") as "sandbox" | "live";
  const [returnUrl, setReturnUrl] = useState("");

  useEffect(() => {
    setReturnUrl(`${window.location.origin}/booking/confirm`);
  }, []);

  async function handlePrebook(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!offerId) {
      setError("Missing offerId. Please go back and select an offer.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/rates/prebook", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          offerId,
          hotelId,
          checkin: params.get("checkin") || undefined,
          checkout: params.get("checkout") || undefined,
          adults: Number(params.get("adults") || "2"),
          currency: params.get("currency") || "USD",
          guestNationality: params.get("guestNationality") || "US",
          holder,
        }),
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || "Prebook failed");
      setPrebook((json as PrebookResponse).data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected prebook error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
        <div>
          <h1 className="text-2xl font-bold">Checkout</h1>
          <p className="text-sm text-slate-500">Enter guest details, then continue with secure payment.</p>
        </div>

        <form className="space-y-4" onSubmit={handlePrebook}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">First name</label>
              <input
                required
                value={holder.firstName}
                onChange={(e) => setHolder((v) => ({ ...v, firstName: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-blue-500 focus:ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Last name</label>
              <input
                required
                value={holder.lastName}
                onChange={(e) => setHolder((v) => ({ ...v, lastName: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-blue-500 focus:ring"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Email</label>
            <input
              type="email"
              required
              value={holder.email}
              onChange={(e) => setHolder((v) => ({ ...v, email: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-blue-500 focus:ring"
            />
          </div>

          <button
            disabled={loading}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {loading ? "Preparing checkout..." : "Continue to payment"}
          </button>
        </form>

        {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

        {prebook && (
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <h2 className="text-lg font-semibold">Payment</h2>
              <p className="text-sm text-slate-500">
                Complete payment below, then click “Go to confirmation”.
              </p>
            </div>

            {liteEnv === "sandbox" && (
              <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                Sandbox test card: <strong>4242 4242 4242 4242</strong> · any future expiry · any 3-digit CVV.
              </p>
            )}

            {returnUrl ? (
              <PaymentSdk
                secretKey={prebook.secretKey}
                liteEnv={liteEnv}
                returnUrl={returnUrl}
                businessName="Booking-"
              />
            ) : (
              <div className="text-sm text-slate-500">Preparing payment form...</div>
            )}

            <Link
              href="/booking/confirm"
              className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100"
            >
              Go to confirmation
            </Link>
          </div>
        )}
      </section>

      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Booking summary</h2>
        <div className="mt-4 space-y-2 text-sm">
          <p>
            <span className="text-slate-500">Hotel:</span> {hotelName}
          </p>
          <p>
            <span className="text-slate-500">Room:</span> {roomName}
          </p>
          <p>
            <span className="text-slate-500">Offer:</span> {offerId || "N/A"}
          </p>
          <p>
            <span className="text-slate-500">Dates:</span> {params.get("checkin")} → {params.get("checkout")}
          </p>
          <p>
            <span className="text-slate-500">Guests:</span> {params.get("adults") || "2"}
          </p>
          {amount && (
            <p className="text-base font-semibold">
              {params.get("currency") || "USD"} {Number(amount).toFixed(2)}
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
