import { createTripAction } from "@/app/trips/new/actions";
import { supportedCities } from "@/lib/mock-data";

export function PlannerForm() {
  return (
    <form action={createTripAction} className="card font-body rounded-[2rem] p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-teal-700">AI Trip Planner</p>
          <h2 className="font-display mt-2 text-3xl text-slate-900">Rancang micro-trip dalam sekali isi</h2>
        </div>
        <div className="pill rounded-full px-4 py-2 text-xs text-slate-600">MVP tanpa login</div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm text-slate-600">Kota</span>
          <select name="city" className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 outline-none">
            {supportedCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-slate-600">Budget total</span>
          <input
            name="budget"
            type="number"
            min="100000"
            step="50000"
            defaultValue="1500000"
            className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 outline-none"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-slate-600">Durasi (hari)</span>
          <input
            name="days"
            type="number"
            min="1"
            max="3"
            defaultValue="2"
            className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 outline-none"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-slate-600">Jumlah traveler</span>
          <input
            name="travelers"
            type="number"
            min="1"
            max="8"
            defaultValue="2"
            className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 outline-none"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm text-slate-600">Gaya perjalanan</span>
          <select name="style" className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 outline-none">
            <option value="balanced">Balanced</option>
            <option value="hemat">Hemat</option>
            <option value="hidden-gem">Hidden Gem</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 md:col-span-2">
          <span className="text-sm text-slate-600">Catatan preferensi</span>
          <textarea
            name="notes"
            rows={4}
            placeholder="Contoh: suka sunrise, hindari tempat terlalu ramai, cari kuliner lokal halal."
            className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 outline-none"
          />
        </label>
      </div>

      <button
        type="submit"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-teal-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
      >
        Generate itinerary
      </button>
    </form>
  );
}
