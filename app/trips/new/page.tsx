import { Header } from "@/components/header";
import { PlannerForm } from "@/components/planner-form";

export default function NewTripPage() {
  return (
    <main className="shell grain min-h-screen pb-16">
      <Header />
      <section className="mx-auto w-full max-w-5xl px-6 py-12 lg:px-10">
        <div className="mb-8 max-w-3xl">
          <p className="font-body text-sm uppercase tracking-[0.24em] text-teal-700">Trip Setup</p>
          <h1 className="font-display mt-2 text-5xl leading-tight text-slate-900">
            Isi preferensi perjalanan, lalu biarkan TRABAS menyusun ritme trip-nya.
          </h1>
          <p className="font-body mt-4 text-base leading-7 text-slate-600">
            Tulis lokasi sedetail yang kamu butuhkan, lalu dapatkan susunan kunjungan, estimasi biaya, dan rekomendasi
            perjalanan dalam satu alur.
          </p>
        </div>
        <PlannerForm />
      </section>
    </main>
  );
}
