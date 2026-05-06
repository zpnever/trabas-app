import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TRABAS | Travel Bebas",
  description: "Asisten perjalanan pintar untuk itinerary, budget, dan e-ticketing."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
