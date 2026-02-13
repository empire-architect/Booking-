import { NextResponse } from "next/server";
import { searchRates } from "@/lib/liteapi/service";
import { ratesSearchSchema } from "@/lib/validation/liteapi";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = ratesSearchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = await searchRates(parsed.data);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
