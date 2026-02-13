import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { bookOffer } from "@/lib/liteapi/service";
import type { BookInput } from "@/types/liteapi";
import { decodeSigned, getBookingCookieName, type BookingContext } from "@/lib/session";
import { directBookSchema } from "@/lib/validation/liteapi";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const cookieName = getBookingCookieName();
    const cookieContext = decodeSigned<BookingContext>(cookieStore.get(cookieName)?.value);

    const body = await request.json().catch(() => ({}));

    let payload: unknown;
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

    const booking = await bookOffer(payload as BookInput);
    const response = NextResponse.json(booking);

    response.cookies.set(cookieName, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
