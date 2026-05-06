import Link from "next/link";
import { Header } from "@/components/header";
import { TripPlan } from "@/lib/types";

function formatCurrency(value: number) {
  return `Rp${new Intl.NumberFormat("id-ID").format(value)}`;
}

function formatStyle(style: string) {
  if (style === "hidden-gem") {
    return "Hidden Gem";
  }

  if (style === "hemat") {
    return "Hemat";
  }

  return "Balanced";
}

function readPlan(input: string | undefined): TripPlan | null {
  if (!input) {
    return null;
  }

  try {
    const decoded = Buffer.from(decodeURIComponent(input), "base64url").toString("utf8");
    return JSON.parse(decoded) as TripPlan;
  } catch {
    return null;
  }
}

export default async function PreviewPage({
  searchParams
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const params = await searchParams;
  const plan = readPlan(params.plan);

  if (!plan) {
    return (
      <main className="shell grain min-h-screen pb-16">
        <Header />
        <section className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h1 className="font-display text-4xl text-slate-900">Plan tidak ditemukan</h1>
          <p className="font-body mt-4 text-slate-600">
            Generate ulang itinerary dari planner agar preview bisa ditampilkan.
          </p>
          <Link href="/trips/new" className="mt-8 inline-flex rounded-full bg-teal-700 px-6 py-3 text-sm font-semibold text-white">
            Kembali ke planner
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="shell grain min-h-screen pb-16">
      <Header />
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="card rounded-[2rem] p-6 lg:p-8">
            <p className="font-body text-sm uppercase tracking-[0.22em] text-teal-700">Itinerary</p>
            <h1 className="font-display mt-2 text-4xl text-slate-900">
              {plan.input.city}, {plan.input.days} hari untuk {plan.input.travelers} traveler
            </h1>
            <p className="font-body mt-4 text-base leading-7 text-slate-600">{plan.summary}</p>
            <div className="font-body mt-6 flex flex-wrap gap-3 text-sm text-slate-600">
              <span className="pill rounded-full px-4 py-2">Style: {formatStyle(plan.input.style)}</span>
              <span className="pill rounded-full px-4 py-2">Budget: {formatCurrency(plan.input.budget)}</span>
              <span className="pill rounded-full px-4 py-2">Status: {plan.budget.status === "safe" ? "Aman" : "Melebihi budget"}</span>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white/70 p-4">
                <p className="font-body text-xs uppercase tracking-[0.16em] text-slate-500">Hari</p>
                <p className="font-display mt-2 text-3xl text-slate-900">{plan.days.length}</p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white/70 p-4">
                <p className="font-body text-xs uppercase tracking-[0.16em] text-slate-500">Stop</p>
                <p className="font-display mt-2 text-3xl text-slate-900">
                  {plan.days.reduce((count, day) => count + day.stops.length, 0)}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white/70 p-4">
                <p className="font-body text-xs uppercase tracking-[0.16em] text-slate-500">Sisa budget</p>
                <p className={`font-display mt-2 text-3xl ${plan.budget.remaining >= 0 ? "text-teal-700" : "text-rose-600"}`}>
                  {plan.budget.remaining >= 0 ? formatCurrency(plan.budget.remaining) : `- ${formatCurrency(Math.abs(plan.budget.remaining))}`}
                </p>
              </div>
            </div>
          </div>

          <aside className="card rounded-[2rem] p-6 lg:sticky lg:top-6 lg:h-fit lg:p-8">
            <p className="font-body text-sm uppercase tracking-[0.22em] text-amber-600">Budget Planner</p>
            <div className="font-body mt-5 space-y-4 text-sm text-slate-700">
              <div className="flex justify-between">
                <span>Tiket</span>
                <strong>{formatCurrency(plan.budget.tickets)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Makan</span>
                <strong>{formatCurrency(plan.budget.food)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Transport</span>
                <strong>{formatCurrency(plan.budget.transport)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Buffer</span>
                <strong>{formatCurrency(plan.budget.buffer)}</strong>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <div className="flex justify-between text-base">
                  <span>Total</span>
                  <strong>{formatCurrency(plan.budget.total)}</strong>
                </div>
                <div className="mt-2 flex justify-between text-base">
                  <span>Sisa budget</span>
                  <strong className={plan.budget.remaining >= 0 ? "text-teal-700" : "text-rose-600"}>
                    {plan.budget.remaining >= 0 ? formatCurrency(plan.budget.remaining) : `- ${formatCurrency(Math.abs(plan.budget.remaining))}`}
                  </strong>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-5">
            {plan.days.map((day) => (
              <article key={day.dayLabel} className="card rounded-[2rem] p-6 lg:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-body text-sm uppercase tracking-[0.2em] text-slate-500">{day.dayLabel}</p>
                    <h2 className="font-display mt-2 text-3xl text-slate-900">{day.theme}</h2>
                  </div>
                  <div className="font-body rounded-full bg-slate-950 px-4 py-2 text-sm text-white">
                    Estimasi {formatCurrency(day.subtotal)}
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {day.stops.map((stop, stopIndex) => (
                    <div key={`${day.dayLabel}-${stop.destinationId}-${stopIndex}`} className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-white/70 p-5 md:grid-cols-[110px_1fr]">
                      <div className="flex items-start md:justify-center">
                        <div className="rounded-[1.25rem] bg-teal-50 px-4 py-3 text-center">
                          <p className="font-body text-xs uppercase tracking-[0.14em] text-teal-700">Mulai</p>
                          <p className="font-display mt-1 text-2xl text-slate-900">{stop.time}</p>
                        </div>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <h3 className="font-display text-2xl text-slate-900">{stop.title}</h3>
                            <p className="font-body mt-2 text-sm leading-6 text-slate-600">{stop.notes}</p>
                          </div>
                          <div className="rounded-full border border-slate-200 bg-white px-4 py-2 font-body text-sm font-semibold text-slate-700">
                            {formatCurrency(stop.cost)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="space-y-6 lg:sticky lg:top-6 lg:h-fit">
            <section className="card rounded-[2rem] p-6 lg:p-8">
              <p className="font-body text-sm uppercase tracking-[0.22em] text-teal-700">Ringkasan Akses Destinasi</p>
              <div className="mt-5 grid gap-3">
                {plan.cart.map((ticket) => (
                  <div key={ticket.destinationId} className="rounded-[1.5rem] border border-slate-200 bg-white/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-display text-2xl text-slate-900">{ticket.title}</h3>
                        <p className="font-body text-xs uppercase tracking-[0.16em] text-slate-500">
                          {ticket.qrCodeHash}
                        </p>
                      </div>
                      <span className="font-body rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                        {ticket.status}
                      </span>
                    </div>
                    <p className="font-body mt-2 text-sm text-slate-600">
                      Estimasi biaya masuk: {formatCurrency(ticket.ticketPrice)}. Simpan kode referensi ini untuk memudahkan pencatatan trip dan koordinasi rombongan.
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="card rounded-[2rem] p-6 lg:p-8">
              <p className="font-body text-sm uppercase tracking-[0.22em] text-amber-600">Rekomendasi Optimasi</p>
              <div className="mt-4 space-y-3">
                {plan.suggestions.map((suggestion) => (
                  <div key={suggestion} className="font-body rounded-[1.25rem] border border-slate-200 bg-white/70 p-4 text-sm leading-6 text-slate-700">
                    {suggestion}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </section>
    </main>
  );
}
