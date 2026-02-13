"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { LiteHotelCard, RatesSearchResponse } from "@/types/liteapi";

type PriceMap = Record<string, { amount: number; currency: string; offerId?: string; refundableTag?: string }>;

function buildPriceMap(data: RatesSearchResponse["data"]): PriceMap {
  const map: PriceMap = {};

  for (const item of data ?? []) {
    const firstRoomType = item.roomTypes?.[0];
    const firstRate = firstRoomType?.rates?.[0];
    const total = firstRate?.retailRate?.total?.[0];

    if (!total) continue;

    map[item.hotelId] = {
      amount: total.amount,
      currency: total.currency,
      offerId: firstRoomType?.offerId,
      refundableTag: firstRate?.cancellationPolicies?.refundableTag,
    };
  }

  return map;
}

export default function ResultsPage() {
  const params = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<RatesSearchResponse | null>(null);

  const payload = useMemo(() => {
    const mode = (params.get("mode") || "destination") as "destination" | "vibe";

    return {
      mode,
      checkin: params.get("checkin") || "",
      checkout: params.get("checkout") || "",
      adults: Number(params.get("adults") || "2"),
      currency: params.get("currency") || "USD",
      guestNationality: params.get("guestNationality") || "US",
      placeId: params.get("placeId") || undefined,
      aiSearch: params.get("vibe") || undefined,
      maxRatesPerHotel: 1,
    };
  }, [params]);

  useEffect(() => {
    let mounted = true;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/rates/search", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await response.json();
        if (!response.ok) {
          throw new Error(json?.error || "Failed to search rates");
        }

        if (mounted) setResults(json as RatesSearchResponse);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "Unexpected search error");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, [payload]);

  const hotelCards = (results?.hotels ?? []) as LiteHotelCard[];
  const prices = buildPriceMap(results?.data ?? []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">
          Showing stays from {payload.checkin} to {payload.checkout} · {payload.adults} guest(s)
        </p>
        <h1 className="mt-1 text-2xl font-bold">Available stays</h1>
      </div>

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Searching rates...
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {error}
        </div>
      )}

      {!loading && !error && hotelCards.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          No hotels found for this query. Try different dates or a different destination/vibe.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {hotelCards.map((hotel) => {
          const p = prices[hotel.id];
          const q = new URLSearchParams({
            checkin: payload.checkin,
            checkout: payload.checkout,
            adults: String(payload.adults),
            currency: payload.currency,
            guestNationality: payload.guestNationality,
          });

          return (
            <Link
              key={hotel.id}
              href={`/hotel/${hotel.id}?${q.toString()}`}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="aspect-[16/9] w-full bg-slate-100">
                {hotel.main_photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={hotel.main_photo} alt={hotel.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">No image</div>
                )}
              </div>

              <div className="space-y-2 p-4">
                <h2 className="line-clamp-1 text-lg font-semibold">{hotel.name}</h2>
                <p className="line-clamp-1 text-sm text-slate-500">{hotel.address || `${hotel.city || ""} ${hotel.country || ""}`}</p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Rating: {hotel.rating ?? "n/a"}</span>
                  {p ? (
                    <span className="text-sm font-semibold">
                      {p.currency} {p.amount.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">No rate</span>
                  )}
                </div>

                {p?.refundableTag && (
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      p.refundableTag === "RFN"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {p.refundableTag}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
