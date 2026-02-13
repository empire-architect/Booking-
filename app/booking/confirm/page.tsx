"use client";

import { useState } from "react";
import Link from "next/link";
import type { BookResponse } from "@/types/liteapi";

export default function BookingConfirmPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookResponse["data"] | null>(null);

  async function finalizeBooking() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/rates/book", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error || "Booking failed");
      }

      setBooking((json as BookResponse).data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected booking error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-bold">Booking confirmation</h1>
        <p className="mt-2 text-sm text-slate-500">
          Finalize your booking. We will use the secure prebook context created during checkout.
        </p>
      </section>

      {!booking && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <button
            disabled={loading}
            onClick={finalizeBooking}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {loading ? "Finalizing..." : "Finalize booking"}
          </button>
        </section>
      )}

      {error && (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</section>
      )}

      {booking && (
        <section className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <p className="text-sm font-semibold text-emerald-700">✅ Booking confirmed</p>
          <h2 className="text-xl font-bold text-slate-900">Booking ID: {booking.bookingId}</h2>
          <p className="text-sm text-slate-700">Status: {booking.status}</p>
          {booking.hotelConfirmationCode && (
            <p className="text-sm text-slate-700">
              Hotel confirmation code: <strong>{booking.hotelConfirmationCode}</strong>
            </p>
          )}
          <p className="text-sm text-slate-700">
            {booking.hotel?.name || "Hotel"} · {booking.checkin || "-"} → {booking.checkout || "-"}
          </p>
          {booking.price && (
            <p className="text-sm font-semibold text-slate-800">
              Paid: {booking.currency || "USD"} {Number(booking.price).toFixed(2)}
            </p>
          )}

          <Link
            href="/"
            className="mt-2 inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100"
          >
            Back to home
          </Link>
        </section>
      )}
    </div>
  );
}
