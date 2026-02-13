"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import type { HotelDetailsResponse, LiteRate, LiteRatesItem, RatesSearchResponse } from "@/types/liteapi";

type HotelResponse = {
  hotel: HotelDetailsResponse;
  rates: RatesSearchResponse | null;
};

type GroupedRoom = {
  roomId: string;
  roomName: string;
  roomImage?: string;
  offers: Array<{
    offerId?: string;
    rate: LiteRate;
  }>;
};

function groupOffers(item?: LiteRatesItem, hotel?: HotelDetailsResponse["data"]): GroupedRoom[] {
  const groups = new Map<string, GroupedRoom>();

  const roomImageMap = new Map<number, { name?: string; image?: string }>();
  for (const room of hotel?.rooms ?? []) {
    if (typeof room.id === "number") {
      roomImageMap.set(room.id, {
        name: room.roomName,
        image: room.photos?.[0]?.url,
      });
    }
  }

  for (const roomType of item?.roomTypes ?? []) {
    for (const rate of roomType.rates ?? []) {
      const key = String(rate.mappedRoomId ?? `unmapped-${rate.rateId ?? roomType.offerId}`);
      const roomMeta = typeof rate.mappedRoomId === "number" ? roomImageMap.get(rate.mappedRoomId) : undefined;

      if (!groups.has(key)) {
        groups.set(key, {
          roomId: key,
          roomName: roomMeta?.name || rate.name || "Room",
          roomImage: roomMeta?.image,
          offers: [],
        });
      }

      groups.get(key)!.offers.push({
        offerId: roomType.offerId,
        rate,
      });
    }
  }

  return Array.from(groups.values());
}

function HotelContent() {
  const { hotelId } = useParams<{ hotelId: string }>();
  const params = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<HotelResponse | null>(null);

  const query = useMemo(() => {
    const q = new URLSearchParams({
      checkin: params.get("checkin") || "",
      checkout: params.get("checkout") || "",
      adults: params.get("adults") || "2",
      currency: params.get("currency") || "USD",
      guestNationality: params.get("guestNationality") || "US",
    });
    return q.toString();
  }, [params]);

  useEffect(() => {
    let mounted = true;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/hotels/${hotelId}?${query}`);
        const json = (await response.json()) as HotelResponse | { error?: string };
        if (!response.ok) throw new Error((json as { error?: string }).error || "Failed to load hotel");
        if (mounted) setPayload(json as HotelResponse);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "Unexpected error");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, [hotelId, query]);

  const hotel = payload?.hotel?.data;
  const ratesItem = payload?.rates?.data?.find((i) => i.hotelId === hotelId);
  const roomGroups = groupOffers(ratesItem, hotel);

  return (
    <div className="space-y-6">
      {loading && <div className="rounded-2xl border border-slate-200 bg-white p-6">Loading hotel...</div>}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>
      )}

      {!loading && !error && hotel && (
        <>
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className="aspect-[16/7] w-full bg-slate-100">
              {hotel.main_photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={hotel.main_photo} alt={hotel.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">No image</div>
              )}
            </div>
            <div className="space-y-3 p-6">
              <h1 className="text-2xl font-bold">{hotel.name}</h1>
              <p className="text-sm text-slate-600">{hotel.address || `${hotel.city || ""} ${hotel.country || ""}`}</p>
              {hotel.hotelDescription && (
                <p className="line-clamp-4 text-sm text-slate-600">{hotel.hotelDescription.replace(/<[^>]+>/g, " ")}</p>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Available offers</h2>
              <p className="text-sm text-slate-500">Grouped by room</p>
            </div>

            {roomGroups.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
                No offers available for the selected dates.
              </div>
            )}

            <div className="space-y-4">
              {roomGroups.map((group) => (
                <div key={group.roomId} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="mb-4 flex items-center gap-4">
                    <div className="h-20 w-28 overflow-hidden rounded-lg bg-slate-100">
                      {group.roomImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={group.roomImage} alt={group.roomName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-400">No image</div>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold">{group.roomName}</h3>
                  </div>

                  <div className="space-y-2">
                    {group.offers.map((offer, idx) => {
                      const total = offer.rate.retailRate?.total?.[0];
                      const refundableTag = offer.rate.cancellationPolicies?.refundableTag;
                      const q = new URLSearchParams({
                        hotelId,
                        offerId: offer.offerId || "",
                        checkin: params.get("checkin") || "",
                        checkout: params.get("checkout") || "",
                        adults: params.get("adults") || "2",
                        currency: params.get("currency") || "USD",
                        guestNationality: params.get("guestNationality") || "US",
                        hotelName: hotel.name,
                        roomName: offer.rate.name || group.roomName,
                        amount: total?.amount ? String(total.amount) : "",
                      });

                      return (
                        <div
                          key={`${group.roomId}-${idx}`}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2"
                        >
                          <div>
                            <p className="text-sm font-medium">{offer.rate.boardName || offer.rate.name || "Rate"}</p>
                            <div className="flex gap-2 text-xs text-slate-500">
                              {refundableTag && (
                                <span
                                  className={`rounded-full px-2 py-0.5 ${
                                    refundableTag === "RFN"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-amber-100 text-amber-700"
                                  }`}
                                >
                                  {refundableTag}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <p className="text-sm font-semibold">
                              {total ? `${total.currency} ${Number(total.amount).toFixed(2)}` : "N/A"}
                            </p>
                            <Link
                              href={`/checkout?${q.toString()}`}
                              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                            >
                              Select
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default function HotelDetailsPage() {
  return (
    <Suspense fallback={<div className="rounded-2xl border border-slate-200 bg-white p-6">Loading hotel...</div>}>
      <HotelContent />
    </Suspense>
  );
}
