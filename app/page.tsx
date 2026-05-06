import Link from "next/link";
import { Header } from "@/components/header";
import { PlannerForm } from "@/components/planner-form";

const highlights = [
  "Dynamic route optimization untuk micro-trip 1-3 hari",
  "Budget planner dengan warning over-budget dan alternatif lebih hemat",
  "Simulasi pre-order tiket dan QR code untuk check-in lebih cepat"
];

const milestones = [
  "Sprint 1: Landing page, form preferensi, CTA itinerary.",
  "Sprint 2: Integrasi Gemini untuk itinerary generation dan reroute logic.",
  "Sprint 3: Supabase untuk destinasi, trip history, dan cart tiket.",
  "Sprint 4: Export PDF/gambar dan dashboard mobile premium."
];

export default function HomePage() {
  return (
    <main className="shell grain min-h-screen pb-16">
      <Header />

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:px-10 lg:py-14">
        <div className="space-y-8">
          <div className="pill font-body inline-flex rounded-full px-4 py-2 text-xs uppercase tracking-[0.24em] text-teal-800">
            Single-Click Trip Solution
          </div>
          <div className="max-w-3xl">
            <h1 className="font-display text-5xl leading-tight text-slate-900 md:text-7xl">
              Arsitek perjalanan pribadi untuk trip yang efisien, hemat, dan tidak bikin lelah.
            </h1>
            <p className="font-body mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              TRABAS menyatukan itinerary otomatis, validasi jam operasional, simulasi budget, dan keranjang tiket dalam
              satu alur yang ringan untuk traveler digital.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {highlights.map((item) => (
              <div key={item} className="card rounded-[1.75rem] p-5">
                <p className="font-body text-sm leading-6 text-slate-700">{item}</p>
              </div>
            ))}
          </div>

          <div className="font-body flex flex-wrap gap-4">
            <Link
              href="#planner"
              className="rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
            >
              Coba planner sekarang
            </Link>
            <Link href="/trips/new" className="rounded-full border border-slate-300 px-6 py-3 text-sm text-slate-700">
              Buka halaman planner penuh
            </Link>
          </div>
        </div>

        <div className="card rounded-[2rem] p-6 lg:p-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-body text-sm uppercase tracking-[0.22em] text-slate-500">Core Promise</p>
              <h2 className="font-display mt-2 text-3xl text-slate-900">Planning fatigue keluar dari itinerary</h2>
            </div>
            <div className="font-body rounded-full bg-teal-700 px-4 py-2 text-xs font-semibold text-white">
              {"< 5 detik"}
            </div>
          </div>

          <div className="mt-8 grid gap-4">
            <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
              <p className="font-body text-sm text-slate-300">AI Input Context</p>
              <p className="font-body mt-2 text-sm leading-6 text-slate-100">
                Kota, durasi, budget, preferensi, jam buka-tutup, dan biaya per orang.
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-white p-5">
              <p className="font-body text-sm text-slate-500">Output MVP</p>
              <p className="font-body mt-2 text-sm leading-6 text-slate-700">
                Itinerary per hari, budget breakdown, daftar tiket, dan rekomendasi optimasi.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="fitur" className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10">
        <div className="mb-6">
          <p className="font-body text-sm uppercase tracking-[0.22em] text-teal-700">Feature Set</p>
          <h2 className="font-display mt-2 text-4xl text-slate-900">Fitur MVP yang langsung merefleksikan PRD</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <article className="card rounded-[1.75rem] p-6">
            <h3 className="font-display text-2xl">AI Itinerary Engine</h3>
            <p className="font-body mt-3 text-sm leading-6 text-slate-600">
              Versi awal memakai generator lokal agar flow aplikasi hidup dulu, lalu mudah diganti ke Gemini lewat Server Actions.
            </p>
          </article>
          <article className="card rounded-[1.75rem] p-6">
            <h3 className="font-display text-2xl">Budget Dashboard</h3>
            <p className="font-body mt-3 text-sm leading-6 text-slate-600">
              Breakdown tiket, makan, transport, buffer, dan status aman atau over-budget dalam satu panel.
            </p>
          </article>
          <article className="card rounded-[1.75rem] p-6">
            <h3 className="font-display text-2xl">Pre-Order Ticketing</h3>
            <p className="font-body mt-3 text-sm leading-6 text-slate-600">
              Daftar tiket dan QR hash simulasi disiapkan sebagai fondasi checkout dan scan di tahap berikutnya.
            </p>
          </article>
        </div>
      </section>

      <section id="planner" className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10">
        <PlannerForm />
      </section>

      <section id="roadmap" className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10">
        <div className="card rounded-[2rem] p-6 lg:p-8">
          <p className="font-body text-sm uppercase tracking-[0.22em] text-amber-600">Delivery Path</p>
          <h2 className="font-display mt-2 text-4xl text-slate-900">Roadmap implementasi yang masuk akal</h2>
          <div className="mt-6 grid gap-3">
            {milestones.map((item) => (
              <div key={item} className="font-body rounded-[1.25rem] border border-slate-200 bg-white/70 px-4 py-4 text-sm text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
