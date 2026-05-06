import { destinations } from "@/lib/mock-data";
import { BudgetBreakdown, Destination, ItineraryDay, ItineraryStop, TripFormInput, TripPlan } from "@/lib/types";

function slugify(value: string) {
  return value.toLowerCase().replace(/\s+/g, "-");
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function hoursToLabel(hour: number) {
  return `${hour.toString().padStart(2, "0")}:00`;
}

function pickDestinations(input: TripFormInput) {
  const matches = destinations.filter((item) => item.city === input.city);
  const sorted = [...matches].sort((a, b) => {
    const styleBoost =
      input.style === "hemat"
        ? a.entryFee + a.transportBudget - (b.entryFee + b.transportBudget)
        : input.style === "hidden-gem"
          ? Number(b.type === "Hidden Gem") - Number(a.type === "Hidden Gem")
          : b.entryFee - a.entryFee;

    return styleBoost;
  });

  const needed = Math.max(input.days * 2, Math.min(3, sorted.length));
  return sorted.slice(0, needed);
}

function buildStops(dayIndex: number, dailyPool: Destination[]) {
  let currentHour = 8;

  return dailyPool.map<ItineraryStop>((destination, index) => {
    currentHour = Math.max(currentHour, destination.openAt);
    const label = hoursToLabel(currentHour);
    currentHour += Math.ceil(destination.visitMinutes / 60) + (index === 0 ? 1 : 0);

    return {
      time: label,
      destinationId: destination.id,
      title: destination.name,
      cost: destination.entryFee + destination.mealBudget + destination.transportBudget,
      notes:
        dayIndex === 0 && index === 0
          ? `Mulai dari lokasi dengan operasional pagi agar itinerary tetap realistis.`
          : `${destination.summary} Jam operasional ${destination.operatingHours}.`
    };
  });
}

function buildBudget(input: TripFormInput, selected: Destination[]): BudgetBreakdown {
  const tickets = selected.reduce((sum, item) => sum + item.entryFee, 0) * input.travelers;
  const food = selected.reduce((sum, item) => sum + item.mealBudget, 0) * input.travelers;
  const transport = selected.reduce((sum, item) => sum + item.transportBudget, 0);
  const buffer = Math.round(input.budget * 0.1);
  const total = tickets + food + transport + buffer;
  const remaining = input.budget - total;

  return {
    tickets,
    food,
    transport,
    buffer,
    total,
    remaining,
    status: remaining >= 0 ? "safe" : "warning"
  };
}

export function generateTripPlan(input: TripFormInput): TripPlan {
  const selected = pickDestinations(input);
  const perDay = Math.max(1, Math.ceil(selected.length / input.days));

  const days: ItineraryDay[] = Array.from({ length: input.days }, (_, index) => {
    const slice = selected.slice(index * perDay, index * perDay + perDay);
    const stops = buildStops(index, slice.length > 0 ? slice : selected.slice(0, 1));
    const subtotal = stops.reduce((sum, stop) => sum + stop.cost * input.travelers, 0);

    return {
      dayLabel: `Hari ${index + 1}`,
      theme:
        input.style === "hidden-gem"
          ? "Eksplor spot lokal dengan arus wisata lebih ringan"
          : input.style === "hemat"
            ? "Rute efisien dengan fokus biaya minimum"
            : "Campuran destinasi populer dan ritme santai",
      stops,
      subtotal
    };
  });

  const budget = buildBudget(input, selected);
  const titleSummary =
    budget.status === "safe"
      ? `Trip ${input.days} hari di ${input.city} masih masuk budget dengan sisa Rp${formatRupiah(
          budget.remaining
        )}.`
      : `Trip ${input.days} hari di ${input.city} melewati budget sekitar Rp${formatRupiah(
          Math.abs(budget.remaining)
        )}.`;

  return {
    id: `${slugify(input.city)}-${input.days}d-${input.travelers}p`,
    input,
    summary: `${titleSummary} Planner memprioritaskan tempat yang buka lebih pagi dan mengurangi bolak-balik area wisata.`,
    days,
    budget,
    suggestions: [
      budget.status === "warning"
        ? "Kurangi 1 destinasi berbayar atau pilih gaya Hemat untuk menurunkan total biaya."
        : "Aktifkan pre-order tiket agar check-in di lokasi lebih cepat.",
      "Tambahkan hidden gem komunitas lokal sebagai slot sore hari untuk menjaga trip tetap fleksibel.",
      input.notes
        ? `Preferensi khusus terdeteksi: "${input.notes}". Ini sebaiknya dipakai sebagai konteks prompt Gemini.`
        : "Belum ada preferensi khusus. Nanti kita bisa tambahkan prompt persona traveler agar hasil AI lebih personal."
    ],
    cart: selected.map((destination) => ({
      destinationId: destination.id,
      title: destination.name,
      ticketPrice: destination.entryFee,
      qrCodeHash: `QR-${destination.id.toUpperCase()}`,
      status: "Active"
    }))
  };
}
