import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { bookOffer } from "@/lib/liteapi/service";
import type { BookInput, BookResponse } from "@/types/liteapi";
import {
  decodeBookingSessionCookie,
  getBookingCookieName,
  type BookingContext,
} from "@/lib/session";
import { getBookingSession, updateBookingSession } from "@/lib/session-store";
import { directBookSchema } from "@/lib/validation/liteapi";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const cookieName = getBookingCookieName();

    const sessionCookie = decodeBookingSessionCookie(cookieStore.get(cookieName)?.value);
    const sessionRecord = sessionCookie?.sid ? await getBookingSession(sessionCookie.sid) : null;
    const cookieContext = (sessionRecord?.context ?? null) as BookingContext | null;

    // Idempotency: if already booked in this checkout session, return cached booking.
    if (sessionRecord?.bookingResult) {
      return NextResponse.json(sessionRecord.bookingResult as BookResponse, {
        status: 200,
      });
    }

    const body = await request.json().catch(() => ({}));

    let payload: BookInput;
    const parsedDirect = directBookSchema.safeParse(body);

    if (parsedDirect.success) {
      payload = parsedDirect.data;
    } else {
      if (!cookieContext?.prebookId || !cookieContext?.transactionId || !cookieContext?.holder) {
        return NextResponse.json(
          { error: "Missing booking context. Start from checkout again." },
          { status: 400 }
        );
      }

      payload = {
        prebookId: cookieContext.prebookId,
        holder: cookieContext.holder,
        payment: {
          method: "TRANSACTION_ID",
          transactionId: cookieContext.transactionId,
        },
        guests:
          cookieContext.guests ?? [
            {
              occupancyNumber: 1,
              firstName: cookieContext.holder.firstName,
              lastName: cookieContext.holder.lastName,
              email: cookieContext.holder.email,
            },
          ],
      };
    }

    const booking = await bookOffer(payload);

    if (sessionCookie?.sid) {
      await updateBookingSession(sessionCookie.sid, { bookingResult: booking });
    }

    const response = NextResponse.json(booking);

    // Keep cookie until TTL expiry so repeated confirm clicks stay idempotent.
    response.cookies.set(cookieName, cookieStore.get(cookieName)?.value ?? "", {
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
