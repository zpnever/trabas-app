import { destinations } from "@/lib/mock-data";
import { BudgetBreakdown, Destination, ItineraryDay, ItineraryStop, TripFormInput, TripPlan } from "@/lib/types";

function slugify(value: string) {
  return value.toLowerCase().replace(/\s+/g, "-");
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function calculateStopTotal(entryFee: number, mealCost: number, transportCost: number, travelers: number) {
  return (entryFee + mealCost) * travelers + transportCost;
}

function hoursToLabel(hour: number) {
  return `${hour.toString().padStart(2, "0")}:00`;
}

function minutesToRange(startMinutes: number, endMinutes: number) {
  const format = (value: number) => {
    const hour = Math.floor(value / 60);
    const minute = value % 60;

    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  };

  return `${format(startMinutes)} - ${format(endMinutes)}`;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function buildMapsUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function createGenericDestinations(input: TripFormInput): Destination[] {
  const location = input.city.trim();

  return [
    {
      id: `${slugify(location)}-landmark`,
      name: `Landmark ${location}`,
      city: location,
      address: `${location}, Indonesia`,
      type: "Popular",
      category: "Sightseeing",
      coordinates: "Custom",
      entryFee: 25000,
      operatingHours: "08:00 - 18:00",
      openAt: 8,
      closeAt: 18,
      visitMinutes: 120,
      mealBudget: 45000,
      transportBudget: 30000,
      summary: `Spot utama untuk mengenal area ${location} tanpa rute yang terlalu rumit.`
    },
    {
      id: `${slugify(location)}-kuliner`,
      name: `Sentra Kuliner ${location}`,
      city: location,
      address: `${location}, Indonesia`,
      type: "Hidden Gem",
      category: "Food",
      coordinates: "Custom",
      entryFee: 0,
      operatingHours: "10:00 - 22:00",
      openAt: 10,
      closeAt: 22,
      visitMinutes: 90,
      mealBudget: 65000,
      transportBudget: 25000,
      summary: `Area makan lokal untuk menjaga budget tetap terkendali sambil eksplor rasa khas ${location}.`
    },
    {
      id: `${slugify(location)}-santai`,
      name: `Spot Santai ${location}`,
      city: location,
      address: `${location}, Indonesia`,
      type: "Hidden Gem",
      category: "Leisure",
      coordinates: "Custom",
      entryFee: 15000,
      operatingHours: "09:00 - 20:00",
      openAt: 9,
      closeAt: 20,
      visitMinutes: 90,
      mealBudget: 35000,
      transportBudget: 20000,
      summary: `Lokasi penutup yang lebih ringan untuk sore atau malam hari di sekitar ${location}.`
    }
  ];
}

function pickDestinations(input: TripFormInput) {
  const location = normalize(input.city);
  const exactMatches = destinations.filter((item) => normalize(item.city) === location);
  const partialMatches = destinations.filter((item) => {
    const city = normalize(item.city);
    return city.includes(location) || location.includes(city);
  });
  const matches = exactMatches.length > 0 ? exactMatches : partialMatches;
  const sorted = [...matches].sort((a, b) => {
    const styleBoost =
      input.style === "hemat"
        ? a.entryFee + a.transportBudget - (b.entryFee + b.transportBudget)
        : input.style === "hidden-gem"
          ? Number(b.type === "Hidden Gem") - Number(a.type === "Hidden Gem")
          : b.entryFee - a.entryFee;

    return styleBoost;
  });

  if (sorted.length === 0) {
    return createGenericDestinations(input);
  }

  const needed = Math.max(input.days * 2, Math.min(3, sorted.length));
  return sorted.slice(0, needed);
}

function buildStops(dayIndex: number, dailyPool: Destination[], travelers: number) {
  let currentMinutes = 8 * 60;

  return dailyPool.map<ItineraryStop>((destination, index) => {
    currentMinutes = Math.max(currentMinutes, destination.openAt * 60);

    const startMinutes = currentMinutes;
    const transferMinutes = index === 0 ? 0 : 30;
    const rawEndMinutes = startMinutes + destination.visitMinutes + transferMinutes;
    const endMinutes = Math.min(
      Math.max(rawEndMinutes, startMinutes + 60),
      destination.closeAt * 60
    );
    const label = minutesToRange(startMinutes, endMinutes);

    currentMinutes = endMinutes;

    return {
      time: label,
      destinationId: destination.id,
      title: destination.name,
      address: destination.address,
      mapsUrl: buildMapsUrl(`${destination.name}, ${destination.address}`),
      entryFee: destination.entryFee,
      mealCost: destination.mealBudget,
      transportCost: destination.transportBudget,
      cost: calculateStopTotal(
        destination.entryFee,
        destination.mealBudget,
        destination.transportBudget,
        travelers
      ),
      notes:
        dayIndex === 0 && index === 0
          ? `Mulai dari lokasi dengan operasional pagi agar itinerary tetap realistis. Jam kunjungan disusun agar masih ada ruang perpindahan berikutnya.`
          : `${destination.summary} Jam operasional ${destination.operatingHours}. Rentang waktu ini sudah mempertimbangkan perpindahan antarlokasi.`
    };
  });
}

function buildDailyPool(selected: Destination[], dayIndex: number, perDay: number) {
  if (selected.length === 0) {
    return [];
  }

  const start = dayIndex * perDay;
  const directSlice = selected.slice(start, start + perDay);

  if (directSlice.length === perDay) {
    return directSlice;
  }

  return Array.from({ length: perDay }, (_, offset) => {
    const index = (start + offset) % selected.length;
    return selected[index];
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

function buildBudgetFromStops(days: ItineraryDay[], budgetLimit: number, travelers: number): BudgetBreakdown {
  const tickets = days.reduce(
    (sum, day) => sum + day.stops.reduce((inner, stop) => inner + stop.entryFee * travelers, 0),
    0
  );
  const food = days.reduce(
    (sum, day) => sum + day.stops.reduce((inner, stop) => inner + stop.mealCost * travelers, 0),
    0
  );
  const transport = days.reduce(
    (sum, day) => sum + day.stops.reduce((inner, stop) => inner + stop.transportCost, 0),
    0
  );
  const buffer = Math.round(budgetLimit * 0.1);
  const total = tickets + food + transport + buffer;
  const remaining = budgetLimit - total;

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
  const perDay = selected.length >= input.days ? Math.max(1, Math.ceil(selected.length / input.days)) : 1;
  const usesGenericFallback = selected.every((item) => item.coordinates === "Custom");

  const days: ItineraryDay[] = Array.from({ length: input.days }, (_, index) => {
    const dayPool = buildDailyPool(selected, index, perDay);
    const stops = buildStops(index, dayPool.length > 0 ? dayPool : selected.slice(0, 1), input.travelers);
    const subtotal = stops.reduce((sum, stop) => sum + stop.cost, 0);

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

  const budget = buildBudgetFromStops(days, input.budget, input.travelers);
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
    summary: `${titleSummary} ${
      usesGenericFallback
        ? `Data detail untuk lokasi ini belum lengkap, jadi itinerary disusun sebagai starting point yang tetap relevan untuk eksplorasi area tersebut.`
        : `Planner memprioritaskan tempat yang buka lebih pagi dan mengurangi bolak-balik area wisata.`
    }`,
    days,
    budget,
    suggestions: [
      usesGenericFallback
        ? "Lengkapi dengan referensi destinasi lokal atau titik favorit pribadi agar hasil itinerary makin presisi."
        : budget.status === "warning"
          ? "Kurangi 1 destinasi berbayar atau pilih gaya Hemat untuk menurunkan total biaya."
          : "Aktifkan pre-order tiket agar check-in di lokasi lebih cepat.",
      budget.status === "warning"
        ? "Pertimbangkan memadatkan kunjungan ke area yang berdekatan supaya ongkos transport turun."
        : "Tambahkan jeda makan atau coffee stop agar ritme trip tetap nyaman.",
      "Tambahkan hidden gem komunitas lokal sebagai slot sore hari untuk menjaga trip tetap fleksibel.",
      input.notes
        ? `Preferensi khusus terdeteksi: "${input.notes}". Pastikan ini tetap diprioritaskan saat meninjau hasil itinerary.`
        : "Tambahkan preferensi personal seperti tempo jalan, tipe kuliner, atau kebutuhan keluarga agar hasil itinerary semakin pas."
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
