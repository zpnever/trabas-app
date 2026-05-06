import OpenAI from "openai";
import { destinations } from "@/lib/mock-data";
import { generateTripPlan } from "@/lib/planner";
import { ItineraryDay, TripFormInput, TripPlan } from "@/lib/types";

type OpenAIResponse = {
	output_text?: string;
	output?: Array<{
		type?: string;
		content?: Array<{
			type?: string;
			text?: string;
		}>;
	}>;
	error?: {
		message?: string;
		type?: string;
		code?: string;
	};
};

type OpenAITripPayload = {
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

const OPENAI_MODEL = process.env.OPENAI_MODEL || "openai/gpt-oss-20b";
const OPENAI_TIMEOUT_MS = 20_000;
const OPENAI_BASE_URL =
	process.env.OPENAI_BASE_URL || "https://api.groq.com/openai/v1";
let cachedClient: OpenAI | null = null;

function logOpenAI(
	level: "info" | "warn" | "error",
	message: string,
	details?: Record<string, unknown>,
) {
	const payload = details ? ` ${JSON.stringify(details)}` : "";
	console[level](`[TRABAS][OpenAI] ${message}${payload}`);
}

function getOpenAIClient() {
	if (cachedClient) {
		return cachedClient;
	}

	cachedClient = new OpenAI({
		apiKey: process.env.OPENAI_API_KEY,
		baseURL: OPENAI_BASE_URL,
		maxRetries: 0,
		timeout: OPENAI_TIMEOUT_MS,
	});

	return cachedClient;
}

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
			item.name.trim().toLowerCase() === normalized,
	);
}

function extractText(response: OpenAIResponse) {
	if (response.output_text) {
		return response.output_text.trim();
	}

	return (
		response.output
			?.flatMap((item) => item.content || [])
			.map((part) => part.text || "")
			.join("")
			.trim() || ""
	);
}

function safeJsonParse<T>(value: string): T | null {
	const cleaned = value
		.replace(/^```json\s*/i, "")
		.replace(/^```\s*/i, "")
		.replace(/\s*```$/i, "")
		.trim();

	try {
		return JSON.parse(cleaned) as T;
	} catch {
		return null;
	}
}

function extractFirstJsonObject(value: string) {
	const start = value.indexOf("{");

	if (start === -1) {
		return null;
	}

	let depth = 0;
	let inString = false;
	let escaped = false;

	for (let index = start; index < value.length; index += 1) {
		const char = value[index];

		if (inString) {
			if (escaped) {
				escaped = false;
				continue;
			}

			if (char === "\\") {
				escaped = true;
				continue;
			}

			if (char === '"') {
				inString = false;
			}

			continue;
		}

		if (char === '"') {
			inString = true;
			continue;
		}

		if (char === "{") {
			depth += 1;
		}

		if (char === "}") {
			depth -= 1;

			if (depth === 0) {
				return value.slice(start, index + 1);
			}
		}
	}

	return null;
}

function parseTripPayload(value: string) {
	const direct = safeJsonParse<OpenAITripPayload>(value);

	if (direct) {
		return direct;
	}

	const embeddedJson = extractFirstJsonObject(value);

	if (!embeddedJson) {
		return null;
	}

	return safeJsonParse<OpenAITripPayload>(embeddedJson);
}

function hydrateOpenAIPlan(
	input: TripFormInput,
	payload: OpenAITripPayload,
): TripPlan {
	const fallback = generateTripPlan(input);
	const payloadDays = Array.isArray(payload.days) ? payload.days : [];

	const days: ItineraryDay[] = payloadDays.map((day, dayIndex) => {
		const stops = day.stops.map((stop) => {
			const matched = findDestinationByTitle(input.city, stop.title);
			const baseCost =
				matched ?
					matched.entryFee + matched.mealBudget + matched.transportBudget
				:	50000;

			return {
				time: stop.time,
				destinationId:
					matched?.id ||
					`custom-${dayIndex}-${stop.title.toLowerCase().replace(/\s+/g, "-")}`,
				title: stop.title,
				cost: baseCost,
				notes: stop.notes,
			};
		});

		return {
			dayLabel: day.dayLabel,
			theme: day.theme,
			stops,
			subtotal: stops.reduce(
				(sum, stop) => sum + stop.cost * input.travelers,
				0,
			),
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
			status: "Active" as const,
		}));

	return {
		...fallback,
		summary: payload.summary || fallback.summary,
		days: days.length > 0 ? days : fallback.days,
		suggestions:
			payload.suggestions && payload.suggestions.length > 0 ?
				payload.suggestions
			:	fallback.suggestions,
		cart: cart.length > 0 ? cart : fallback.cart,
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
				`- ${item.name} | type: ${item.type} | category: ${item.category} | fee: ${item.entryFee} | hours: ${item.operatingHours} | summary: ${item.summary}`,
		)
		.join("\n");
	const fallbackReference = destinations
		.map(
			(item) =>
				`- ${item.name} (${item.city}) | type: ${item.type} | category: ${item.category} | fee: ${item.entryFee} | hours: ${item.operatingHours}`,
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

${
	cityDestinations ?
		`Data destinasi yang cukup relevan:\n${cityDestinations}`
	:	`Belum ada data destinasi lokal yang persis untuk lokasi ini di database saat ini.
Kalau perlu, kamu boleh menyusun itinerary berdasarkan pengetahuan umum tentang area tersebut dan referensi pola berikut:
${fallbackReference}`
}

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
Jangan tambahkan penjelasan, reasoning, pembuka, atau markdown di luar JSON.
`.trim();
}

export async function generateTripPlanWithOpenAI(
	input: TripFormInput,
): Promise<TripPlan> {
	const apiKey = process.env.OPENAI_API_KEY;
	const context = {
		location: input.city,
		days: input.days,
		travelers: input.travelers,
		style: input.style,
		hasNotes: Boolean(input.notes),
	};

	if (!apiKey) {
		logOpenAI(
			"warn",
			"OPENAI_API_KEY tidak ditemukan, memakai fallback planner lokal.",
			context,
		);
		return generateTripPlan(input);
	}

	try {
		const client = getOpenAIClient();

		logOpenAI("info", "Mengirim request ke OpenAI.", {
			...context,
			model: OPENAI_MODEL,
			baseURL: OPENAI_BASE_URL,
		});

		const response = await client.responses.create({
			model: OPENAI_MODEL,
			instructions: "Kamu adalah AI itinerary planner untuk aplikasi TRABAS.",
			input: buildPrompt(input),
			max_output_tokens: 1400,
		});
		const text = extractText(response as OpenAIResponse);
		const parsed = parseTripPayload(text);

		if (!parsed) {
			logOpenAI(
				"error",
				"Respons OpenAI tidak bisa diparse sebagai JSON valid, memakai fallback planner lokal.",
				{
					...context,
					requestId:
						"_request_id" in response ? response._request_id : undefined,
					preview: text.slice(0, 500),
				},
			);
			return generateTripPlan(input);
		}

		logOpenAI("info", "OpenAI berhasil menghasilkan itinerary.", {
			...context,
			requestId: "_request_id" in response ? response._request_id : undefined,
			suggestionCount: parsed.suggestions?.length || 0,
			dayCount: parsed.days?.length || 0,
		});

		return hydrateOpenAIPlan(input, parsed);
	} catch (error) {
		const errorObject = error as {
			status?: number;
			message?: string;
			request_id?: string;
			code?: string;
			type?: string;
		};

		logOpenAI(
			"error",
			"Request ke OpenAI melempar exception, memakai fallback planner lokal.",
			{
				...context,
				status: errorObject?.status,
				code: errorObject?.code,
				type: errorObject?.type,
				requestId: errorObject?.request_id,
				error: error instanceof Error ? error.message : String(error),
			},
		);
		return generateTripPlan(input);
	}
}
