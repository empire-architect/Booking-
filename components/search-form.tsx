"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Place = {
  placeId: string;
  displayName: string;
  formattedAddress?: string;
};

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function SearchForm() {
  const router = useRouter();

  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return formatDate(d);
  }, []);

  const twoDaysLater = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return formatDate(d);
  }, []);

  const [mode, setMode] = useState<"destination" | "vibe">("destination");
  const [destinationText, setDestinationText] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [vibe, setVibe] = useState("boutique stay near nightlife");

  const [checkin, setCheckin] = useState(tomorrow);
  const [checkout, setCheckout] = useState(twoDaysLater);
  const [adults, setAdults] = useState(2);
  const [currency, setCurrency] = useState("USD");
  const [guestNationality, setGuestNationality] = useState("US");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const query = destinationText.trim();
    if (mode !== "destination" || query.length < 2) {
      return;
    }

    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/places?q=${encodeURIComponent(query)}`, {
          signal: ctrl.signal,
        });
        const json = await response.json();
        setPlaces(json?.data ?? []);
      } catch {
        // ignore transient autocomplete errors
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [destinationText, mode]);

  function submit() {
    setError(null);

    if (mode === "destination" && !selectedPlace?.placeId) {
      setError("Select a destination from suggestions.");
      return;
    }

    if (new Date(checkout) <= new Date(checkin)) {
      setError("Checkout must be after checkin.");
      return;
    }

    const params = new URLSearchParams({
      mode,
      checkin,
      checkout,
      adults: String(adults),
      currency,
      guestNationality,
    });

    if (mode === "destination") {
      params.set("placeId", selectedPlace!.placeId);
      params.set("destinationLabel", selectedPlace!.displayName);
    } else {
      params.set("vibe", vibe);
    }

    router.push(`/results?${params.toString()}`);
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex gap-2 rounded-full bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => {
            setMode("destination");
            setPlaces([]);
          }}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
            mode === "destination" ? "bg-white text-slate-900 shadow" : "text-slate-500"
          }`}
        >
          Search by destination
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("vibe");
            setPlaces([]);
          }}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
            mode === "vibe" ? "bg-white text-slate-900 shadow" : "text-slate-500"
          }`}
        >
          Search by vibe
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {mode === "destination" ? (
          <div className="relative lg:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-500">Destination</label>
            <input
              value={destinationText}
              onChange={(e) => {
                setDestinationText(e.target.value);
                setSelectedPlace(null);
                if (e.target.value.trim().length < 2) setPlaces([]);
              }}
              placeholder="e.g. London"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-blue-500 focus:ring"
            />
            {places.length > 0 && !selectedPlace && destinationText.trim().length >= 2 && (
              <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                {places.map((place) => (
                  <button
                    key={place.placeId}
                    type="button"
                    onClick={() => {
                      setSelectedPlace(place);
                      setDestinationText(place.displayName);
                      setPlaces([]);
                    }}
                    className="block w-full border-b border-slate-100 px-3 py-2 text-left hover:bg-slate-50"
                  >
                    <p className="text-sm font-medium text-slate-900">{place.displayName}</p>
                    {place.formattedAddress && (
                      <p className="text-xs text-slate-500">{place.formattedAddress}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-500">Vibe prompt</label>
            <input
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
              placeholder="e.g. romantic getaway in Paris"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-blue-500 focus:ring"
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Checkin</label>
          <input
            type="date"
            value={checkin}
            onChange={(e) => setCheckin(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-blue-500 focus:ring"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Checkout</label>
          <input
            type="date"
            value={checkout}
            onChange={(e) => setCheckout(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-blue-500 focus:ring"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Guests</label>
          <input
            type="number"
            min={1}
            max={8}
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value) || 1)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-blue-500 focus:ring"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Currency</label>
          <input
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 3))}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-blue-500 focus:ring"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Nationality</label>
          <input
            value={guestNationality}
            onChange={(e) => setGuestNationality(e.target.value.toUpperCase().slice(0, 2))}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-blue-500 focus:ring"
          />
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

      <button
        type="button"
        onClick={submit}
        className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700"
      >
        Search stays
      </button>
    </div>
  );
}
