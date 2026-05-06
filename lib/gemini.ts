import { destinations } from "@/lib/mock-data";
import { generateTripPlan } from "@/lib/planner";
import { ItineraryDay, TripFormInput, TripPlan } from "@/lib/types";

type GeminiCandidate = {
  content?: {
    parts?: Array<{
      text?: string;
    }>;
  };
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
};

type GeminiTripPayload = {
  summary: string;
  days: Array<{
    dayLabel: string;
    theme: string;
    stops: Array<{
      time: string;
      title: string;
      notes: string;
    }>;
  }>;
  suggestions?: string[];
};

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function findDestinationByTitle(city: string, title: string) {
  const normalized = title.trim().toLowerCase();
  const normalizedCity = normalize(city);

  return destinations.find(
    (item) =>
      (normalize(item.city) === normalizedCity ||
        normalize(item.city).includes(normalizedCity) ||
        normalizedCity.includes(normalize(item.city))) &&
      item.name.trim().toLowerCase() === normalized
  );
}

function extractText(response: GeminiResponse) {
  return response.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim() || "";
}

function safeJsonParse<T>(value: string): T | null {
  const cleaned = value.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

function hydrateGeminiPlan(input: TripFormInput, payload: GeminiTripPayload): TripPlan {
  const fallback = generateTripPlan(input);
  const payloadDays = Array.isArray(payload.days) ? payload.days : [];

  const days: ItineraryDay[] = payloadDays.map((day, dayIndex) => {
    const stops = day.stops.map((stop) => {
      const matched = findDestinationByTitle(input.city, stop.title);
      const baseCost = matched
        ? matched.entryFee + matched.mealBudget + matched.transportBudget
        : 50000;

      return {
        time: stop.time,
        destinationId: matched?.id || `custom-${dayIndex}-${stop.title.toLowerCase().replace(/\s+/g, "-")}`,
        title: stop.title,
        cost: baseCost,
        notes: stop.notes
      };
    });

    return {
      dayLabel: day.dayLabel,
      theme: day.theme,
      stops,
      subtotal: stops.reduce((sum, stop) => sum + stop.cost * input.travelers, 0)
    };
  });

  const knownStops = days.flatMap((day) => day.stops);
  const seen = new Set<string>();
  const cart = knownStops
    .map((stop) => findDestinationByTitle(input.city, stop.title))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .filter((destination) => {
      if (seen.has(destination.id)) {
        return false;
      }

      seen.add(destination.id);
      return true;
    })
    .map((destination) => ({
      destinationId: destination.id,
      title: destination.name,
      ticketPrice: destination.entryFee,
      qrCodeHash: `QR-${destination.id.toUpperCase()}`,
      status: "Active" as const
    }));

  return {
    ...fallback,
    summary: payload.summary || fallback.summary,
    days: days.length > 0 ? days : fallback.days,
    suggestions:
      payload.suggestions && payload.suggestions.length > 0 ? payload.suggestions : fallback.suggestions,
    cart: cart.length > 0 ? cart : fallback.cart
  };
}

function buildPrompt(input: TripFormInput) {
  const cityDestinations = destinations
    .filter((item) => {
      const destinationCity = normalize(item.city);
      const inputCity = normalize(input.city);

      return (
        destinationCity === inputCity ||
        destinationCity.includes(inputCity) ||
        inputCity.includes(destinationCity)
      );
    })
    .map(
      (item) =>
        `- ${item.name} | type: ${item.type} | category: ${item.category} | fee: ${item.entryFee} | hours: ${item.operatingHours} | summary: ${item.summary}`
    )
    .join("\n");
  const fallbackReference = destinations
    .map(
      (item) =>
        `- ${item.name} (${item.city}) | type: ${item.type} | category: ${item.category} | fee: ${item.entryFee} | hours: ${item.operatingHours}`
    )
    .join("\n");

  return `
Kamu adalah AI itinerary planner untuk aplikasi TRABAS.
Tugasmu membuat itinerary micro-trip yang realistis, efisien, dan sesuai budget.

Input pengguna:
- lokasi tujuan: ${input.city}
- durasi hari: ${input.days}
- jumlah traveler: ${input.travelers}
- budget total rupiah: ${input.budget}
- gaya perjalanan: ${input.style}
- preferensi tambahan: ${input.notes || "tidak ada"}

${cityDestinations ? `Data destinasi yang cukup relevan:\n${cityDestinations}` : `Belum ada data destinasi lokal yang persis untuk lokasi ini di database saat ini.
Kalau perlu, kamu boleh menyusun itinerary berdasarkan pengetahuan umum tentang area tersebut dan referensi pola berikut:
${fallbackReference}`}

Aturan:
- prioritaskan rute yang logis dan tidak bolak-balik
- perhatikan jam operasional
- hindari jadwal yang mustahil
- gunakan nama destinasi persis seperti di data jika memakai data referensi yang tersedia
- kalau budget mepet, pilih kombinasi yang lebih hemat
- hasil harus dalam Bahasa Indonesia

Balas HANYA dalam JSON valid dengan bentuk:
{
  "summary": "string",
  "days": [
    {
      "dayLabel": "Hari 1",
      "theme": "string",
      "stops": [
        {
          "time": "08:00",
          "title": "Nama destinasi",
          "notes": "alasan atau catatan singkat"
        }
      ]
    }
  ],
  "suggestions": ["string", "string", "string"]
}
`.trim();
}

export async function generateTripPlanWithGemini(input: TripFormInput): Promise<TripPlan> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return generateTripPlan(input);
  }

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: buildPrompt(input)
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7
        }
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      return generateTripPlan(input);
    }

    const data = (await response.json()) as GeminiResponse;
    const text = extractText(data);
    const parsed = safeJsonParse<GeminiTripPayload>(text);

    if (!parsed) {
      return generateTripPlan(input);
    }

    return hydrateGeminiPlan(input, parsed);
  } catch {
    return generateTripPlan(input);
  }
}
