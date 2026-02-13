import { NextResponse } from "next/server";
import { getHotelDetails, searchRates } from "@/lib/liteapi/service";

type Params = { params: Promise<{ hotelId: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { hotelId } = await params;
    const { searchParams } = new URL(request.url);

    const checkin = searchParams.get("checkin") || undefined;
    const checkout = searchParams.get("checkout") || undefined;
    const adults = Number(searchParams.get("adults") || "2");
    const currency = searchParams.get("currency") || "USD";
    const guestNationality = searchParams.get("guestNationality") || "US";

    const hotel = await getHotelDetails(hotelId);

    let rates = null;
    if (checkin && checkout) {
      rates = await searchRates({
        mode: "hotel",
        hotelIds: [hotelId],
        checkin,
        checkout,
        adults,
        currency,
        guestNationality,
      });
    }

    return NextResponse.json({ hotel, rates });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
