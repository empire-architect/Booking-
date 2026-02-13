import { liteBookPost, liteDataGet, liteDataPost } from "@/lib/liteapi/client";
import type {
  BookInput,
  BookResponse,
  HotelDetailsResponse,
  PlaceResult,
  PrebookResponse,
  RatesSearchInput,
  RatesSearchResponse,
} from "@/types/liteapi";

export async function searchPlaces(query: string) {
  const response = await liteDataGet<{ data: PlaceResult[] }>(
    `/data/places?textQuery=${encodeURIComponent(query)}`
  );
  return response;
}

export async function searchRates(input: RatesSearchInput) {
  const body: Record<string, unknown> = {
    occupancies: [{ adults: input.adults }],
    currency: input.currency,
    guestNationality: input.guestNationality,
    checkin: input.checkin,
    checkout: input.checkout,
    roomMapping: true,
    includeHotelData: true,
  };

  if (typeof input.maxRatesPerHotel === "number") {
    body.maxRatesPerHotel = input.maxRatesPerHotel;
  }

  if (input.mode === "destination") {
    body.placeId = input.placeId;
  } else if (input.mode === "vibe") {
    body.aiSearch = input.aiSearch;
  } else {
    body.hotelIds = input.hotelIds;
  }

  return liteDataPost<RatesSearchResponse>("/hotels/rates", body);
}

export async function getHotelDetails(hotelId: string) {
  return liteDataGet<HotelDetailsResponse>(
    `/data/hotel?hotelId=${encodeURIComponent(hotelId)}&timeout=4`
  );
}

export async function prebookOffer(offerId: string) {
  return liteBookPost<PrebookResponse>("/rates/prebook", {
    usePaymentSdk: true,
    offerId,
  });
}

export async function bookOffer(payload: BookInput) {
  return liteBookPost<BookResponse>("/rates/book", payload);
}
