import { destinations } from "@/lib/mock-data";
import { generateTripPlan } from "@/lib/planner";
import { ItineraryDay, TripFormInput, TripPlan } from "@/lib/types";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

type GeminiTripPayload = {
  summary: string;
  days: Array<{
    dayLabel: string;
    theme: string;
    stops: Array<{
      time: string;
      title: string;
      address: string;
      estimatedEntryFee: number;
      notes: string;
    }>;
  }>;
  suggestions?: string[];
};

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function logGemini(level: "info" | "warn" | "error", message: string, details?: Record<string, unknown>) {
  const payload = details ? ` ${JSON.stringify(details)}` : "";
  console[level](`[TRABAS][Gemini] ${message}${payload}`);
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function buildMapsUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function calculateStopTotal(entryFee: number, mealCost: number, transportCost: number, travelers: number) {
  return (entryFee + mealCost) * travelers + transportCost;
}

function isMealStop(title: string, notes: string) {
  const text = `${title} ${notes}`.toLowerCase();
  return ["makan", "kuliner", "warung", "cafe", "kafe", "lunch", "dinner", "sarapan", "brunch", "coffee"].some((keyword) =>
    text.includes(keyword)
  );
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
      const fallbackAddress = stop.address?.trim() || `${stop.title}, ${input.city}`;
      const fee = Number.isFinite(stop.estimatedEntryFee) && stop.estimatedEntryFee >= 0 ? stop.estimatedEntryFee : 0;
      const mealCost = matched ? matched.mealBudget : isMealStop(stop.title, stop.notes) ? 35000 : 0;
      const transportCost = matched ? matched.transportBudget : 25000;
      const entryFee = matched ? matched.entryFee : fee;
      const totalCost = calculateStopTotal(entryFee, mealCost, transportCost, input.travelers);

      return {
        time: stop.time,
        destinationId:
          matched?.id ||
          `custom-${dayIndex}-${stop.title.toLowerCase().replace(/\s+/g, "-")}`,
        title: stop.title,
        address: matched?.address || fallbackAddress,
        mapsUrl: buildMapsUrl(matched?.address ? `${stop.title}, ${matched.address}` : fallbackAddress),
        entryFee,
        mealCost,
        transportCost,
        cost: totalCost,
        notes: stop.notes
      };
    });

    return {
      dayLabel: day.dayLabel,
      theme: day.theme,
      stops,
      subtotal: stops.reduce((sum, stop) => sum + stop.cost, 0)
    };
  });

  const budget = {
    tickets: days.reduce((sum, day) => sum + day.stops.reduce((inner, stop) => inner + stop.entryFee * input.travelers, 0), 0),
    food: days.reduce((sum, day) => sum + day.stops.reduce((inner, stop) => inner + stop.mealCost * input.travelers, 0), 0),
    transport: days.reduce((sum, day) => sum + day.stops.reduce((inner, stop) => inner + stop.transportCost, 0), 0),
    buffer: Math.round(input.budget * 0.1),
    total: 0,
    remaining: 0,
    status: "safe" as const
  };
  budget.total = budget.tickets + budget.food + budget.transport + budget.buffer;
  budget.remaining = input.budget - budget.total;
  budget.status = budget.remaining >= 0 ? "safe" : "warning";

  const computedSummary =
    budget.status === "safe"
      ? `Trip ${input.days} hari di ${input.city} masih masuk budget dengan sisa Rp${formatRupiah(budget.remaining)}.`
      : `Trip ${input.days} hari di ${input.city} melewati budget sekitar Rp${formatRupiah(Math.abs(budget.remaining))}.`;

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
    summary: payload.summary ? `${payload.summary} ${computedSummary}` : computedSummary,
    days: days.length > 0 ? days : fallback.days,
    budget,
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
        `- ${item.name} | city: ${item.city} | address: ${item.address} | fee: ${item.entryFee} | hours: ${item.operatingHours} | summary: ${item.summary}`
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

${cityDestinations ? `Data destinasi lokal yang tersedia:\n${cityDestinations}` : `Belum ada data destinasi lokal untuk lokasi ini. Gunakan pengetahuan umum, tapi jangan gabungkan nama tempat dengan area yang tidak sesuai secara geografis.`}

Aturan penting:
- setiap stop wajib punya rentang jam spesifik, contoh "08:00 - 10:00"
- tulis alamat yang masuk akal dan spesifik
- jika sebuah tempat bukan berada di area input, jangan rekomendasikan
- berikan estimatedEntryFee yang realistis dalam rupiah, angka bulat tanpa titik atau teks
- hindari tempat yang jelas jauh atau tidak relevan dari lokasi tujuan
- hasil harus dalam Bahasa Indonesia

Balas hanya JSON valid dengan struktur:
{
  "summary": "string",
  "days": [
    {
      "dayLabel": "Hari 1",
      "theme": "string",
      "stops": [
        {
          "time": "08:00 - 10:00",
          "title": "string",
          "address": "string",
          "estimatedEntryFee": 40000,
          "notes": "string"
        }
      ]
    }
  ],
  "suggestions": ["string", "string", "string"]
}
`.trim();
}

function buildSchema() {
  return {
    type: "object",
    properties: {
      summary: { type: "string" },
      days: {
        type: "array",
        items: {
          type: "object",
          properties: {
            dayLabel: { type: "string" },
            theme: { type: "string" },
            stops: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  time: { type: "string" },
                  title: { type: "string" },
                  address: { type: "string" },
                  estimatedEntryFee: { type: "number" },
                  notes: { type: "string" }
                },
                required: ["time", "title", "address", "estimatedEntryFee", "notes"]
              }
            }
          },
          required: ["dayLabel", "theme", "stops"]
        }
      },
      suggestions: {
        type: "array",
        items: { type: "string" }
      }
    },
    required: ["summary", "days", "suggestions"]
  };
}

export async function generateTripPlanWithGemini(input: TripFormInput): Promise<TripPlan> {
  const apiKey = process.env.GEMINI_API_KEY;
  const context = {
    location: input.city,
    days: input.days,
    travelers: input.travelers,
    style: input.style,
    hasNotes: Boolean(input.notes)
  };

  if (!apiKey) {
    logGemini("warn", "GEMINI_API_KEY tidak ditemukan, memakai fallback planner lokal.", context);
    return generateTripPlan(input);
  }

  try {
    logGemini("info", "Mengirim request ke Gemini.", {
      ...context,
      model: GEMINI_MODEL
    });

    const response = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
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
          responseJsonSchema: buildSchema()
        }
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logGemini("error", "Gemini merespons non-OK, memakai fallback planner lokal.", {
        ...context,
        status: response.status,
        statusText: response.statusText,
        body: errorBody.slice(0, 500)
      });
      return generateTripPlan(input);
    }

    const data = (await response.json()) as GeminiResponse;
    const text = extractText(data);
    const parsed = safeJsonParse<GeminiTripPayload>(text);

    if (!parsed) {
      logGemini("error", "Respons Gemini tidak bisa diparse sebagai JSON valid, memakai fallback planner lokal.", {
        ...context,
        preview: text.slice(0, 500)
      });
      return generateTripPlan(input);
    }

    logGemini("info", "Gemini berhasil menghasilkan itinerary.", {
      ...context,
      suggestionCount: parsed.suggestions?.length || 0,
      dayCount: parsed.days?.length || 0
    });

    return hydrateGeminiPlan(input, parsed);
  } catch (error) {
    logGemini("error", "Request ke Gemini melempar exception, memakai fallback planner lokal.", {
      ...context,
      error: error instanceof Error ? error.message : String(error)
    });
    return generateTripPlan(input);
  }
}
