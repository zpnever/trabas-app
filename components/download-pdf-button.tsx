"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";
import { TripPlan } from "@/lib/types";

function formatCurrency(value: number) {
  return `Rp${new Intl.NumberFormat("id-ID").format(value)}`;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function addWrappedText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

export function DownloadPdfButton({ plan }: { plan: TripPlan }) {
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleDownload() {
    try {
      setIsGenerating(true);
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 48;
      const maxWidth = pageWidth - margin * 2;
      let y = margin;

      const ensureSpace = (needed = 80) => {
        if (y + needed > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
      };

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      y = addWrappedText(doc, `TRABAS Itinerary - ${plan.input.city}`, margin, y, maxWidth, 28);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      y += 6;
      y = addWrappedText(
        doc,
        `${plan.input.days} hari | ${plan.input.travelers} traveler | Budget ${formatCurrency(plan.input.budget)}`,
        margin,
        y,
        maxWidth,
        16
      );
      y = addWrappedText(doc, plan.summary, margin, y + 10, maxWidth, 16);

      y += 14;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Budget Summary", margin, y);
      y += 18;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const budgetLines = [
        `Tiket: ${formatCurrency(plan.budget.tickets)}`,
        `Makan: ${formatCurrency(plan.budget.food)}`,
        `Transport: ${formatCurrency(plan.budget.transport)}`,
        `Buffer: ${formatCurrency(plan.budget.buffer)}`,
        `Total: ${formatCurrency(plan.budget.total)}`,
        `Sisa budget: ${plan.budget.remaining >= 0 ? formatCurrency(plan.budget.remaining) : `- ${formatCurrency(Math.abs(plan.budget.remaining))}`}`
      ];
      for (const line of budgetLines) {
        ensureSpace(18);
        doc.text(line, margin, y);
        y += 16;
      }

      for (const day of plan.days) {
        ensureSpace(90);
        y += 8;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.text(`${day.dayLabel} - ${day.theme}`, margin, y);
        y += 18;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text(`Estimasi hari: ${formatCurrency(day.subtotal)}`, margin, y);
        y += 18;

        for (const stop of day.stops) {
          ensureSpace(90);
          doc.setFont("helvetica", "bold");
          doc.text(`${stop.time} | ${stop.title}`, margin, y);
          y += 14;

          doc.setFont("helvetica", "normal");
          y = addWrappedText(doc, stop.address, margin, y, maxWidth, 14);
          y = addWrappedText(doc, stop.notes, margin, y + 2, maxWidth, 14);
          y = addWrappedText(doc, `Total stop: ${formatCurrency(stop.cost)}`, margin, y + 2, maxWidth, 14);
          y = addWrappedText(doc, `Google Maps: ${stop.mapsUrl}`, margin, y + 2, maxWidth, 14);
          y += 8;
        }
      }

      if (plan.suggestions.length > 0) {
        ensureSpace(100);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Rekomendasi Optimasi", margin, y);
        y += 18;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        for (const suggestion of plan.suggestions) {
          ensureSpace(50);
          y = addWrappedText(doc, `- ${suggestion}`, margin, y, maxWidth, 14);
          y += 4;
        }
      }

      doc.save(`trabas-itinerary-${slugify(plan.input.city)}-${plan.input.days}h.pdf`);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isGenerating}
      className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 font-body text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
    >
      {isGenerating ? "Membuat PDF..." : "Download PDF"}
    </button>
  );
}
