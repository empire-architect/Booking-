import { NextResponse } from "next/server";
import { searchPlaces } from "@/lib/liteapi/service";
import { placesQuerySchema } from "@/lib/validation/liteapi";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = placesQuerySchema.safeParse({
      q: searchParams.get("q") ?? searchParams.get("textQuery") ?? "",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = await searchPlaces(parsed.data.q);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
