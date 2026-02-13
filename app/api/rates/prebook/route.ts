import { NextResponse } from "next/server";
import { prebookOffer } from "@/lib/liteapi/service";
import { prebookSchema } from "@/lib/validation/liteapi";
import {
  BookingContext,
  encodeBookingSessionCookie,
  getBookingCookieName,
} from "@/lib/session";
import { createBookingSession } from "@/lib/session-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = prebookSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const prebook = await prebookOffer(parsed.data.offerId);
    const context: BookingContext = {
      prebookId: prebook.data.prebookId,
      transactionId: prebook.data.transactionId,
      secretKey: prebook.data.secretKey,
      offerId: prebook.data.offerId,
      holder: parsed.data.holder,
      guests: parsed.data.holder
        ? [
            {
              occupancyNumber: 1,
              firstName: parsed.data.holder.firstName,
              lastName: parsed.data.holder.lastName,
              email: parsed.data.holder.email,
            },
          ]
        : undefined,
      checkin: parsed.data.checkin,
      checkout: parsed.data.checkout,
      hotelId: parsed.data.hotelId,
      currency: prebook.data.currency,
      amount: prebook.data.price,
    };

    const sid = await createBookingSession(context, 60 * 30);

    const response = NextResponse.json(prebook);
    response.cookies.set(getBookingCookieName(), encodeBookingSessionCookie(sid), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 30,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
