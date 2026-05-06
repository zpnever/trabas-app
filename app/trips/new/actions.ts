"use server";

import { redirect } from "next/navigation";
import { generateTripPlanWithGemini } from "@/lib/gemini";
import { TripFormInput } from "@/lib/types";

function toPositiveInt(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

export async function createTripAction(formData: FormData) {
  const input: TripFormInput = {
    city: String(formData.get("city") || "Bandung"),
    days: clamp(toPositiveInt(formData.get("days"), 2), 1, 7),
    travelers: toPositiveInt(formData.get("travelers"), 2),
    budget: toPositiveInt(formData.get("budget"), 1500000),
    style: String(formData.get("style") || "balanced"),
    notes: String(formData.get("notes") || "").trim()
  };

  console.info(
    `[TRABAS][Planner] Menerima request itinerary ${JSON.stringify({
      location: input.city,
      days: input.days,
      travelers: input.travelers,
      budget: input.budget,
      style: input.style,
      hasNotes: Boolean(input.notes)
    })}`
  );

  const plan = await generateTripPlanWithGemini(input);
  const encoded = encodeURIComponent(Buffer.from(JSON.stringify(plan)).toString("base64url"));

  console.info(
    `[TRABAS][Planner] Itinerary selesai dibuat ${JSON.stringify({
      location: input.city,
      dayCount: plan.days.length,
      cartCount: plan.cart.length,
      budgetStatus: plan.budget.status
    })}`
  );

  redirect(`/trips/preview?plan=${encoded}`);
}
