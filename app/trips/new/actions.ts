"use server";

import { redirect } from "next/navigation";
import { generateTripPlanWithGemini } from "@/lib/gemini";
import { TripFormInput } from "@/lib/types";

function toPositiveInt(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function createTripAction(formData: FormData) {
  const input: TripFormInput = {
    city: String(formData.get("city") || "Bandung"),
    days: toPositiveInt(formData.get("days"), 2),
    travelers: toPositiveInt(formData.get("travelers"), 2),
    budget: toPositiveInt(formData.get("budget"), 1500000),
    style: String(formData.get("style") || "balanced"),
    notes: String(formData.get("notes") || "").trim()
  };

  const plan = await generateTripPlanWithGemini(input);
  const encoded = encodeURIComponent(Buffer.from(JSON.stringify(plan)).toString("base64url"));

  redirect(`/trips/preview?plan=${encoded}`);
}
