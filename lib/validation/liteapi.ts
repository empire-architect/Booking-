import { z } from "zod";

export const placesQuerySchema = z.object({
  q: z.string().min(2, "Search query too short"),
});

export const ratesSearchSchema = z
  .object({
    mode: z.enum(["destination", "vibe", "hotel"]).default("destination"),
    checkin: z.string().min(10),
    checkout: z.string().min(10),
    adults: z.number().int().min(1).max(8).default(2),
    currency: z.string().length(3).default("USD"),
    guestNationality: z.string().length(2).default("US"),
    placeId: z.string().optional(),
    aiSearch: z.string().optional(),
    hotelIds: z.array(z.string()).optional(),
    maxRatesPerHotel: z.number().int().min(1).max(20).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === "destination" && !data.placeId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "placeId is required for destination mode",
        path: ["placeId"],
      });
    }

    if (data.mode === "vibe" && !data.aiSearch) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "aiSearch is required for vibe mode",
        path: ["aiSearch"],
      });
    }

    if (data.mode === "hotel" && (!data.hotelIds || data.hotelIds.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "hotelIds is required for hotel mode",
        path: ["hotelIds"],
      });
    }
  });

export const prebookSchema = z.object({
  offerId: z.string().min(2),
  hotelId: z.string().optional(),
  checkin: z.string().optional(),
  checkout: z.string().optional(),
  adults: z.number().int().min(1).max(8).default(2),
  currency: z.string().length(3).default("USD"),
  guestNationality: z.string().length(2).default("US"),
  holder: z
    .object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
    })
    .optional(),
});

export const directBookSchema = z.object({
  prebookId: z.string().min(2),
  holder: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
  }),
  payment: z.object({
    method: z.literal("TRANSACTION_ID"),
    transactionId: z.string().min(2),
  }),
  guests: z.array(
    z.object({
      occupancyNumber: z.number().int().min(1),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
    })
  ),
});
