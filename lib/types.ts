export type DestinationType = "Hidden Gem" | "Popular";

export type Destination = {
  id: string;
  name: string;
  city: string;
  type: DestinationType;
  category: string;
  coordinates: string;
  entryFee: number;
  operatingHours: string;
  openAt: number;
  closeAt: number;
  visitMinutes: number;
  mealBudget: number;
  transportBudget: number;
  summary: string;
};

export type TripFormInput = {
  city: string;
  days: number;
  travelers: number;
  budget: number;
  style: string;
  notes: string;
};

export type ItineraryStop = {
  time: string;
  destinationId: string;
  title: string;
  cost: number;
  notes: string;
};

export type ItineraryDay = {
  dayLabel: string;
  theme: string;
  stops: ItineraryStop[];
  subtotal: number;
};

export type BudgetBreakdown = {
  tickets: number;
  food: number;
  transport: number;
  buffer: number;
  total: number;
  remaining: number;
  status: "safe" | "warning";
};

export type TripPlan = {
  id: string;
  input: TripFormInput;
  summary: string;
  days: ItineraryDay[];
  budget: BudgetBreakdown;
  suggestions: string[];
  cart: {
    destinationId: string;
    title: string;
    ticketPrice: number;
    qrCodeHash: string;
    status: "Active" | "Used";
  }[];
};
