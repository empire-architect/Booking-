export type PlaceResult = {
  placeId: string;
  displayName: string;
  formattedAddress?: string;
};

export type RatesSearchMode = "destination" | "vibe" | "hotel";

export type RatesSearchInput = {
  mode: RatesSearchMode;
  checkin: string;
  checkout: string;
  adults: number;
  currency: string;
  guestNationality: string;
  placeId?: string;
  aiSearch?: string;
  hotelIds?: string[];
  maxRatesPerHotel?: number;
};

export type LiteRate = {
  rateId?: string;
  name?: string;
  mappedRoomId?: number;
  boardName?: string;
  retailRate?: {
    total?: Array<{ amount: number; currency: string }>;
    taxesAndFees?: Array<{ included?: boolean; amount?: number }>;
  };
  cancellationPolicies?: {
    refundableTag?: string;
    cancelPolicyInfos?: Array<{ cancelTime?: string }>;
  };
};

export type LiteRoomType = {
  offerId?: string;
  rates?: LiteRate[];
};

export type LiteRatesItem = {
  hotelId: string;
  roomTypes?: LiteRoomType[];
};

export type LiteHotelCard = {
  id: string;
  name: string;
  main_photo?: string;
  address?: string;
  rating?: number;
  story?: string;
  city?: string;
  country?: string;
  tags?: string[];
};

export type RatesSearchResponse = {
  data: LiteRatesItem[];
  hotels?: LiteHotelCard[];
  sandbox?: boolean;
  guestLevel?: number;
};

export type PrebookResponse = {
  data: {
    prebookId: string;
    offerId: string;
    hotelId?: string;
    transactionId: string;
    secretKey: string;
    price?: number;
    currency?: string;
    paymentTypes?: string[];
    roomTypes?: LiteRoomType[];
  };
};

export type BookInput = {
  prebookId: string;
  holder: {
    firstName: string;
    lastName: string;
    email: string;
  };
  payment: {
    method: "TRANSACTION_ID";
    transactionId: string;
  };
  guests: Array<{
    occupancyNumber: number;
    firstName: string;
    lastName: string;
    email: string;
  }>;
};

export type BookResponse = {
  data: {
    bookingId: string;
    status: string;
    hotelConfirmationCode?: string;
    checkin?: string;
    checkout?: string;
    hotel?: {
      hotelId?: string;
      name?: string;
    };
    price?: number;
    currency?: string;
  };
};

export type HotelDetailsResponse = {
  data: {
    id: string;
    name: string;
    hotelDescription?: string;
    main_photo?: string;
    city?: string;
    country?: string;
    address?: string;
    starRating?: number;
    rating?: number;
    hotelImages?: Array<{ url: string; defaultImage?: boolean }>;
    rooms?: Array<{
      id?: number;
      roomName?: string;
      photos?: Array<{ url: string }>;
    }>;
    sentiment_analysis?: {
      pros?: string[];
      cons?: string[];
    };
    hotelFacilities?: string[];
    policies?: Array<{ name?: string; description?: string }>;
  };
};
